export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  // Better Auth migration: "google" retained for legacy rows; live values are
  // "email" (credential trainers) and "guest" (anonymous QR-join participants).
  authProvider: "google" | "email" | "guest";
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface JWTPayload {
  sub: string; // userId
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export type PublicUser = Pick<User, "id" | "name" | "email" | "avatarUrl" | "authProvider"> & {
  createdAt?: Date | string;
};
