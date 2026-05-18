import Layout from "@/components/Layout";
import UserManagement from "@/components/UserManagement";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Palette,
  Monitor,
  Database,
  Shield,
} from "lucide-react";

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

            {/* Display Settings */}
            {/*<Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Display Settings</span>
                </CardTitle>
                <CardDescription>
                  Customize the appearance and behavior of the image viewer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Grid by Default</Label>
                    <p className="text-sm text-muted-foreground">
                      Display overlay grid when loading images
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base">Default Zoom Level</Label>
                  <Select defaultValue="fit">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit to Screen</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                      <SelectItem value="150">150%</SelectItem>
                      <SelectItem value="200">200%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>*/}

            {/* Annotation Settings */}
            {/*<Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Annotation Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure default annotation properties and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Default Annotation Color</Label>
                  <Select defaultValue="red">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="teal">Teal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Default Category</Label>
                  <Select defaultValue="lesion">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesion">Lesion</SelectItem>
                      <SelectItem value="tumor">Tumor</SelectItem>
                      <SelectItem value="organ">Organ</SelectItem>
                      <SelectItem value="vessel">Vessel</SelectItem>
                      <SelectItem value="bone">Bone</SelectItem>
                      <SelectItem value="tissue">Tissue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-save Annotations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save annotations as you create them
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>*/}

            {/* Data & Privacy */}
            {/*<Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Data & Privacy</span>
                </CardTitle>
                <CardDescription>
                  Manage your data storage and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Local Data Storage</Label>
                    <p className="text-sm text-muted-foreground">
                      Store annotations and settings locally in your browser
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Anonymous Usage Analytics
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the platform by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  >
                    Clear All Local Data
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    This will remove all saved annotations and preferences from
                    this device
                  </p>
                </div>
              </CardContent>
            </Card>*/}

            {/* Actions */}
            {/*<div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline">Reset to Defaults</Button>
              <Button className="bg-medical-blue hover:bg-medical-blue/90">
                Save Changes
              </Button>
            </div>*/}
          </div>
        </div>
      </div>
    </Layout>
  );
}
