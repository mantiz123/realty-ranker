// Precio compartido (cliente = solo previsualización; el servidor recalcula siempre).
export const DURACION_MIN = 15;
export const DURACION_MAX = 60;
export const PRECIO_BASE_USD = 30;
export const PRECIO_MAX_BASE_USD = 59;
export const EXTRA_SIN_MARCA_USD = 15;
export const EXTRA_YOUTUBE_USD = 12;

export type ConfigPrecio = {
  duracionSegundos: number;
  sinMarcaAgua: boolean;
  incluyeHorizontal: boolean;
};

export function clampDuracion(n: number): number {
  if (!Number.isFinite(n)) return 30;
  return Math.min(DURACION_MAX, Math.max(DURACION_MIN, Math.round(n)));
}

/** $30 base hasta 30s, +$1 por segundo adicional, tope $59 a los 60s. */
export function precioBaseUsd(duracionSegundos: number): number {
  const d = clampDuracion(duracionSegundos);
  return Math.min(PRECIO_MAX_BASE_USD, PRECIO_BASE_USD + Math.max(0, d - 30));
}

export function precioTotalUsd(cfg: ConfigPrecio): number {
  return (
    precioBaseUsd(cfg.duracionSegundos) +
    (cfg.sinMarcaAgua ? EXTRA_SIN_MARCA_USD : 0) +
    (cfg.incluyeHorizontal ? EXTRA_YOUTUBE_USD : 0)
  );
}

export function precioTotalCentavos(cfg: ConfigPrecio): number {
  return Math.round(precioTotalUsd(cfg) * 100);
}
