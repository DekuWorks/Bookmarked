export type CoverPalette = {
  accent: string;
  washTop: string;
  washBottom: string;
};

function mixChannel(value: number, target: number, amount: number): number {
  return Math.round(value + (target - value) * amount);
}

function rgbString(r: number, g: number, b: number, alpha = 1): string {
  return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Sample a book cover image and derive a soft ambient palette for page backgrounds.
 */
export async function extractCoverPalette(coverUrl: string): Promise<CoverPalette | null> {
  if (!coverUrl || typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(image, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) continue;

          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const luminance = 0.299 * pr + 0.587 * pg + 0.114 * pb;
          if (luminance < 30 || luminance > 235) continue;

          r += pr;
          g += pg;
          b += pb;
          count += 1;
        }

        if (!count) {
          resolve(null);
          return;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        const isDark = document.documentElement.dataset.theme === "dark";
        const bgTarget = isDark ? { r: 26, g: 20, b: 38 } : { r: 250, g: 248, b: 252 };

        resolve({
          accent: rgbString(r, g, b),
          washTop: rgbString(
            mixChannel(r, bgTarget.r, 0.55),
            mixChannel(g, bgTarget.g, 0.55),
            mixChannel(b, bgTarget.b, 0.55),
            isDark ? 0.95 : 0.88
          ),
          washBottom: rgbString(bgTarget.r, bgTarget.g, bgTarget.b, isDark ? 1 : 0.98),
        });
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = coverUrl;
  });
}
