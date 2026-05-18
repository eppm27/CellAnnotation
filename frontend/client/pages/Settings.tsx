import Layout from "@/components/Layout";
import UserManagement from "@/components/UserManagement";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings as SettingsIcon, Database } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="w-8 h-8 text-medical-blue" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Configure your Ann preferences and system settings
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* User management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Manage user accounts and roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <UserManagement />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>More settings coming soon</CardTitle>
                <CardDescription>
                  This version focuses on user administration. Display and
                  annotation preferences are intentionally kept out of the UI
                  until they are wired to the backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Keeping this section minimal makes the admin surface feel
                intentional instead of half-finished.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
