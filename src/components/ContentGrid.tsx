import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ContentCard } from "./ContentCard";
import { ContentModal } from "./ContentModal";
import { supabase } from "@/integrations/supabase/client";
import content1 from "@/assets/content-1.jpg";
import content2 from "@/assets/content-2.jpg";
import content3 from "@/assets/content-3.jpg";
import content4 from "@/assets/content-4.jpg";
import content5 from "@/assets/content-5.jpg";
import content6 from "@/assets/content-6.jpg";

interface ContentItem {
  id: string;
  title: string;
  media_url: string | null;
  likes_count: number;
  views_count: number;
  is_free: boolean;
}

const fallbackContents = [
  { id: "1", title: "Ensaio Exclusivo #1", media_url: content1, likes_count: 342, views_count: 1250, is_free: false },
  { id: "2", title: "Noite de Velas", media_url: content2, likes_count: 289, views_count: 987, is_free: false },
  { id: "3", title: "Silhuetas", media_url: content3, likes_count: 456, views_count: 1580, is_free: false },
  { id: "4", title: "Mistério", media_url: content4, likes_count: 378, views_count: 1120, is_free: false },
  { id: "5", title: "Sedução", media_url: content5, likes_count: 512, views_count: 1890, is_free: false },
  { id: "6", title: "Elegância", media_url: content6, likes_count: 267, views_count: 845, is_free: false },
];

export function ContentGrid() {
  const [contents, setContents] = useState<ContentItem[]>(fallbackContents);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("contents")
      .select("id, title, media_url, likes_count, views_count, is_free")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      setContents(data);
    }
  };

  // Use fallback images for items without media_url
  const getImageUrl = (content: ContentItem, index: number) => {
    if (content.media_url) return content.media_url;
    const fallbackImages = [content1, content2, content3, content4, content5, content6];
    return fallbackImages[index % fallbackImages.length];
  };

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
          {contents.map((item, index) => (
            <ContentCard
              key={item.id}
              image={getImageUrl(item, index)}
              title={item.title}
              likes={item.likes_count}
              views={item.views_count}
              isLocked={!item.is_free}
              index={index}
              onClick={() => setSelectedContent(item)}
            />
          ))}
        </div>
      </div>

      <ContentModal
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        content={selectedContent ? {
          id: parseInt(selectedContent.id) || 0,
          image: selectedContent.media_url || content1,
          title: selectedContent.title,
          likes: selectedContent.likes_count,
          views: selectedContent.views_count,
        } : null}
      />
    </section>
  );
}
