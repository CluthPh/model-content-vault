
-- Create enum for content types
CREATE TYPE public.content_type AS ENUM ('photo', 'video');

-- Create model profile table
CREATE TABLE public.model_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Amanda Oliveira',
  bio TEXT DEFAULT 'Conteúdo exclusivo e sensual para assinantes VIP.',
  avatar_url TEXT,
  hero_image_url TEXT,
  instagram TEXT,
  twitter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default profile
INSERT INTO public.model_profile (name, bio) 
VALUES ('Amanda Oliveira', 'Conteúdo exclusivo e sensual para assinantes VIP. Descubra um mundo de sedução e elegância.');

-- Create pricing plans table
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period TEXT NOT NULL DEFAULT '/mês',
  description TEXT,
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  icon TEXT DEFAULT 'zap',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default plans
INSERT INTO public.pricing_plans (name, price, description, features, is_popular, icon, sort_order) VALUES
('Básico', 29.90, 'Acesso ao conteúdo básico', ARRAY['20 fotos exclusivas', 'Acesso por 30 dias', 'Suporte por chat'], false, 'zap', 1),
('VIP', 49.90, 'O mais popular', ARRAY['Todas as fotos exclusivas', '5 vídeos por mês', 'Acesso vitalício ao conteúdo', 'Chat privado', 'Conteúdo antecipado'], true, 'star', 2),
('Premium', 99.90, 'Experiência completa', ARRAY['Todo conteúdo VIP', 'Vídeos ilimitados', 'Conteúdo personalizado', 'Videochamadas exclusivas', 'Prioridade em novidades', 'Presentes surpresa'], false, 'crown', 3);

-- Create contents table
CREATE TABLE public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type content_type NOT NULL DEFAULT 'photo',
  media_url TEXT,
  thumbnail_url TEXT,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin users table (for role checking)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.model_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;

-- Public read policies (everyone can see active content)
CREATE POLICY "Anyone can view model profile" ON public.model_profile
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active plans" ON public.pricing_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active content" ON public.contents
  FOR SELECT USING (is_active = true);

-- Admin write policies
CREATE POLICY "Admins can update model profile" ON public.model_profile
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage plans" ON public.pricing_plans
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage contents" ON public.contents
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view admin users" ON public.admin_users
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies
CREATE POLICY "Anyone can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_model_profile_updated_at
  BEFORE UPDATE ON public.model_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
