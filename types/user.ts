export type UserRole = "Admin" | "Cashier";

export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}