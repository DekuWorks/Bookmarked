const APPLE_ROOT_CA_G3_SHA256 =
  "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";

type JsonObject = Record<string, unknown>;
type NamedCurve = "P-256" | "P-384";
type HashName = "SHA-256" | "SHA-384";

type DerElement = {
  tag: number;
  start: number;
  headerEnd: number;
  contentStart: number;
  contentEnd: number;
  end: number;
};

type ParsedCertificate = {
  der: Uint8Array;
  fingerprintSha256: string;
  tbsCertificate: Uint8Array;
  signatureDer: Uint8Array;
  signatureHash: HashName;
  subjectPublicKeyInfo: Uint8Array;
  curve: NamedCurve;
  notBefore: Date;
  notAfter: Date;
};

export type VerifiedAppleJws<TPayload extends object = JsonObject> = {
  header: JsonObject;
  payload: TPayload;
  certificateFingerprints: string[];
};

export class AppleJwsVerificationError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = "AppleJwsVerificationError";
  }
}

function fail(message: string, code: string): never {
  throw new AppleJwsVerificationError(message, code);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return base64ToBytes(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function parseJsonSegment(value: string): JsonObject {
  try {
    const parsed = JSON.parse(utf8Decode(base64UrlToBytes(value)));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      fail("JWS segment is not a JSON object", "invalid_json_segment");
    }
    return parsed as JsonObject;
  } catch (error) {
    if (error instanceof AppleJwsVerificationError) throw error;
    fail("JWS segment is not valid JSON", "invalid_json_segment");
  }
}

export function decodeAppleJwsPayload<TPayload extends object = JsonObject>(
  jws: string
): TPayload | null {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;

  try {
    return parseJsonSegment(parts[1]) as TPayload;
  } catch {
    return null;
  }
}

function readDerElement(bytes: Uint8Array, offset = 0): DerElement {
  if (offset >= bytes.length) fail("DER element is truncated", "invalid_der");

  const start = offset;
  const tag = bytes[offset++];
  if (offset >= bytes.length) fail("DER length is missing", "invalid_der");

  const lengthByte = bytes[offset++];
  let length = lengthByte;

  if ((lengthByte & 0x80) !== 0) {
    const lengthBytes = lengthByte & 0x7f;
    if (lengthBytes === 0 || lengthBytes > 4) {
      fail("DER length is not supported", "invalid_der");
    }
    if (offset + lengthBytes > bytes.length) {
      fail("DER length is truncated", "invalid_der");
    }

    length = 0;
    for (let i = 0; i < lengthBytes; i += 1) {
      length = (length << 8) | bytes[offset++];
    }
  }

  const contentStart = offset;
  const contentEnd = contentStart + length;
  if (contentEnd > bytes.length) fail("DER content is truncated", "invalid_der");

  return {
    tag,
    start,
    headerEnd: contentStart,
    contentStart,
    contentEnd,
    end: contentEnd,
  };
}

function readChildren(bytes: Uint8Array, parent: DerElement): DerElement[] {
  const children: DerElement[] = [];
  let offset = parent.contentStart;

  while (offset < parent.contentEnd) {
    const child = readDerElement(bytes, offset);
    children.push(child);
    offset = child.end;
  }

  if (offset !== parent.contentEnd) fail("DER children are malformed", "invalid_der");
  return children;
}

function sliceElement(bytes: Uint8Array, element: DerElement): Uint8Array {
  return bytes.slice(element.start, element.end);
}

function contentBytes(bytes: Uint8Array, element: DerElement): Uint8Array {
  return bytes.slice(element.contentStart, element.contentEnd);
}

function parseOid(bytes: Uint8Array, element: DerElement): string {
  if (element.tag !== 0x06) fail("Expected object identifier", "invalid_der");

  const oidBytes = contentBytes(bytes, element);
  if (oidBytes.length === 0) fail("Object identifier is empty", "invalid_der");

  const values = [Math.floor(oidBytes[0] / 40), oidBytes[0] % 40];
  let value = 0;

  for (let i = 1; i < oidBytes.length; i += 1) {
    value = (value << 7) | (oidBytes[i] & 0x7f);
    if ((oidBytes[i] & 0x80) === 0) {
      values.push(value);
      value = 0;
    }
  }

  return values.join(".");
}

function curveFromSpki(spki: Uint8Array): NamedCurve {
  const sequence = readDerElement(spki);
  const children = readChildren(spki, sequence);
  const algorithm = children[0];
  const algorithmChildren = readChildren(spki, algorithm);
  const curveOid = algorithmChildren[1] ? parseOid(spki, algorithmChildren[1]) : "";

  if (curveOid === "1.2.840.10045.3.1.7") return "P-256";
  if (curveOid === "1.3.132.0.34") return "P-384";

  fail(`Unsupported ECDSA curve ${curveOid || "(missing)"}`, "unsupported_curve");
}

function hashFromSignatureAlgorithm(bytes: Uint8Array, element: DerElement): HashName {
  const children = readChildren(bytes, element);
  const oid = children[0] ? parseOid(bytes, children[0]) : "";

  if (oid === "1.2.840.10045.4.3.2") return "SHA-256";
  if (oid === "1.2.840.10045.4.3.3") return "SHA-384";

  fail(`Unsupported certificate signature algorithm ${oid || "(missing)"}`, "unsupported_signature");
}

function parseTime(bytes: Uint8Array, element: DerElement): Date {
  const value = utf8Decode(contentBytes(bytes, element));
  let year: number;
  let month: number;
  let day: number;
  let hour: number;
  let minute: number;
  let second: number;

  if (element.tag === 0x17) {
    const match = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(value);
    if (!match) fail("Invalid UTCTime value", "invalid_certificate_time");
    const twoDigitYear = Number(match[1]);
    year = twoDigitYear >= 50 ? 1900 + twoDigitYear : 2000 + twoDigitYear;
    month = Number(match[2]);
    day = Number(match[3]);
    hour = Number(match[4]);
    minute = Number(match[5]);
    second = Number(match[6]);
  } else if (element.tag === 0x18) {
    const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(value);
    if (!match) fail("Invalid GeneralizedTime value", "invalid_certificate_time");
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
    hour = Number(match[4]);
    minute = Number(match[5]);
    second = Number(match[6]);
  } else {
    fail("Unsupported certificate time value", "invalid_certificate_time");
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function parseValidity(bytes: Uint8Array, element: DerElement): { notBefore: Date; notAfter: Date } {
  const children = readChildren(bytes, element);
  if (children.length < 2) fail("Certificate validity is malformed", "invalid_der");

  return {
    notBefore: parseTime(bytes, children[0]),
    notAfter: parseTime(bytes, children[1]),
  };
}

function bitStringPayload(bytes: Uint8Array, element: DerElement): Uint8Array {
  if (element.tag !== 0x03) fail("Expected BIT STRING", "invalid_der");
  const value = contentBytes(bytes, element);
  if (value.length < 2 || value[0] !== 0) {
    fail("Unsupported BIT STRING encoding", "invalid_der");
  }
  return value.slice(1);
}

function unsignedIntegerBytes(bytes: Uint8Array, element: DerElement): Uint8Array {
  if (element.tag !== 0x02) fail("Expected INTEGER", "invalid_der");
  let value = contentBytes(bytes, element);
  while (value.length > 1 && value[0] === 0) {
    value = value.slice(1);
  }
  return value;
}

function derEcdsaSignatureToRaw(signatureDer: Uint8Array, partLength: number): Uint8Array {
  const sequence = readDerElement(signatureDer);
  if (sequence.tag !== 0x30) fail("ECDSA signature is not a sequence", "invalid_signature");

  const children = readChildren(signatureDer, sequence);
  if (children.length !== 2) fail("ECDSA signature is malformed", "invalid_signature");

  const raw = new Uint8Array(partLength * 2);
  const r = unsignedIntegerBytes(signatureDer, children[0]);
  const s = unsignedIntegerBytes(signatureDer, children[1]);

  if (r.length > partLength || s.length > partLength) {
    fail("ECDSA signature component is too large", "invalid_signature");
  }

  raw.set(r, partLength - r.length);
  raw.set(s, partLength * 2 - s.length);
  return raw;
}

function curvePartLength(curve: NamedCurve): number {
  return curve === "P-384" ? 48 : 32;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function parseCertificate(base64Der: string): Promise<ParsedCertificate> {
  const der = base64ToBytes(base64Der);
  const certificate = readDerElement(der);
  if (certificate.tag !== 0x30) fail("Certificate is not a sequence", "invalid_certificate");

  const children = readChildren(der, certificate);
  if (children.length < 3) fail("Certificate is malformed", "invalid_certificate");

  const tbsCertificate = children[0];
  const signatureAlgorithm = children[1];
  const signatureValue = children[2];
  const tbsChildren = readChildren(der, tbsCertificate);
  const hasVersion = tbsChildren[0]?.tag === 0xa0;
  const validity = tbsChildren[hasVersion ? 4 : 3];
  const subjectPublicKeyInfo = tbsChildren[hasVersion ? 6 : 5];

  if (!validity || !subjectPublicKeyInfo) {
    fail("Certificate TBSCertificate is malformed", "invalid_certificate");
  }

  const spki = sliceElement(der, subjectPublicKeyInfo);
  const signatureDer = bitStringPayload(der, signatureValue);
  const parsedValidity = parseValidity(der, validity);

  return {
    der,
    fingerprintSha256: await sha256Hex(der),
    tbsCertificate: sliceElement(der, tbsCertificate),
    signatureDer,
    signatureHash: hashFromSignatureAlgorithm(der, signatureAlgorithm),
    subjectPublicKeyInfo: spki,
    curve: curveFromSpki(spki),
    notBefore: parsedValidity.notBefore,
    notAfter: parsedValidity.notAfter,
  };
}

async function importEcdsaPublicKey(certificate: ParsedCertificate): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    certificate.subjectPublicKeyInfo,
    { name: "ECDSA", namedCurve: certificate.curve },
    false,
    ["verify"]
  );
}

async function verifyCertificateSignature(
  certificate: ParsedCertificate,
  issuer: ParsedCertificate
): Promise<boolean> {
  const key = await importEcdsaPublicKey(issuer);
  const rawSignature = derEcdsaSignatureToRaw(
    certificate.signatureDer,
    curvePartLength(issuer.curve)
  );

  return crypto.subtle.verify(
    { name: "ECDSA", hash: certificate.signatureHash },
    key,
    rawSignature,
    certificate.tbsCertificate
  );
}

async function verifyCertificateChain(
  x5c: string[],
  now: Date
): Promise<ParsedCertificate[]> {
  if (x5c.length < 2) {
    fail("Apple JWS certificate chain is missing", "missing_certificate_chain");
  }

  const chain = await Promise.all(x5c.map((certificate) => parseCertificate(certificate)));
  const trustedRoot = chain[chain.length - 1];

  if (trustedRoot.fingerprintSha256 !== APPLE_ROOT_CA_G3_SHA256) {
    fail("Apple JWS certificate chain is not rooted in Apple Root CA - G3", "untrusted_root");
  }

  for (const certificate of chain) {
    if (now < certificate.notBefore || now > certificate.notAfter) {
      fail("Apple JWS certificate is outside its validity window", "certificate_expired");
    }
  }

  for (let i = 0; i < chain.length - 1; i += 1) {
    const valid = await verifyCertificateSignature(chain[i], chain[i + 1]);
    if (!valid) fail("Apple JWS certificate chain signature is invalid", "invalid_certificate_chain");
  }

  const rootIsSelfSigned = await verifyCertificateSignature(trustedRoot, trustedRoot);
  if (!rootIsSelfSigned) {
    fail("Apple Root CA - G3 certificate signature is invalid", "invalid_certificate_chain");
  }

  return chain;
}

export async function verifyAppleJws<TPayload extends object = JsonObject>(
  jws: string,
  options: { now?: Date } = {}
): Promise<VerifiedAppleJws<TPayload>> {
  const parts = jws.split(".");
  if (parts.length !== 3) fail("Apple JWS must have three segments", "invalid_jws");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJsonSegment(encodedHeader);
  const payload = parseJsonSegment(encodedPayload) as TPayload;

  if (header.alg !== "ES256") {
    fail("Apple JWS must use ES256", "unsupported_jws_algorithm");
  }

  if (!Array.isArray(header.x5c) || !header.x5c.every((item) => typeof item === "string")) {
    fail("Apple JWS is missing an x5c certificate chain", "missing_certificate_chain");
  }

  const chain = await verifyCertificateChain(header.x5c, options.now ?? new Date());
  const leaf = chain[0];
  if (leaf.curve !== "P-256") {
    fail("Apple JWS leaf certificate must use P-256", "unsupported_curve");
  }

  const key = await importEcdsaPublicKey(leaf);
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlToBytes(encodedSignature);
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signature,
    data
  );

  if (!valid) fail("Apple JWS signature is invalid", "invalid_jws_signature");

  return {
    header,
    payload,
    certificateFingerprints: chain.map((certificate) => certificate.fingerprintSha256),
  };
}
