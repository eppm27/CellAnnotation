import { ReactNode } from "react";
import { useAuth } from "./AuthContext";

type RequireAdminProps = {
  children: ReactNode;
};

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return <></>;
  }

  return <>{children}</>;
}
