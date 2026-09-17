export type UserRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "MATERIALISTA";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
}
``