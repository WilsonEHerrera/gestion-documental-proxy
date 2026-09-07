import { NextRequest, NextResponse } from 'next/server';
import { getSessionRepository } from '@/lib/repositories/sessionRepository';
import { authenticateApiKey } from '@/lib/auth/apiKeyAuth';
import { formatLocalDateTime, calculateExpirationDate } from '@/lib/utils/dateUtils';
import { CreateSessionDto, DocumentSession } from '@/types/session';
import { handleOptions } from '@/lib/utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación de la API Key en MongoDB
    const auth = await authenticateApiKey(request);
    if (!auth.authenticated || !auth.project) {
      return NextResponse.json(
        { error: auth.error || 'No autorizado.' },
        { status: auth.status || 401 }
      );
    }

    const body = (await request.json()) as CreateSessionDto;

    // El proyectoId se toma directamente del proyecto autenticado por su llave privada
    const proyectoId = auth.project.projectId;

    const sessionId = `doc_ses_${crypto.randomUUID()}`;
    const expiresInMinutes = body.expiresInMinutes && body.expiresInMinutes > 0 ? body.expiresInMinutes : 30;

    const now = formatLocalDateTime();
    const expiresAt = calculateExpirationDate(expiresInMinutes);

    // Normalizar extensiones permitidas
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
        expiresInMinutes,
      },
      documents: [],
      createdAt: now,
      expiresAt: expiresAt,
    };

    const repo = getSessionRepository();
    await repo.create(newSession);

    // Construir la URL completa del widget
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
