export const MESSAGE_QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👎"] as const;

export type MessageQuickReaction = (typeof MESSAGE_QUICK_REACTIONS)[number];
