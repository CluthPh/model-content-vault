import { Heart, Instagram, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Logo/Brand */}
          <div className="text-center">
            <h3 className="text-2xl font-bold">
              <span className="text-gradient">Amanda</span> Oliveira
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Conteúdo exclusivo para assinantes
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="#"
              className="rounded-full bg-secondary p-3 transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="rounded-full bg-secondary p-3 transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="rounded-full bg-secondary p-3 transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-primary">Termos de Uso</a>
            <a href="#" className="transition-colors hover:text-primary">Política de Privacidade</a>
            <a href="#" className="transition-colors hover:text-primary">Suporte</a>
            <a href="#" className="transition-colors hover:text-primary">FAQ</a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Feito com</span>
            <Heart className="h-4 w-4 fill-primary text-primary" />
            <span>© 2024 Todos os direitos reservados</span>
          </div>

          {/* Age Verification */}
          <div className="rounded-lg bg-secondary px-4 py-2 text-center text-xs text-muted-foreground">
            🔞 Este site contém conteúdo adulto. É necessário ter 18 anos ou mais para acessar.
          </div>
        </div>
      </div>
    </footer>
  );
}
