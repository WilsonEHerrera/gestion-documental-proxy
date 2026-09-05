import { NextRequest } from 'next/server';
import { getProjectRepository } from '../repositories/MongoProjectRepository';
import { Project } from '@/types/project';

export interface AuthResult {
  authenticated: boolean;
  project?: Project;
  error?: string;
  status?: number;
}

/**
 * Extrae y valida la llave privada de la petición.
 * Admite:
 * - Header 'x-api-key: prv_...'
 * - Header 'Authorization: Bearer prv_...'
 * - Header 'x-private-key: prv_...'
 */
export async function authenticateApiKey(request: NextRequest): Promise<AuthResult> {
  let apiKey = request.headers.get('x-api-key') || request.headers.get('x-private-key');

  if (!apiKey) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }
  }

  if (!apiKey || apiKey.trim() === '') {
    return {
      authenticated: false,
      error: 'Se requiere una API Key para autenticar la petición. Envíela en el header "x-api-key" o "Authorization: Bearer <LLAVE_PRIVADA>".',
      status: 401,
    };
  }

  const projectRepo = getProjectRepository();
  const project = await projectRepo.findByPrivateKey(apiKey.trim());

  if (!project) {
    return {
      authenticated: false,
      error: 'La API Key proporcionada no es válida o se encuentra inactiva.',
      status: 401,
    };
  }

  return {
    authenticated: true,
    project,
  };
}
