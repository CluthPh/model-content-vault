import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit, Upload, Image, Video, 
  Eye, Heart, Save, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Content {
  id: string;
  title: string;
  description: string | null;
  type: "photo" | "video";
  media_url: string | null;
  thumbnail_url: string | null;
  likes_count: number;
  views_count: number;
  is_free: boolean;
  is_active: boolean;
  sort_order: number;
}

export function AdminContents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "photo" as "photo" | "video",
    is_free: false,
    is_active: true,
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error("Error fetching contents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os conteúdos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (content?: Content) => {
    if (content) {
      setEditingContent(content);
      setFormData({
        title: content.title,
        description: content.description || "",
        type: content.type,
        is_free: content.is_free,
        is_active: content.is_active,
      });
    } else {
      setEditingContent(null);
      setFormData({
        title: "",
        description: "",
        type: "photo",
        is_free: false,
        is_active: true,
      });
    }
    setMediaFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContent(null);
    setMediaFile(null);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `contents/${Date.now()}.${fileExt}`;

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
    if (!formData.title) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let mediaUrl = editingContent?.media_url || null;

      if (mediaFile) {
        const url = await uploadFile(mediaFile);
        if (url) mediaUrl = url;
      }

      if (editingContent) {
        // Update existing
        const { error } = await supabase
          .from("contents")
          .update({
            title: formData.title,
            description: formData.description || null,
            type: formData.type,
            media_url: mediaUrl,
            is_free: formData.is_free,
            is_active: formData.is_active,
          })
          .eq("id", editingContent.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("contents")
          .insert({
            title: formData.title,
            description: formData.description || null,
            type: formData.type,
            media_url: mediaUrl,
            is_free: formData.is_free,
            is_active: formData.is_active,
            sort_order: contents.length,
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: editingContent ? "Conteúdo atualizado" : "Conteúdo criado",
      });

      closeModal();
      fetchContents();
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o conteúdo",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;

    try {
      const { error } = await supabase
        .from("contents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Conteúdo excluído",
      });

      fetchContents();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o conteúdo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conteúdos</h2>
          <p className="text-muted-foreground">
            Gerencie fotos e vídeos do seu perfil
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="gradient-primary font-semibold text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Contents Grid */}
      {contents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Image className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum conteúdo ainda</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Clique em "Novo Conteúdo" para adicionar fotos ou vídeos
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <motion.div
              key={content.id}
              layout
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-secondary">
                {content.media_url ? (
                  content.type === "video" ? (
                    <video
                      src={content.media_url}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={content.media_url}
                      alt={content.title}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {content.type === "video" ? (
                      <Video className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <Image className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-1 text-xs backdrop-blur-sm">
                  {content.type === "video" ? "Vídeo" : "Foto"}
                </div>

                {/* Status Badge */}
                {!content.is_active && (
                  <div className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                    Inativo
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => openModal(content)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(content.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium">{content.title}</h3>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {content.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {content.views_count}
                  </span>
                  {content.is_free && (
                    <span className="text-primary">Grátis</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-lg font-semibold">
                  {editingContent ? "Editar Conteúdo" : "Novo Conteúdo"}
                </h3>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-1 hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Media Upload */}
                  <div>
                    <Label>Mídia</Label>
                    <div className="mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary">
                      {mediaFile || editingContent?.media_url ? (
                        <div className="relative h-full w-full">
                          {formData.type === "video" ? (
                            <video
                              src={mediaFile ? URL.createObjectURL(mediaFile) : editingContent?.media_url!}
                              className="h-full w-full object-cover"
                              controls
                            />
                          ) : (
                            <img
                              src={mediaFile ? URL.createObjectURL(mediaFile) : editingContent?.media_url!}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          )}
                          <label className="absolute bottom-2 right-2 cursor-pointer">
                            <input
                              type="file"
                              accept={formData.type === "video" ? "video/*" : "image/*"}
                              className="hidden"
                              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                            />
                            <span className="inline-flex items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 text-sm backdrop-blur-sm">
                              <Upload className="h-4 w-4" />
                              Alterar
                            </span>
                          </label>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center gap-2 p-8">
                          <input
                            type="file"
                            accept={formData.type === "video" ? "video/*" : "image/*"}
                            className="hidden"
                            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                          />
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Clique para fazer upload
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <Label>Tipo</Label>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "photo" })}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                          formData.type === "photo"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <Image className="h-4 w-4" />
                        Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "video" })}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                          formData.type === "video"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <Video className="h-4 w-4" />
                        Vídeo
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-2"
                      placeholder="Ex: Ensaio Exclusivo"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Conteúdo Grátis</Label>
                      <p className="text-xs text-muted-foreground">
                        Visível para todos os visitantes
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_free}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Ativo</Label>
                      <p className="text-xs text-muted-foreground">
                        Exibir no site
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-border p-4">
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
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
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
