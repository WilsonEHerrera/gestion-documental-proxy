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
  let apiKey = request.headers.get('x-api-key') || 
               request.headers.get('x-private-key') || 
               request.headers.get('x-public-key');

  if (!apiKey) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }
  }

  if (!apiKey || apiKey.trim() === '') {
    return {
      authenticated: false,
      error: 'Se requiere una API Key para autenticar la petición. Envíela en el header "x-api-key", "x-public-key" o "Authorization: Bearer <LLAVE>".',
      status: 401,
    };
  }

  const projectRepo = getProjectRepository();
  const trimmedKey = apiKey.trim();
  let project = await projectRepo.findByPrivateKey(trimmedKey);
  
  if (!project) {
    project = await projectRepo.findByPublicKey(trimmedKey);
  }

  if (!project) {
    return {
      authenticated: false,
      error: 'La API Key o Llave Pública proporcionada no es válida o se encuentra inactiva.',
      status: 401,
    };
  }

  // Si el proyecto tiene una lista de servicios asignados, verificar permiso para Documentos
  if (project.services && project.services.length > 0) {
    const hasAccess = project.services.some(
      (s) => s.toUpperCase() === 'DOCUMENTS' || s.toUpperCase() === 'GESTION_DOCUMENTAL'
    );
    if (!hasAccess) {
      return {
        authenticated: false,
        error: 'El proyecto no tiene habilitado el servicio de Gestión Documental.',
        status: 403,
      };
    }
  }

  return {
    authenticated: true,
    project,
  };
}
