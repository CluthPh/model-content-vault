import { motion } from "framer-motion";
import { Lock, Heart, Eye } from "lucide-react";

interface ContentCardProps {
  image: string;
  title: string;
  likes: number;
  views: number;
  isLocked?: boolean;
  index: number;
  onClick: () => void;
}

export function ContentCard({ image, title, likes, views, isLocked = true, index, onClick }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-card shadow-card"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={image}
          alt={title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            isLocked ? 'blur-content' : ''
          }`}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
        
        {/* Lock Icon */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              className="rounded-full bg-primary/90 p-4 shadow-glow backdrop-blur-sm"
            >
              <Lock className="h-8 w-8 text-primary-foreground" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="mb-2 text-sm font-medium">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-primary" />
            {likes}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {views}
          </span>
        </div>
      </div>

      {/* Hover Overlay Text */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="gradient-primary rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground">
          {isLocked ? 'Ver Prévia' : 'Ver Conteúdo'}
        </span>
      </div>
    </motion.div>
  );
}
