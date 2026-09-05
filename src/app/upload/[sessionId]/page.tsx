'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { DocumentSession } from '@/types/session';

interface UploadPageProps {
  params: Promise<{ sessionId: string }>;
}

interface FileWithPreview {
  file: File;
  previewUrl?: string;
}

export default function UploadPage({ params }: UploadPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const [session, setSession] = useState<DocumentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState('Preparando documentos...');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [redirectCount, setRedirectCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar estado inicial de la sesión
  const fetchSession = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('La sesión de carga no fue encontrada o ha caducado.');
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No fue posible obtener los detalles de la sesión.');
      }
      const data: DocumentSession = await res.json();
      setSession(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al consultar la sesión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Manejo de cuenta regresiva de redirección al completar
  useEffect(() => {
    if (uploadSuccess && session?.config?.redirectUrl) {
      setRedirectCount(4);
      const interval = setInterval(() => {
        setRedirectCount((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleRedirect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [uploadSuccess, session]);

  // Limpieza de ObjectURLs para evitar fugas de memoria
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [selectedFiles]);

  const handleRedirect = () => {
    if (!session?.config?.redirectUrl) return;
    try {
      const url = new URL(session.config.redirectUrl);
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('status', 'completed');
      window.location.href = url.toString();
    } catch {
      window.location.href = session.config.redirectUrl;
    }
  };

  // Validaciones de archivos
  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    if (!session) return;
    setErrorMessage(null);

    const maxFiles = session.config.maxFiles || 1;
    const maxSizeBytes = (session.config.maxFileSizeMB || 10) * 1024 * 1024;
    const allowedExts = (session.config.allowedExtensions || []).map((e) => e.toLowerCase());

    const incoming = Array.from(newFiles);
    const existingRaw = selectedFiles.map((s) => s.file);
    const combined = maxFiles === 1 ? incoming.slice(0, 1) : [...existingRaw, ...incoming];

    if (combined.length > maxFiles) {
      setErrorMessage(`El límite permitido es de hasta ${maxFiles} documento${maxFiles > 1 ? 's' : ''}.`);
      return;
    }

    const validFileWrappers: FileWithPreview[] = [];

    for (const f of combined) {
      if (f.size > maxSizeBytes) {
        setErrorMessage(
          `"${f.name}" supera el tamaño límite permitido de ${session.config.maxFileSizeMB} MB.`
        );
        return;
      }

      const match = f.name.match(/\.[0-9a-z]+$/i);
      const ext = match ? match[0].toLowerCase() : '';
      if (allowedExts.length > 0 && (!ext || !allowedExts.includes(ext))) {
        setErrorMessage(
          `El formato de "${f.name}" no está permitido. Formatos aceptados: ${allowedExts.join(', ')}.`
        );
        return;
      }

      const isImage = f.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(f) : undefined;

      validFileWrappers.push({ file: f, previewUrl });
    }

    setSelectedFiles(validFileWrappers);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !session) return;

    try {
      setUploading(true);
      setUploadProgress(25);
      setUploadStepText('Verificando archivos...');
      setErrorMessage(null);

      const formData = new FormData();
      selectedFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      await new Promise((r) => setTimeout(r, 300));
      setUploadProgress(60);
      setUploadStepText('Transfiriendo documentos...');

      const res = await fetch(`/api/sessions/${sessionId}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      setUploadStepText('Finalizando...');

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar los documentos.');
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      setSession(data.session);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al procesar los documentos.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 1. Estado de carga inicial
  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#292524] flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3.5 bg-white border border-[#E7E5E4] p-8 rounded-2xl shadow-xs text-center max-w-xs w-full">
          <div className="w-6 h-6 border-2 border-[#D6D3D1] border-t-[#292524] rounded-full animate-spin"></div>
          <p className="text-stone-600 text-xs font-medium">Cargando...</p>
        </div>
      </main>
    );
  }

  // 2. Sesión no encontrada
  if (!session) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#292524] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E7E5E4] p-8 sm:p-10 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center mx-auto border border-stone-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">Enlace no disponible</h2>
          <p className="text-stone-600 text-xs leading-relaxed">
            {errorMessage || 'El enlace no es válido o ha expirado.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-[#292524] hover:bg-[#1C1917] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 3. Sesión Expirada
  if (session.status === 'EXPIRED') {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#292524] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E7E5E4] p-8 sm:p-10 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center mx-auto border border-stone-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">Sesión expirada</h2>
          <p className="text-stone-600 text-xs leading-relaxed">
            El tiempo límite para esta carga ha concluido.
          </p>
          <p className="text-[11px] text-stone-400">
            Solicite un nuevo enlace desde la aplicación principal.
          </p>
        </div>
      </main>
    );
  }

  // 4. Sesión completada previamente
  if (session.status === 'COMPLETED' && !uploadSuccess) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#292524] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E7E5E4] p-8 rounded-2xl shadow-xs space-y-5">
          <div className="text-center space-y-2">
            <div className="w-11 h-11 bg-stone-100 text-stone-800 rounded-full flex items-center justify-center mx-auto border border-stone-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Documentos registrados</h2>
            <p className="text-stone-500 text-xs">Esta sesión ya fue completada exitosamente.</p>
          </div>

          <div className="space-y-2 bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-3.5">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Archivos recibidos:</p>
            {session.documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white rounded-lg border border-stone-200/70">
                <span className="text-stone-800 truncate max-w-[200px] font-medium">{doc.originalName}</span>
                <span className="text-stone-500 font-mono text-[10px]">
                  {doc.id}
                </span>
              </div>
            ))}
          </div>

          {session.config.redirectUrl && (
            <button
              onClick={handleRedirect}
              className="w-full py-2.5 bg-[#292524] hover:bg-[#1C1917] text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Continuar</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
      </main>
    );
  }

  // 5. Pantalla de Éxito Inmediata
  if (uploadSuccess) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#292524] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E7E5E4] p-8 sm:p-10 rounded-2xl shadow-xs text-center space-y-6">
          <div className="w-12 h-12 bg-stone-100 text-stone-800 rounded-full flex items-center justify-center mx-auto border border-stone-200 shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900">Documentos subidos con éxito</h2>
            <p className="text-stone-500 text-xs mt-1.5 leading-relaxed">
              Los archivos han sido guardados y registrados correctamente.
            </p>
          </div>

          <div className="bg-[#FAF9F6] border border-[#E7E5E4] rounded-xl p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
              <span>Archivos guardados ({session.documents.length})</span>
            </div>

            <div className="space-y-1.5">
              {session.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-white rounded-lg border border-stone-200">
                  <span className="text-stone-800 truncate max-w-[200px] font-medium">{doc.originalName}</span>
                  <span className="text-stone-500 font-mono text-[10px]">
                    {doc.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {session.config.redirectUrl ? (
            <div className="space-y-3 pt-1">
              <button
                onClick={handleRedirect}
                className="w-full py-3 bg-[#292524] hover:bg-[#1C1917] text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continuar</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              {redirectCount !== null && (
                <p className="text-[11px] text-stone-400">
                  Redireccionando en {redirectCount}s...
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400">
              Puedes cerrar esta pestaña.
            </p>
          )}
        </div>
      </main>
    );
  }

  // 6. Vista Principal de Carga (Limpia, Sin badges innecesarios, con Punteros de Slots)
  const maxFilesAllowed = session.config.maxFiles || 1;
  const isMultiple = maxFilesAllowed > 1;

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#292524] flex flex-col items-center justify-center p-4 sm:p-6 antialiased font-sans">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Cabecera Limpia */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            {session.config.title || 'Carga de Documentos'}
          </h1>

          {session.config.description && (
            <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              {session.config.description}
            </p>
          )}
        </div>

        {/* Tarjeta de Carga */}
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3.5 bg-stone-100 border border-stone-300 rounded-xl flex items-start gap-2.5 text-stone-800 text-xs leading-relaxed">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple={isMultiple}
              accept={session.config.allowedExtensions.join(',')}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  validateAndAddFiles(e.target.files);
                }
              }}
              className="hidden"
            />

            {/* Dropzone Limpia */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-stone-900 bg-stone-100 scale-[1.01]'
                  : 'border-stone-300 hover:border-stone-400 bg-[#FAF9F6]/60 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white border border-stone-200 text-stone-700 flex items-center justify-center shadow-2xs">
                <svg className="w-5 h-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-800">
                  {isDragging ? 'Suelta los archivos aquí' : 'Haz clic para seleccionar o arrastra tus archivos aquí'}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  {isMultiple
                    ? `Hasta ${maxFilesAllowed} archivos (máx. ${session.config.maxFileSizeMB} MB por archivo)`
                    : `1 archivo de hasta ${session.config.maxFileSizeMB} MB`}
                </p>
              </div>

              {/* Formatos permitidos */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                {session.config.allowedExtensions.map((ext) => (
                  <span
                    key={ext}
                    className="text-[10px] font-mono uppercase bg-stone-200/60 text-stone-700 px-2 py-0.5 rounded-md border border-stone-300/60 font-medium"
                  >
                    {ext.replace('.', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Punteros de Slots / Cantidad de Archivos */}
            <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-700">Archivos adjuntos:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: maxFilesAllowed }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block w-2.5 h-2.5 rounded-full transition-colors ${
                        i < selectedFiles.length
                          ? 'bg-[#292524]'
                          : 'bg-stone-300 border border-stone-400/40'
                      }`}
                      title={`Espacio ${i + 1} de ${maxFilesAllowed}`}
                    />
                  ))}
                </div>
              </div>
              <span className="font-medium text-stone-500 font-mono text-[11px]">
                {selectedFiles.length} de {maxFilesAllowed}
              </span>
            </div>

            {/* Lista de Archivos Seleccionados con Previsualización */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-stone-600 font-medium px-1">
                  <span>Detalle de archivos</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-stone-400 hover:text-stone-700 transition-colors text-[11px] cursor-pointer"
                  >
                    Limpiar todo
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selectedFiles.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="bg-[#FAF9F6] border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.previewUrl ? (
                          // Miniatura para imágenes
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          // Badge para documentos (PDF, DOCX, etc)
                          <div className="w-9 h-9 rounded-lg bg-stone-200/80 text-stone-700 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono uppercase border border-stone-300/50">
                            {item.file.name.split('.').pop()?.slice(0, 3) || 'DOC'}
                          </div>
                        )}

                        <div className="truncate">
                          <p className="text-xs font-medium text-stone-800 truncate">{item.file.name}</p>
                          <p className="text-[11px] text-stone-400 font-mono">{formatBytes(item.file.size)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                        className="text-stone-400 hover:text-stone-700 p-1.5 rounded-md hover:bg-stone-200/50 transition-colors cursor-pointer"
                        title="Eliminar archivo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de progreso interactiva */}
            {uploading && (
              <div className="space-y-2 bg-[#FAF9F6] border border-stone-200 p-3.5 rounded-xl">
                <div className="flex justify-between text-xs text-stone-600 font-medium">
                  <span>{uploadStepText}</span>
                  <span className="font-mono text-stone-800 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#292524] h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || uploading}
              className={`w-full py-3.5 px-5 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                selectedFiles.length === 0 || uploading
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#292524] hover:bg-[#1C1917] text-white cursor-pointer shadow-xs active:scale-[0.99]'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Enviar documento{selectedFiles.length > 1 ? 's' : ''}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
