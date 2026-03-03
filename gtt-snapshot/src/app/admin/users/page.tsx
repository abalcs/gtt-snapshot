import { requireAdmin } from "@/lib/admin-auth";
import { UserManagement } from "./user-management";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground">Invite new users and manage existing accounts</p>
      </div>
      <UserManagement />
    </div>
  );
}
