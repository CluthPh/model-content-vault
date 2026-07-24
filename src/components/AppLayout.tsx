import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, User, LayoutGrid, Shield, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import MoneyBackground from "@/components/MoneyBackground";
import ThemeToggle from "@/components/ThemeToggle";



export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const items = [
    { to: "/app", label: "Início", icon: Home },
    { to: "/app", label: "Módulos", icon: LayoutGrid },
    { to: "/app/perfil", label: "Perfil", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Administração", icon: Shield }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    nav("/login");
  };

  return (
    <div className="min-h-screen">
      <MoneyBackground />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-[hsl(var(--carbon))]/90 backdrop-blur-xl">

        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-md gradient-primary shadow-glow shrink-0" />
            <span className="font-bold tracking-wider text-base md:text-lg truncate">
              YAKUZA <span className="text-primary">MENTORY</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {items.map((i) => {
              const Icon = i.icon;
              const active = loc.pathname === i.to;
              return (
                <Link
                  key={i.label}
                  to={i.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors",
                    active && "text-foreground bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" /> {i.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-md hover:bg-secondary"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

        </div>
        {open && (
          <div className="md:hidden border-t border-border/60 bg-[hsl(var(--carbon))]">
            <div className="container py-3 flex flex-col gap-1">
              {items.map((i) => (
                <Link
                  key={i.label}
                  to={i.to}
                  className="px-3 py-2 rounded-md text-sm hover:bg-secondary"
                  onClick={() => setOpen(false)}
                >
                  {i.label}
                </Link>
              ))}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="container py-8">{children}</main>
      <footer className="border-t border-border/60 mt-16 py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/termos" className="hover:text-foreground">Termos de uso</Link>
          <Link to="/privacidade" className="hover:text-foreground">Política de privacidade</Link>
          <Link to="/aviso-adulto" className="hover:text-foreground">Aviso adulto</Link>
        </div>
        <p className="mt-2">© {new Date().getFullYear()} Yakuza Mentory — Conteúdo +18</p>
      </footer>
    </div>
  );
}
