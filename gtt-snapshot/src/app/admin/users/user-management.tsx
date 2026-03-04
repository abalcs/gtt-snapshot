"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'advisor';
  status: 'active' | 'deactivated';
  must_change_password: boolean;
  created_at: string;
  invited_by: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<'advisor' | 'admin'>('advisor');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetTempPassword, setResetTempPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, password: invitePassword, role: inviteRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`User created: ${inviteName} (${inviteEmail}). They will be asked to set a new password on first login.`);
        setInviteEmail("");
        setInviteName("");
        setInvitePassword("");
        setInviteRole("advisor");
        fetchUsers();
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update user");
      }
    } catch {
      setError("Something went wrong");
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'advisor' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update role");
      }
    } catch {
      setError("Something went wrong");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetTempPassword || resetTempPassword.length < 6) {
      setError("Temporary password must be at least 6 characters");
      return;
    }
    setResetting(true);
    setError("");
    setResetMessage("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'reset_password', temp_password: resetTempPassword }),
      });

      if (res.ok) {
        setResetMessage(`Password reset for user. Share this temporary password: ${resetTempPassword}`);
        setResetUserId(null);
        setResetTempPassword("");
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create user form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="First Last"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@audleytravel.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <Input
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Initial password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'advisor' | 'admin')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-9"
                >
                  <option value="advisor">Advisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={inviting}>
                {inviting ? "Creating..." : "Create User"}
              </Button>
              <p className="text-xs text-muted-foreground">User will be required to set a new password on first login.</p>
            </div>
          </form>
          {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {resetMessage && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{resetMessage}</p>
              <p className="text-xs text-green-600 mt-1">The user will be required to set a new password and will receive new recovery codes.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Name</th>
                    <th className="text-left py-2 px-3 font-medium">Email</th>
                    <th className="text-left py-2 px-3 font-medium">Role</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-right py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        {u.name}
                        {u.must_change_password && (
                          <span className="ml-2 text-xs text-amber-600">(pending setup)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{u.email}</td>
                      <td className="py-2 px-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={u.status === 'active' ? 'outline' : 'destructive'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {resetUserId === u.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={resetTempPassword}
                                onChange={(e) => setResetTempPassword(e.target.value)}
                                placeholder="Temp password"
                                className="w-32 h-8 text-xs"
                                minLength={6}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleResetPassword(u.id)}
                                disabled={resetting || resetTempPassword.length < 6}
                              >
                                {resetting ? "..." : "Reset"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setResetUserId(null); setResetTempPassword(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleRole(u.id, u.role)}
                              >
                                {u.role === 'admin' ? 'Make Advisor' : 'Make Admin'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setResetUserId(u.id); setResetTempPassword(""); setResetMessage(""); }}
                              >
                                Reset Password
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(u.id, u.status)}
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
