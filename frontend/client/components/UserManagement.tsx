import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

interface User {
  id: number;
  email: string;
  role: string;
}

export default function UserManagement() {
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create User modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Edit Role modal state
  const [showRole, setShowRole] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState("user");

  // Reset Password modal state
  const [showReset, setShowReset] = useState(false);
  const [resetUserEmail, setResetUserEmail] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  // Delete confirm modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeader: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  // Fetch current user info
  useEffect(() => {
    (async () => {
      try {
        const meData = await api<User>("/auth/me");
        setMe(meData);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch users if admin
  useEffect(() => {
    if (me?.role === "admin") {
      setLoading(true);
      setError(null);
      api<User[]>("/admin/users")
        .then(setUsers)
        .catch((e) => setError(e.message || "Failed to load users"))
        .finally(() => setLoading(false));
    }
  }, [me]);

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await api(`/admin/users/${deletingUser.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setShowDelete(false);
      setDeletingUser(null);
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const openRoleModal = (user: User) => {
    setEditingUserId(user.id);
    setEditingRole(user.role);
    setShowRole(true);
  };

  const saveRole = async () => {
    if (editingUserId == null) return;
    try {
      await api(`/admin/users/${editingUserId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: editingRole }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId ? { ...u, role: editingRole } : u,
        ),
      );
      setShowRole(false);
    } catch (e: any) {
      alert(e.message || "Role update failed");
    }
  };

  const openResetModal = (user: User) => {
    setResetUserEmail(user.email);
    setTemporaryPassword(null);
    setShowReset(true);
  };

  const resetPassword = async () => {
    if (!resetUserEmail) return;
    try {
      const res = await fetch(`/api/admin/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ email: resetUserEmail, temporary: true }),
      });
      if (!res.ok) throw new Error(`Failed to reset password (${res.status})`);
      const data = await res.json();
      // Expecting API to return { tempPassword: string }
      setTemporaryPassword(data.tempPassword || "(Check email)");
    } catch (e: any) {
      alert(e.message || "Reset failed");
    }
  };

  const createUser = async () => {
    try {
      const created = await api<User>(`/admin/users`, {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      setUsers((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
    } catch (e: any) {
      alert(e.message || "Create failed");
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="p-8 space-y-8">
      <div>
        {error && (
          <div className="text-red-600 mb-2">
            <p>{error}</p>
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetch("/api/admin/users", { headers: { ...authHeader } })
                  .then((res) => {
                    if (!res.ok)
                      throw new Error(`Failed to fetch users (${res.status})`);
                    return res.json();
                  })
                  .then((data) => setUsers(data))
                  .catch((e) => setError(e.message || "Failed to load users"))
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => setShowCreate(true)}>Create User</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border px-2 py-1">ID</TableHead>
              <TableHead className="border px-2 py-1">Email</TableHead>
              <TableHead className="border px-2 py-1">Role</TableHead>
              <TableHead className="border px-2 py-1">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="border px-2 py-1">{user.id}</TableCell>
                <TableCell className="border px-2 py-1">{user.email}</TableCell>
                <TableCell className="border px-2 py-1">{user.role}</TableCell>
                <TableCell className="border px-2 py-1 space-x-2">
                  <Button size="sm" onClick={() => openRoleModal(user)}>
                    Edit Role
                  </Button>
                  <Button size="sm" onClick={() => openResetModal(user)}>
                    Reset Password
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(user)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Create User Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Create a new account with the selected role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm">Email</label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm">Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm">Role</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={createUser}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={showRole} onOpenChange={setShowRole}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Change the user role. This affects permissions immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="block text-sm">Role</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={editingRole}
                onChange={(e) => setEditingRole(e.target.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowRole(false)}>
                Cancel
              </Button>
              <Button onClick={saveRole}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showReset} onOpenChange={setShowReset}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Send a temporary password to {resetUserEmail}.
              </DialogDescription>
            </DialogHeader>
            {temporaryPassword && (
              <Alert>
                <AlertDescription>
                  Temporary password:{" "}
                  <span className="font-mono">{temporaryPassword}</span>
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowReset(false)}>
                Close
              </Button>
              {!temporaryPassword && (
                <Button onClick={resetPassword}>Send</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. The user will permanently lose
                access.
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm">
              {deletingUser && (
                <span>
                  Are you sure you want to delete{" "}
                  <span className="font-medium">{deletingUser.email}</span>?
                </span>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
