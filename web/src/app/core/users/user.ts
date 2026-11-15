/** A user's public profile. */
export interface PublicProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  pronouns: string | null;
  joinDate: Date;
}

/** The private profile, only ever returned to the user themselves. */
export interface PrivateProfile extends PublicProfile {
  email: string;
}

/** PATCH /users/{id}: omitted fields stay unchanged, and `pronouns: null` clears them. */
export interface ProfileUpdate {
  username?: string;
  firstName?: string;
  lastName?: string;
  pronouns?: string | null;
}

/** The profile as the API sends it, with ISO date strings. */
export type PrivateProfileDto = Omit<PrivateProfile, 'joinDate'> & { joinDate: string };

export function toPrivateProfile(dto: PrivateProfileDto): PrivateProfile {
  return { ...dto, joinDate: new Date(dto.joinDate) };
}

/**
 * Username rules: 3-30 letters, digits, "_" and "." only (the API's rules), and lowercase
 * (enforced here; the API matches usernames case-insensitively).
 */
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;
