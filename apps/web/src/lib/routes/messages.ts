export function messagesInboxPath(): string {
  return "/messages/";
}

export function messageThreadPath(conversationId: string): string {
  return `/messages/thread/?id=${encodeURIComponent(conversationId)}`;
}

export function newMessagePath(): string {
  return "/messages/?new=1";
}
