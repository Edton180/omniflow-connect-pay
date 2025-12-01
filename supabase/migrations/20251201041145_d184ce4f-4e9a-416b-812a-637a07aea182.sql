-- Create global_themes table for seasonal theme management
CREATE TABLE public.global_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text,
  background_gradient text,
  icon text,
  is_active boolean DEFAULT false,
  start_date date,
  end_date date,
  css_overrides jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_themes ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all themes
CREATE POLICY "Super admins can manage themes"
  ON public.global_themes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Anyone authenticated can view active themes
CREATE POLICY "Anyone can view active themes"
  ON public.global_themes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default themes
INSERT INTO public.global_themes (name, slug, description, primary_color, secondary_color, accent_color, background_gradient, icon) VALUES
('Natal', 'christmas', 'Tema festivo de Natal com vermelho e verde', '#C41E3A', '#228B22', '#FFD700', 'linear-gradient(135deg, #C41E3A 0%, #228B22 100%)', '🎄'),
('Ano Novo', 'new-year', 'Tema de celebração de Ano Novo', '#FFD700', '#000080', '#C0C0C0', 'linear-gradient(135deg, #000080 0%, #FFD700 100%)', '🎆'),
('Páscoa', 'easter', 'Tema de Páscoa com cores pastéis', '#FFB6C1', '#98FB98', '#E6E6FA', 'linear-gradient(135deg, #FFB6C1 0%, #98FB98 100%)', '🐰'),
('Halloween', 'halloween', 'Tema de Halloween com laranja e preto', '#FF6600', '#1a1a1a', '#800080', 'linear-gradient(135deg, #1a1a1a 0%, #FF6600 100%)', '🎃'),
('Dia dos Namorados', 'valentines', 'Tema romântico com tons de rosa e vermelho', '#FF1493', '#FF69B4', '#FFC0CB', 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)', '💝'),
('Carnaval', 'carnival', 'Tema colorido de Carnaval brasileiro', '#FFD700', '#9400D3', '#00CED1', 'linear-gradient(135deg, #FFD700 0%, #9400D3 50%, #00CED1 100%)', '🎭'),
('Inverno', 'winter', 'Tema de inverno com tons de azul e branco', '#4169E1', '#ADD8E6', '#FFFFFF', 'linear-gradient(135deg, #4169E1 0%, #ADD8E6 100%)', '❄️'),
('Verão', 'summer', 'Tema de verão com cores vibrantes', '#FF8C00', '#00BFFF', '#FFD700', 'linear-gradient(135deg, #00BFFF 0%, #FF8C00 100%)', '☀️'),
('Padrão', 'default', 'Tema padrão do sistema', '#8B5CF6', '#3B82F6', '#06B6D4', 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)', '✨');