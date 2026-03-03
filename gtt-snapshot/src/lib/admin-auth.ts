import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "./user-queries";
import type { User } from "./types";

export async function requireAuth(): Promise<User> {
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
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (!session) return null;
  return validateSession(session.value);
}
