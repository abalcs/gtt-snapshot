import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  // Try cookies() API first
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth");
  if (adminAuth?.value === "authenticated") {
    return;
  }

  // Fallback: parse Cookie header directly (adapter compatibility)
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") || "";
  const hasAuth = cookieHeader.split(";").some((c) =>
    c.trim().startsWith("admin_auth=authenticated")
  );
  if (hasAuth) {
    return;
  }

  redirect("/admin/login");
}
