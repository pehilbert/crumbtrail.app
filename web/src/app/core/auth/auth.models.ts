/** Returned by login, registration and refresh. */
export interface AuthResponse {
  id: string;
  accessToken: string;
}

/** POST /auth/login */
export interface LoginRequest {
  /** An email if it contains "@", otherwise a username. */
  login: string;
  password: string;
}

/** POST /users */
export interface RegisterRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  pronouns: string | null;
  email: string;
}
