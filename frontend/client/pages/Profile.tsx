import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { User2Icon, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

interface User {
  id: number;
  email: string;
  role: string;
}

export default function Profile() {
  const [me, setMe] = useState<User | null>(null);
  const [meLoading, setMeLoading] = useState(true);

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
        setMeLoading(false);
      }
    })();
  }, []);

  if (meLoading) return <PageSkeleton />;
  if (!me) return <div className="p-8 text-red-600">Not logged in.</div>;

  return (
    <Layout>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <User2Icon className="w-8 h-8 text-medical-blue" />
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">User profile information</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid gap-6">
              {/* Profile section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>My Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div>Email: {me.email}</div>
                    <div>Role: {me.role}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
