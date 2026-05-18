import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (user: { name: string; email: string; avatar?: string }) => void;
  initialTab?: "login" | "register";
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  institution: string;
}

export default function AuthDialog({
  open,
  onOpenChange,
  onLogin,
  initialTab = "login",
}: AuthDialogProps) {
  const { user, login } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  // Sync tab when dialog opens or initialTab changes
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    institution: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email: loginForm.email, password: loginForm.password });

      onLogin({
        name: "",
        email: loginForm.email,
      });

      onOpenChange(false);
      setLoginForm({ email: "", password: "" });
    } catch (err) {
      console.log(err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (registerForm.password !== registerForm.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (registerForm.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      // Real registration against backend
      const result = await api<{
        user: { name: string; email: string; role: string };
        token: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
        }),
      });
      onLogin({
        name: result.user.name,
        email: result.user.email,
        avatar: undefined,
      });
      onOpenChange(false);
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        institution: "",
      });
    } catch (err: any) {
      // Improve error display for duplicate emails and backend messages
      let msg = err?.message || "Registration failed. Please try again.";
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.detail) msg = parsed.detail;
      } catch {}
      if (msg.toLowerCase().includes("already registered")) {
        setError("Email already registered. Please sign in instead.");
        // Prefill login email and switch to login tab for convenience
        setLoginForm((lf) => ({ ...lf, email: registerForm.email }));
        setTab("login");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome to Ann</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your account or create a new one to start analyzing
            biomedical images
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-medical-blue hover:bg-medical-blue/90"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>

                  <div className="text-sm text-center text-muted-foreground">
                    Demo credentials: demo@example.com / demo
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">
                  Create Account
                </CardTitle>
                <CardDescription className="text-center">
                  Join our medical imaging platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Dr. John Smith"
                        className="pl-10"
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="john.smith@hospital.com"
                        className="pl-10"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="institution"
                        placeholder="General Hospital"
                        className="pl-10"
                        value={registerForm.institution}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            institution: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={registerForm.confirmPassword}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-medical-blue hover:bg-medical-blue/90"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
