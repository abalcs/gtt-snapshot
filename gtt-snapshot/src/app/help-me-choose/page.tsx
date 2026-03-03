import { HelpMeChooseClient } from "./help-me-choose-client";
import { requireAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function HelpMeChoosePage() {
  await requireAuth();
  return <HelpMeChooseClient />;
}
