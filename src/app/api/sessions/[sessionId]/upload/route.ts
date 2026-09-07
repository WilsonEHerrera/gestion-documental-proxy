import { NextRequest, NextResponse } from 'next/server';
import { getSessionRepository } from '@/lib/repositories/sessionRepository';
import { gestionDocumentalService } from '@/lib/services/gestionDocumentalService';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { handleOptions } from '@/lib/utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'El parámetro sessionId es obligatorio.' },
        { status: 400 }
      );
    }

    const repo = getSessionRepository();
    const session = await repo.findById(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'La sesión especificada no existe.' },
        { status: 404 }
      );
    }

    // Validar estado de la sesión
    if (session.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'La sesión ha expirado y ya no acepta cargas de documentos.' },
        { status: 410 }
      );
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Esta sesión ya ha sido completada previamente.' },
        { status: 409 }
      );
    }

    const formData = await request.formData();

    // Extraer archivos del formData (soporta tanto 'file' como 'files')
    const files: File[] = [];
    const filesArray = formData.getAll('files');
    const singleFileArray = formData.getAll('file');

    for (const item of [...filesArray, ...singleFileArray]) {
      if (item instanceof File && item.size > 0) {
        files.push(item);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo válido para procesar.' },
        { status: 400 }
      );
    }

    // Validar cantidad máxima de archivos
    const maxFiles = session.config.maxFiles || 1;
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Se excedió el límite de archivos permitidos. Máximo permitido: ${maxFiles}, recibidos: ${files.length}.` },
        { status: 400 }
      );
    }

    // Validaciones de tamaño y extensiones
    const maxSizeBytes = (session.config.maxFileSizeMB || 10) * 1024 * 1024;
    const allowedExtensions = (session.config.allowedExtensions || []).map((e) => e.toLowerCase());

    for (const file of files) {
      // Validar tamaño
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          {
            error: `El archivo "${file.name}" supera el tamaño máximo permitido de ${session.config.maxFileSizeMB} MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
          },
          { status: 400 }
        );
      }

      // Validar extensión
      const extMatch = file.name.match(/\.[0-9a-z]+$/i);
      const fileExt = extMatch ? extMatch[0].toLowerCase() : '';

      if (allowedExtensions.length > 0 && (!fileExt || !allowedExtensions.includes(fileExt))) {
        return NextResponse.json(
          {
            error: `El archivo "${file.name}" tiene una extensión no permitida (${fileExt || 'sin extensión'}). Extensiones admitidas: ${allowedExtensions.join(', ')}.`,
          },
          { status: 400 }
        );
      }
    }

    // Parámetros adicionales opcionales para SpringBoot
    const documentoRef = (formData.get('documentoRef') as string) || session.config.documentoRef;
    const extraEtiquetas = formData.getAll('etiquetas').map(String);
    const etiquetas = [...(session.config.etiquetas || []), ...extraEtiquetas];

    // Enviar a la API SpringBoot de Gestión Documental
    let uploadedResults;
    try {
      uploadedResults = await gestionDocumentalService.subirMultiplesArchivos(files, {
        documentoRef,
        etiquetas,
        proyectoId: session.config.proyectoId,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al conectar con la API de Gestión Documental';
      
      // Registrar fallo en la sesión
      await repo.update(sessionId, {
        status: 'FAILED',
        error: errorMsg,
      });

      return NextResponse.json(
        { error: errorMsg },
        { status: 502 }
      );
    }

    // Actualizar la sesión a estado COMPLETED
    const updatedSession = await repo.update(sessionId, {
      status: 'COMPLETED',
      documents: uploadedResults,
      completedAt: formatLocalDateTime(),
      error: undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Documentos procesados y guardados con éxito en gestión documental.',
        session: updatedSession,
        redirectUrl: session.config.redirectUrl
          ? `${session.config.redirectUrl}${session.config.redirectUrl.includes('?') ? '&' : '?'}sessionId=${sessionId}&status=completed`
          : undefined,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error inesperado durante la subida';
    console.error('[API /api/sessions/[sessionId]/upload] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
