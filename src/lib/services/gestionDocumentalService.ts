import { UploadedDocumentResult } from '@/types/session';
import { formatLocalDateTime } from '../utils/dateUtils';

export interface UploadFileOptions {
  file: File;
  documentoRef?: string;
  etiquetas?: string[];
  proyectoId: string;
}

export class GestionDocumentalService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.URL_GESTION_DOCUMENTAL || 'http://localhost:8080/api/documentos';
  }

  /**
   * Sube un archivo individual a la API de Gestión Documental SpringBoot
   */
  async subirArchivo(options: UploadFileOptions): Promise<UploadedDocumentResult> {
    const { file, documentoRef, etiquetas = [], proyectoId } = options;

    if (!proyectoId || proyectoId.trim() === '') {
      throw new Error('No se especificó el proyectoId en la sesión para el header "x-proyecto-id".');
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    if (documentoRef) {
      formData.append('documentoRef', documentoRef);
    }

    for (const etiqueta of etiquetas) {
      formData.append('etiquetas', etiqueta);
    }

    let response: Response;
    try {
      response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-proyecto-id': proyectoId.trim(),
        },
        body: formData,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido de red';
      console.error(`[GestionDocumentalService] Error de red hacia gestión documental: ${msg}`);
      throw new Error(`No se pudo contactar el servicio de gestión documental: ${msg}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[GestionDocumentalService] Gestión documental respondió ${response.status}: ${errorText}`);
      throw new Error(
        `El servicio de gestión documental rechazó el archivo (HTTP ${response.status}): ${errorText || 'Error desconocido'}`
      );
    }

    const data = await response.json().catch(() => ({}));
    const documentId = data.id || data.documentoId || data._id || `doc_${crypto.randomUUID()}`;

    return {
      id: documentId,
      originalName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      rawResponse: data,
      uploadedAt: formatLocalDateTime(),
    };
  }

  /**
   * Sube múltiples archivos secuencialmente a la API de Gestión Documental
   */
  async subirMultiplesArchivos(
    files: File[],
    options: Omit<UploadFileOptions, 'file'>
  ): Promise<UploadedDocumentResult[]> {
    const results: UploadedDocumentResult[] = [];

    for (const file of files) {
      const result = await this.subirArchivo({
        file,
        ...options,
      });
      results.push(result);
    }

    return results;
  }
}

// Exportamos singleton del servicio
export const gestionDocumentalService = new GestionDocumentalService();
