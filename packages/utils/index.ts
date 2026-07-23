export {
  CURSE_WORDS,
  containsProfanity,
  normalizeProfanityText,
} from "./profanity";

export {
  canAccessFeature,
  isPremiumSubscriber,
  type SubscriptionAccess,
} from "./subscription";

export {
  MESSAGE_ATTACHMENT_BUCKET,
  parseMessageAttachmentPath,
} from "./messageAttachments";

export {
  MAX_PAGE_COUNT,
  buildCompletionSessionPatch,
  buildCompletionUserBookPatch,
  countResolvedPagesRead,
  formatFinishActivityDetail,
  resolvePageCount,
  validateManualPageCount,
  type CompletionProgressPatch,
  type CompletionSessionPatch,
  type PageCountResolution,
  type PageCountSource,
  type PageCountStatus,
  type ResolvePageCountInput,
} from "./readingCompletion";

export {
  COMPLETION_TAGS,
  computeCompletionTags,
  mergeCompletionTags,
  type CompletionTag,
} from "./completionTags";

export {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_READING_GOAL,
  MAX_USERNAME_LENGTH,
  MIN_READING_GOAL,
  MIN_USERNAME_LENGTH,
  NOTIFICATION_PREF_KEYS,
  PREFERRED_LANGUAGE_CODES,
  SHELF_VISIBILITY_VALUES,
  USERNAME_PATTERN,
  parseFavoriteGenres,
  parsePreferredLanguage,
  validateBio,
  validateDisplayName,
  validateNotificationPreferences,
  validateReadingGoal,
  validateShelfVisibility,
  validateUsername,
  type NotificationPrefKey,
  type PreferredLanguageCode,
  type ShelfVisibilityValue,
  type ValidationResult,
} from "./profileValidation";
