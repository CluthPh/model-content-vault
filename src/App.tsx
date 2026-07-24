import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

import AgeGate from "./pages/AgeGate";
import Login from "./pages/Login";

const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const AdultNotice = lazy(() => import("./pages/AdultNotice"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ModuleView = lazy(() => import("./pages/ModuleView"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminModules = lazy(() => import("./pages/admin/AdminModules"));
const AdminModuleContents = lazy(() => import("./pages/admin/AdminModuleContents"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>
);

function Protected({ children, admin }: { children: JSX.Element; admin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/app" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={qc}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<AgeGate />} />
                <Route path="/login" element={<Login />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/aviso-adulto" element={<AdultNotice />} />

                <Route path="/app" element={<Protected><Dashboard /></Protected>} />
                <Route path="/app/modulos/:id" element={<Protected><ModuleView /></Protected>} />
                <Route path="/app/perfil" element={<Protected><Profile /></Protected>} />

                <Route path="/admin" element={<Protected admin><AdminHome /></Protected>} />
                <Route path="/admin/modulos" element={<Protected admin><AdminModules /></Protected>} />
                <Route path="/admin/modulos/:id/conteudos" element={<Protected admin><AdminModuleContents /></Protected>} />
                <Route path="/admin/usuarios" element={<Protected admin><AdminUsers /></Protected>} />
                <Route path="/admin/configuracoes" element={<Protected admin><AdminSettings /></Protected>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
