/** Shared input length limits (mirror DB column checks where applicable). */

export const MAX_MESSAGE_BODY_LENGTH = 4000;
export const MAX_POST_BODY_LENGTH = 10000;
export const MAX_REVIEW_BODY_LENGTH = 20000;

export {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_READING_GOAL,
  MAX_USERNAME_LENGTH,
  MIN_READING_GOAL,
  MIN_USERNAME_LENGTH,
} from "@/lib/utils/profileValidation";
