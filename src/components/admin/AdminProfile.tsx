import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Upload, User, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ModelProfile {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  hero_image_url: string | null;
  instagram: string | null;
  twitter: string | null;
}

export function AdminProfile() {
  const [profile, setProfile] = useState<ModelProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("model_profile")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      let avatarUrl = profile.avatar_url;
      let heroUrl = profile.hero_image_url;

      if (avatarFile) {
        const url = await uploadFile(avatarFile, "avatars");
        if (url) avatarUrl = url;
      }

      if (heroFile) {
        const url = await uploadFile(heroFile, "hero");
        if (url) heroUrl = url;
      }

      const { error } = await supabase
        .from("model_profile")
        .update({
          name: profile.name,
          bio: profile.bio,
          avatar_url: avatarUrl,
          hero_image_url: heroUrl,
          instagram: profile.instagram,
          twitter: profile.twitter,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: avatarUrl, hero_image_url: heroUrl });
      setAvatarFile(null);
      setHeroFile(null);

      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground">
        Perfil não encontrado
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Perfil da Modelo</h2>
        <p className="text-muted-foreground">
          Edite as informações que aparecem no site
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Avatar Upload */}
        <div className="rounded-xl border border-border bg-card p-6">
          <Label className="mb-4 block">Foto de Perfil</Label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-secondary">
              {(avatarFile || profile.avatar_url) ? (
                <img
                  src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url!}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
                <span className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  Alterar foto
                </span>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG. Max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Hero Image Upload */}
        <div className="rounded-xl border border-border bg-card p-6">
          <Label className="mb-4 block">Imagem de Capa</Label>
          <div className="relative h-32 overflow-hidden rounded-lg bg-secondary">
            {(heroFile || profile.hero_image_url) ? (
              <img
                src={heroFile ? URL.createObjectURL(heroFile) : profile.hero_image_url!}
                alt="Hero"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground">Sem imagem</span>
              </div>
            )}
            <label className="absolute bottom-2 right-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
              />
              <span className="inline-flex items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-background">
                <Upload className="h-4 w-4" />
                Alterar
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-6">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative mt-2">
                <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="instagram"
                  value={profile.instagram || ""}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  className="pl-10"
                  placeholder="@usuario"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <div className="relative mt-2">
                <Twitter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="twitter"
                  value={profile.twitter || ""}
                  onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                  className="pl-10"
                  placeholder="@usuario"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="gradient-primary font-semibold text-primary-foreground"
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Salvando...
          </span>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </>
        )}
      </Button>
    </div>
  );
}
