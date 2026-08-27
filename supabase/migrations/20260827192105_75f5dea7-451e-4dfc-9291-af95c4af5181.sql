ALTER TYPE public.generation_status ADD VALUE IF NOT EXISTS 'pendiente_pago';

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS duracion_segundos integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS sin_marca_agua boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS incluye_horizontal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estilo_camara text,
  ADD COLUMN IF NOT EXISTS ambiente_musical text,
  ADD COLUMN IF NOT EXISTS monto_centavos integer,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_duracion_segundos_check CHECK (duracion_segundos BETWEEN 15 AND 60);

CREATE INDEX IF NOT EXISTS videos_stripe_session_id_idx ON public.videos (stripe_session_id);