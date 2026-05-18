import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";

export default function Landing() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"login" | "register">("login");
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) navigate("/workspace");
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full bg-card/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden bg-white border border-border">
              <img
                src="/favicon.ico"
                alt="Ann Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Ann</h1>
              <p className="text-xs text-muted-foreground">
                Scientific Imaging Workspace
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full text-center space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            Quantitative, reproducible annotation for biomedical images
          </h2>
          <p className="text-muted-foreground">
            Import whole-slide images (SVS) and standard images (PNG), draw cell
            and region annotations, and export publication-ready figures with
            precision controls.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setInitialTab("login");
                setOpen(true);
              }}
            >
              Sign In
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setInitialTab("register");
                setOpen(true);
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ann — Biomedical Imaging Tools
      </footer>

      <AuthDialog
        open={open}
        onOpenChange={(v) => setOpen(v)}
        onLogin={(loggedUser) => {
          setOpen(false);
          navigate("/workspace");
        }}
        initialTab={initialTab}
      />
    </div>
  );
}
