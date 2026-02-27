import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth");
  if (adminAuth?.value !== "authenticated") {
    redirect("/admin/login");
  }
}
