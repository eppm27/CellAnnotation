import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import PageSkeleton from "@/components/skeletons/PageSkeleton";
import WorkspaceSkeleton from "@/components/skeletons/WorkspaceSkeleton";
import { RequireAdmin } from "./components/auth/RequireAdmin";

const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
import { AuthProvider } from "./components/auth/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Landing />
              </Suspense>
            }
          />
          <Route
            path="/workspace"
            element={
              <Suspense fallback={<WorkspaceSkeleton />}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAdmin>
                <Suspense fallback={<WorkspaceSkeleton />}>
                  <Settings />
                </Suspense>
              </RequireAdmin>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route
            path="/profile"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <NotFound />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

export default App;
