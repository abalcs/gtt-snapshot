import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "./user-queries";
import type { User } from "./types";

const DEV_USER: User = {
  id: "dev@local",
  email: "dev@local",
  name: "Dev User",
  password_hash: "",
  role: "admin",
  status: "active",
  must_change_password: false,
  recovery_codes: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  invited_by: null,
};

export async function requireAuth(): Promise<User> {
  if (process.env.BYPASS_AUTH === "true") return DEV_USER;

  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  const user = session ? await validateSession(session.value) : null;

  if (!user) {
    redirect("/login");
  }

  if (user.must_change_password) {
    redirect("/set-password");
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  if (process.env.BYPASS_AUTH === "true") return DEV_USER;

  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session) return null;
  return validateSession(session.value);
}
