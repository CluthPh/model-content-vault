import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="text-xl font-bold">
          <span className="text-gradient">Amanda</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <button
            onClick={() => scrollToSection('conteudos')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Conteúdos
          </button>
          <button
            onClick={() => scrollToSection('planos')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Planos
          </button>
          <Button
            size="sm"
            className="gradient-primary font-semibold text-primary-foreground hover:opacity-90"
            onClick={() => scrollToSection('planos')}
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Assinar
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute left-0 right-0 top-16 border-b border-border bg-background/95 backdrop-blur-md md:hidden"
        >
          <nav className="container flex flex-col gap-4 px-4 py-6">
            <button
              onClick={() => scrollToSection('conteudos')}
              className="text-left text-lg font-medium transition-colors hover:text-primary"
            >
              Conteúdos
            </button>
            <button
              onClick={() => scrollToSection('planos')}
              className="text-left text-lg font-medium transition-colors hover:text-primary"
            >
              Planos
            </button>
            <Button
              className="gradient-primary font-semibold text-primary-foreground hover:opacity-90"
              onClick={() => scrollToSection('planos')}
            >
              <Lock className="mr-2 h-4 w-4" />
              Assinar Agora
            </Button>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
