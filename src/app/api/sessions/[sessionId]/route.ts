import { NextRequest, NextResponse } from 'next/server';
import { getSessionRepository } from '@/lib/repositories/sessionRepository';
import { authenticateApiKey } from '@/lib/auth/apiKeyAuth';
import { handleOptions } from '@/lib/utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
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
        { error: 'Sesión no encontrada o enlace caducado.' },
        { status: 404 }
      );
    }

    // Si la petición incluye header de autenticación, validar que pertenezca al proyecto
    const hasAuthHeader = request.headers.has('x-api-key') ||
      request.headers.has('x-private-key') ||
      request.headers.get('authorization')?.startsWith('Bearer ');

    if (hasAuthHeader) {
      const auth = await authenticateApiKey(request);
      if (!auth.authenticated || !auth.project) {
        return NextResponse.json(
          { error: auth.error || 'API Key no válida.' },
          { status: 401 }
        );
      }

      // Validar que la sesión corresponda al proyecto de la API Key
      if (session.proyectoId !== auth.project.projectId) {
        return NextResponse.json(
          { error: 'No tienes permisos para consultar esta sesión.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno al consultar sesión';
    console.error(`[API /api/sessions/[sessionId]] Error:`, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
