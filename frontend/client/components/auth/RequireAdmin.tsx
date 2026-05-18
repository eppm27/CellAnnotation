import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";

type RequireAdminProps = {
  children: ReactNode;
};

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Admin access required</h1>
            <p className="text-sm text-muted-foreground">
              This area is restricted to admin users. Sign in with an admin
              account to continue.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/">Return to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
