import { NextRequest, NextResponse } from 'next/server';
import { getSessionRepository } from '@/lib/repositories/sessionRepository';
import { gestionDocumentalService } from '@/lib/services/gestionDocumentalService';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { handleOptions } from '@/lib/utils/cors';
import { isValidClasificacion } from '@/lib/utils/series';
import { ClasificacionDocumento, FailedDocumentAttempt, UploadedDocumentResult } from '@/types/session';

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
    const documentoRef = (formData.get('documentoRef') as string) || session.config?.documentoRef;
    const extraEtiquetas = formData.getAll('etiquetas').map(String);
    const etiquetas = [...(session.config?.etiquetas || []), ...extraEtiquetas];
    const resolvedProyectoId = session.config?.proyectoId || session.proyectoId || '';

    // Clasificación por documento (solo si la sesión define seriesClasificacion)
    const series = session.config?.seriesClasificacion;
    const hasSeries = Array.isArray(series) && series.length > 0;
    let clasificaciones: ClasificacionDocumento[] = [];

    if (hasSeries) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(formData.get('clasificaciones') ?? ''));
      } catch {
        parsed = undefined;
      }

      if (!Array.isArray(parsed) || parsed.length !== files.length) {
        return NextResponse.json(
          { error: 'Esta sesión requiere clasificar cada documento: envíe "clasificaciones" con un elemento por archivo, en el mismo orden.' },
          { status: 400 }
        );
      }

      const invalidIdx = parsed.findIndex((c) => !isValidClasificacion(series, c));
      if (invalidIdx !== -1) {
        return NextResponse.json(
          { error: `La clasificación del archivo "${files[invalidIdx].name}" no es válida para esta sesión.` },
          { status: 400 }
        );
      }
      clasificaciones = parsed as ClasificacionDocumento[];
    }

    // Enviar a la API SpringBoot de Gestión Documental
    // Subida secuencial archivo por archivo; ante un fallo se detiene y se registra lo logrado y lo no enviado
    const uploadedResults: UploadedDocumentResult[] = [];
    let failure: { index: number; message: string } | null = null;

    for (let i = 0; i < files.length; i++) {
      const c = hasSeries ? clasificaciones[i] : undefined;
      try {
        const result = await gestionDocumentalService.subirArchivo({
          file: files[i],
          documentoRef,
          etiquetas: c ? Array.from(new Set([...etiquetas, c.serie, c.subserie, c.tipoDocumental])) : etiquetas,
          proyectoId: resolvedProyectoId,
        });
        uploadedResults.push(c ? { ...result, clasificacion: c } : result);
      } catch (error: unknown) {
        failure = {
          index: i,
          message: error instanceof Error ? error.message : 'Error al conectar con la API de Gestión Documental',
        };
        break;
      }
    }

    if (failure) {
      const attemptedAt = formatLocalDateTime();
      const failedDocuments: FailedDocumentAttempt[] = files.slice(uploadedResults.length).map((file, k) => {
        const i = uploadedResults.length + k;
        return {
          originalName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          ...(hasSeries ? { clasificacion: clasificaciones[i] } : {}),
          error: i === failure!.index ? failure!.message : 'No se envió porque un archivo anterior falló.',
          attemptedAt,
        };
      });

      // Registrar fallo en la sesión (con lo que sí se subió y lo que no)
      await repo.update(sessionId, {
        status: 'FAILED',
        error: failure.message,
        documents: uploadedResults,
        failedDocuments,
      });

      return NextResponse.json(
        { error: failure.message },
        { status: 502 }
      );
    }

    // Actualizar la sesión a estado COMPLETED
    const updatedSession = await repo.update(sessionId, {
      status: 'COMPLETED',
      documents: uploadedResults,
      ...(session.failedDocuments?.length ? { failedDocuments: [] } : {}),
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
