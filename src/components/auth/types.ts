// src/components/auth/types.ts

export type AuthMode = "login" | "register" | "forgot" | "verify" | "newpass" | "success";

export interface FormState {
  name: string;
  email: string;
  password: string;
  confirm: string;
}
