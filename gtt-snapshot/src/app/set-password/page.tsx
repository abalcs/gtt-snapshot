import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/user-queries";
import { SetPasswordForm } from "./set-password-form";

export const dynamic = 'force-dynamic';

export default async function SetPasswordPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");
  const user = session ? await validateSession(session.value) : null;

  if (!user) {
    redirect("/login");
  }

  if (!user.must_change_password) {
    redirect("/");
  }

  return <SetPasswordForm />;
}
