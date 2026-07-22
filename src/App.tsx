import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";


import AgeGate from "./pages/AgeGate";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AdultNotice from "./pages/AdultNotice";
import Dashboard from "./pages/Dashboard";
import ModuleView from "./pages/ModuleView";
import Profile from "./pages/Profile";
import AdminHome from "./pages/admin/AdminHome";
import AdminModules from "./pages/admin/AdminModules";
import AdminModuleContents from "./pages/admin/AdminModuleContents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const qc = new QueryClient();

function Protected({ children, admin }: { children: JSX.Element; admin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
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

          <Routes>
            <Route path="/" element={<AgeGate />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
        </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>

  </QueryClientProvider>
);

export default App;
