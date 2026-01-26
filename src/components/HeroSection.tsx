import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Users, Image, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-silhouette.jpg";
import avatarImage from "@/assets/profile-avatar.jpg";

interface ModelProfile {
  name: string;
  bio: string | null;
  avatar_url: string | null;
  hero_image_url: string | null;
}

export function HeroSection() {
  const [profile, setProfile] = useState<ModelProfile | null>(null);
  const [stats, setStats] = useState({
    photos: 0,
    likes: 0,
    subscribers: 856,
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("model_profile")
      .select("name, bio, avatar_url, hero_image_url")
      .limit(1)
      .maybeSingle();

    if (data) setProfile(data);
  };

  const fetchStats = async () => {
    const { data: contents } = await supabase
      .from("contents")
      .select("likes_count")
      .eq("is_active", true);

    if (contents) {
      setStats({
        photos: contents.length,
        likes: contents.reduce((acc, c) => acc + (c.likes_count || 0), 0),
        subscribers: 856,
      });
    }
  };

  const displayName = profile?.name || "Amanda Oliveira";
  const [firstName, ...lastNameParts] = displayName.split(" ");
  const lastName = lastNameParts.join(" ");

  const statsData = [
    { icon: Image, value: stats.photos.toString(), label: "Fotos" },
    { icon: Heart, value: stats.likes > 1000 ? `${(stats.likes / 1000).toFixed(1)}K` : stats.likes.toString(), label: "Curtidas" },
    { icon: Users, value: stats.subscribers.toString(), label: "Assinantes" },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={profile?.hero_image_url || heroImage}
          alt="Hero background"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative mb-6"
          >
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary shadow-glow md:h-40 md:w-40">
              <img
                src={profile?.avatar_url || avatarImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              <Lock className="mr-1 inline-block h-3 w-3" />
              Exclusivo
            </div>
          </motion.div>

          {/* Name and Bio */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-2 text-4xl font-bold md:text-5xl lg:text-6xl"
          >
            <span className="text-gradient">{firstName}</span> {lastName}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8 max-w-md text-lg text-muted-foreground"
          >
            {profile?.bio || "Conteúdo exclusivo e sensual para assinantes VIP. Descubra um mundo de sedução e elegância."}
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-8 flex gap-8"
          >
            {statsData.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <stat.icon className="mb-1 h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button
              size="lg"
              className="animate-pulse-glow gradient-primary px-8 py-6 text-lg font-semibold text-primary-foreground hover:opacity-90"
              onClick={() => document.getElementById('conteudos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Lock className="mr-2 h-5 w-5" />
              Desbloquear Conteúdo
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center text-muted-foreground">
            <span className="mb-2 text-sm">Rolar para baixo</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-6 w-4 rounded-full border-2 border-muted-foreground p-1"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
