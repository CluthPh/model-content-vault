import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import MoneyBackground from "@/components/MoneyBackground";

export default function AgeGate() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (localStorage.getItem("age_confirmed") === "1" && user) nav("/app");
  }, [user, nav]);

  const confirm = () => {
    localStorage.setItem("age_confirmed", "1");
    nav(user ? "/app" : "/login");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6">
      <MoneyBackground />
      <div className="max-w-lg w-full card-border rounded-2xl p-6 md:p-10 text-center animate-fade-in backdrop-blur-sm bg-card/80">
        <div className="mx-auto mb-6 h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          YAKUZA <span className="text-primary">MENTORY</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Área exclusiva +18</p>

        <div className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            Este ambiente contém conteúdo <span className="text-foreground font-medium">exclusivo e restrito a maiores de 18 anos</span>.
            Ao continuar, você declara ser maior de idade e concorda com os
            {" "}<Link to="/termos" className="text-primary hover:underline">Termos de uso</Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="text-primary hover:underline">Política de privacidade</Link>.
          </p>
          <p>É proibido compartilhar, gravar ou redistribuir qualquer conteúdo desta plataforma.</p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="btn-glow gradient-primary" onClick={confirm} disabled={loading}>
            ENTRAR <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="https://www.google.com">Sair</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
