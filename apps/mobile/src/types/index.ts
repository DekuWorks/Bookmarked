import type { Profile as SharedProfile } from "../../../../packages/types";

export type Profile = SharedProfile;

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  "forgot-password": undefined;
  "profile-setup": undefined;
};
