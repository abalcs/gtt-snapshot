import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  if (session?.value !== "authenticated") {
    redirect("/admin/login");
  }
}
