import { useState } from "react";
import { motion } from "framer-motion";
import { ContentCard } from "./ContentCard";
import { ContentModal } from "./ContentModal";
import content1 from "@/assets/content-1.jpg";
import content2 from "@/assets/content-2.jpg";
import content3 from "@/assets/content-3.jpg";
import content4 from "@/assets/content-4.jpg";
import content5 from "@/assets/content-5.jpg";
import content6 from "@/assets/content-6.jpg";

const contentItems = [
  { id: 1, image: content1, title: "Ensaio Exclusivo #1", likes: 342, views: 1250 },
  { id: 2, image: content2, title: "Noite de Velas", likes: 289, views: 987 },
  { id: 3, image: content3, title: "Silhuetas", likes: 456, views: 1580 },
  { id: 4, image: content4, title: "Mistério", likes: 378, views: 1120 },
  { id: 5, image: content5, title: "Sedução", likes: 512, views: 1890 },
  { id: 6, image: content6, title: "Elegância", likes: 267, views: 845 },
];

export function ContentGrid() {
  const [selectedContent, setSelectedContent] = useState<typeof contentItems[0] | null>(null);

  return (
    <section id="conteudos" className="py-20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Conteúdo <span className="text-gradient">Exclusivo</span>
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Fotos e vídeos sensuais disponíveis apenas para assinantes VIP. 
            Assine agora e desbloqueie todo o conteúdo.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {contentItems.map((item, index) => (
            <ContentCard
              key={item.id}
              image={item.image}
              title={item.title}
              likes={item.likes}
              views={item.views}
              isLocked={true}
              index={index}
              onClick={() => setSelectedContent(item)}
            />
          ))}
        </div>
      </div>

      <ContentModal
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        content={selectedContent}
      />
    </section>
  );
}
