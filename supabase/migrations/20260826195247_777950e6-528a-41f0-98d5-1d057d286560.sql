CREATE TYPE public.video_tier AS ENUM ('basico', 'pro');
CREATE TYPE public.generation_status AS ENUM ('procesando', 'listo', 'error');
CREATE TYPE public.view_type AS ENUM ('ranking_click', 'billboard_view');

CREATE TABLE public.realtors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nombre text NOT NULL,
  telefono text,
  estado text NOT NULL,
  licencia_numero text,
  foto_url text,
  inmobiliaria text,
  verificado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.realtors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realtors TO authenticated;
GRANT ALL ON public.realtors TO service_role;
ALTER TABLE public.realtors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "realtors_public_read" ON public.realtors FOR SELECT USING (true);
CREATE POLICY "realtors_owner_insert" ON public.realtors FOR INSERT TO authenticated WITH CHECK (email = auth.jwt() ->> 'email');
CREATE POLICY "realtors_owner_update" ON public.realtors FOR UPDATE TO authenticated USING (email = auth.jwt() ->> 'email') WITH CHECK (email = auth.jwt() ->> 'email');

CREATE OR REPLACE FUNCTION public.is_my_realtor(_realtor_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.realtors r WHERE r.id = _realtor_id AND r.email = auth.jwt() ->> 'email');
$$;

CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id uuid NOT NULL REFERENCES public.realtors(id) ON DELETE CASCADE,
  estado text NOT NULL,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bids_estado_monto_idx ON public.bids (estado, monto DESC);
GRANT SELECT ON public.bids TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bids_public_read" ON public.bids FOR SELECT USING (true);
CREATE POLICY "bids_owner_write" ON public.bids FOR INSERT TO authenticated WITH CHECK (public.is_my_realtor(realtor_id));
CREATE POLICY "bids_owner_update" ON public.bids FOR UPDATE TO authenticated USING (public.is_my_realtor(realtor_id)) WITH CHECK (public.is_my_realtor(realtor_id));

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id uuid REFERENCES public.realtors(id) ON DELETE CASCADE,
  fotos_urls text[] NOT NULL DEFAULT '{}',
  video_url text,
  tier public.video_tier NOT NULL DEFAULT 'basico',
  estado_generacion public.generation_status NOT NULL DEFAULT 'procesando',
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_public_read_ready" ON public.videos FOR SELECT USING (estado_generacion = 'listo');
CREATE POLICY "videos_owner_read" ON public.videos FOR SELECT TO authenticated USING (public.is_my_realtor(realtor_id));
CREATE POLICY "videos_owner_insert" ON public.videos FOR INSERT TO authenticated WITH CHECK (public.is_my_realtor(realtor_id));
CREATE POLICY "videos_owner_update" ON public.videos FOR UPDATE TO authenticated USING (public.is_my_realtor(realtor_id)) WITH CHECK (public.is_my_realtor(realtor_id));

CREATE TABLE public.billboard_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id uuid NOT NULL REFERENCES public.realtors(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  estado text NOT NULL,
  fecha_inicio date NOT NULL DEFAULT current_date,
  fecha_fin date,
  clics integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billboard_slots_estado_idx ON public.billboard_slots (estado);
GRANT SELECT ON public.billboard_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billboard_slots TO authenticated;
GRANT ALL ON public.billboard_slots TO service_role;
ALTER TABLE public.billboard_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots_public_read" ON public.billboard_slots FOR SELECT USING (true);
CREATE POLICY "slots_owner_insert" ON public.billboard_slots FOR INSERT TO authenticated WITH CHECK (public.is_my_realtor(realtor_id));
CREATE POLICY "slots_owner_update" ON public.billboard_slots FOR UPDATE TO authenticated USING (public.is_my_realtor(realtor_id)) WITH CHECK (public.is_my_realtor(realtor_id));

CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estado text NOT NULL,
  realtor_id uuid REFERENCES public.realtors(id) ON DELETE SET NULL,
  tipo public.view_type NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX page_views_estado_idx ON public.page_views (estado, creado_en DESC);
GRANT INSERT ON public.page_views TO anon;
GRANT INSERT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "page_views_anyone_insert" ON public.page_views FOR INSERT WITH CHECK (true);