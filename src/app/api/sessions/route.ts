import { NextRequest, NextResponse } from 'next/server';
import { getSessionRepository } from '@/lib/repositories/sessionRepository';
import { authenticateApiKey } from '@/lib/auth/apiKeyAuth';
import { formatLocalDateTime, calculateExpirationDate } from '@/lib/utils/dateUtils';
import { CreateSessionDto, DocumentSession, SerieClasificacion } from '@/types/session';
import { handleOptions } from '@/lib/utils/cors';

const cleanText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Normaliza seriesClasificacion; descarta entradas sin nombre. Devuelve [] si no hay nada válido. */
function normalizeSeriesClasificacion(input: unknown): SerieClasificacion[] {
  if (!Array.isArray(input)) return [];
  const result: SerieClasificacion[] = [];
  for (const serie of input) {
    if (!serie || typeof serie !== 'object') continue;
    const s = serie as Record<string, unknown>;
    const nombre = cleanText(s.nombre);
    if (!nombre) continue;
    const subseries = (Array.isArray(s.subseries) ? s.subseries : []).flatMap((sub) => {
      if (!sub || typeof sub !== 'object') return [];
      const ss = sub as Record<string, unknown>;
      const subNombre = cleanText(ss.nombre);
      if (!subNombre) return [];
      const tiposDocumentales = (Array.isArray(ss.tiposDocumentales) ? ss.tiposDocumentales : [])
        .map(cleanText)
        .filter(Boolean);
      return [{ nombre: subNombre, tiposDocumentales }];
    });
    result.push({ nombre, subseries });
  }
  return result;
}

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);
    if (!auth.authenticated || !auth.project) {
      return NextResponse.json(
        { error: auth.error || 'No autorizado.' },
        { status: auth.status || 401 }
      );
    }

    const body = (await request.json()) as CreateSessionDto;

    if (
      body.seriesClasificacion !== undefined &&
      body.seriesClasificacion !== null &&
      !Array.isArray(body.seriesClasificacion)
    ) {
      return NextResponse.json(
        { error: 'seriesClasificacion debe ser un arreglo de series.' },
        { status: 400 }
      );
    }
    const seriesClasificacion = normalizeSeriesClasificacion(body.seriesClasificacion);

    const proyectoId = auth.project.projectId;

    const sessionId = `doc_ses_${crypto.randomUUID()}`;
    const expiresInMinutes = body.expiresInMinutes && body.expiresInMinutes > 0 ? body.expiresInMinutes : 30;

    const now = formatLocalDateTime();
    const expiresAt = calculateExpirationDate(expiresInMinutes);

    const allowedExtensions = (body.allowedExtensions && body.allowedExtensions.length > 0)
      ? body.allowedExtensions.map((ext) => (ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`))
      : ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];

    const maxFileSizeMB = body.maxFileSizeMB && body.maxFileSizeMB > 0 ? body.maxFileSizeMB : 10;
    const maxFiles = body.maxFiles && body.maxFiles > 0 ? body.maxFiles : 1;

    const newSession: DocumentSession = {
      sessionId,
      serviceType: 'GESTION_DOCUMENTAL',
      status: 'PENDING',
      proyectoId,
      config: {
        proyectoId,
        allowedExtensions,
        maxFileSizeMB,
        maxFiles,
        title: body.title || 'Carga de Documentos',
        description: body.description || 'Por favor seleccione o arrastre los archivos solicitados.',
        documentoRef: body.documentoRef,
        etiquetas: body.etiquetas || [],
        redirectUrl: body.redirectUrl,
        metadata: body.metadata || {},
        ...(seriesClasificacion.length > 0 ? { seriesClasificacion } : {}),
        expiresInMinutes,
      },
      documents: [],
      createdAt: now,
      expiresAt: expiresAt,
    };

    const repo = getSessionRepository();
    await repo.create(newSession);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const uploadUrl = `${baseUrl}/upload/${sessionId}`;

    return NextResponse.json(
      {
        sessionId: newSession.sessionId,
        url: uploadUrl,
        expiresAt: newSession.expiresAt,
        status: newSession.status,
        config: newSession.config,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno al crear sesión';
    console.error('[API /api/sessions] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
