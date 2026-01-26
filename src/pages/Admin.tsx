import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, Image, DollarSign, LogOut, Menu, X, 
  Home, Plus, Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminProfile } from "@/components/admin/AdminProfile";
import { AdminContents } from "@/components/admin/AdminContents";
import { AdminPlans } from "@/components/admin/AdminPlans";

type Tab = "profile" | "contents" | "plans";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { user, isAdmin, isLoading, signOut } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const tabs = [
    { id: "profile" as Tab, label: "Perfil", icon: User },
    { id: "contents" as Tab, label: "Conteúdos", icon: Image },
    { id: "plans" as Tab, label: "Planos", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-card p-2 shadow-lg lg:hidden"
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-border px-4">
            <h1 className="text-xl font-bold">
              <span className="text-gradient">Admin</span> Panel
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <a
              href="/"
              target="_blank"
              className="mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Ver Site
            </a>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl px-4 py-8 lg:px-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "profile" && <AdminProfile />}
            {activeTab === "contents" && <AdminContents />}
            {activeTab === "plans" && <AdminPlans />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
