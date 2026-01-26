import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: number;
    image: string;
    title: string;
    likes: number;
    views: number;
  } | null;
}

export function ContentModal({ isOpen, onClose, content }: ContentModalProps) {
  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-background/50 p-2 backdrop-blur-sm transition-colors hover:bg-background"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image Preview (Blurred) */}
            <div className="relative aspect-[4/5]">
              <img
                src={content.image}
                alt={content.title}
                className="h-full w-full object-cover blur-content"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="mb-6 rounded-full bg-primary/90 p-6 shadow-glow"
                >
                  <Lock className="h-12 w-12 text-primary-foreground" />
                </motion.div>
                <h3 className="mb-2 text-xl font-bold">{content.title}</h3>
                <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-primary" />
                    {content.likes} curtidas
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {content.views} visualizações
                  </span>
                </div>
                <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
                  Este conteúdo está disponível apenas para assinantes VIP. 
                  Assine agora e tenha acesso ilimitado!
                </p>
                <Button
                  size="lg"
                  className="gradient-primary px-8 font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                  onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Desbloquear por R$ 29,90
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
