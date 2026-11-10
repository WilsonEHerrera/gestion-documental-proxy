import { ClasificacionDocumento, SerieClasificacion } from '@/types/session';

export interface TipoDocumentalOption extends ClasificacionDocumento {
  /** Identificador único por posición (serie/subserie/tipo) */
  key: string;
}

/** Aplana el árbol serie > subserie > tipo en una lista de opciones seleccionables. */
export function flattenSeries(series: SerieClasificacion[] | undefined): TipoDocumentalOption[] {
  const options: TipoDocumentalOption[] = [];
  (series ?? []).forEach((serie, i) => {
    (serie.subseries ?? []).forEach((sub, j) => {
      (sub.tiposDocumentales ?? []).forEach((tipo, k) => {
        options.push({
          key: `${i}-${j}-${k}`,
          serie: serie.nombre,
          subserie: sub.nombre,
          tipoDocumental: tipo,
        });
      });
    });
  });
  return options;
}

/** Minúsculas y sin tildes, para búsquedas tolerantes. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Verifica que la clasificación exista dentro de las series de la sesión. */
export function isValidClasificacion(
  series: SerieClasificacion[] | undefined,
  c: unknown
): c is ClasificacionDocumento {
  if (!c || typeof c !== 'object') return false;
  const { serie, subserie, tipoDocumental } = c as Record<string, unknown>;
  if (typeof serie !== 'string' || typeof subserie !== 'string' || typeof tipoDocumental !== 'string') {
    return false;
  }
  return flattenSeries(series).some(
    (o) => o.serie === serie && o.subserie === subserie && o.tipoDocumental === tipoDocumental
  );
}
