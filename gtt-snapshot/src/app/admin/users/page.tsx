import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { UserManagement } from "./user-management";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">Invite new users and manage existing accounts</p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Admin
        </Link>
      </div>
      <UserManagement />
    </div>
  );
}
