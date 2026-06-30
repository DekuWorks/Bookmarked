export type ThreadNode<T extends { id: string; parent_reply_id: string | null }> = T & {
  children: ThreadNode<T>[];
};

export function buildReplyThread<T extends { id: string; parent_reply_id: string | null }>(
  replies: T[]
): ThreadNode<T>[] {
  const nodes = new Map<string, ThreadNode<T>>();

  for (const reply of replies) {
    nodes.set(reply.id, { ...reply, children: [] });
  }

  const roots: ThreadNode<T>[] = [];

  for (const reply of replies) {
    const node = nodes.get(reply.id);
    if (!node) continue;

    if (reply.parent_reply_id) {
      const parent = nodes.get(reply.parent_reply_id);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots;
}
