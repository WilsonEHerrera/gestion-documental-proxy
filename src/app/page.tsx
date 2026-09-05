'use client';

import React, { useState } from 'react';
import { CreateSessionDto, CreateSessionResponse, DocumentSession } from '@/types/session';

export default function HomePage() {
  const [apiKey, setApiKey] = useState('prv_live_demo123456789');
  const [form, setForm] = useState<CreateSessionDto>({
    proyectoId: 'PROYECTO_DEMO_01',
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.docx'],
    maxFileSizeMB: 10,
    maxFiles: 1,
    title: 'Carga de Documentos',
    description: 'Adjunte los archivos solicitados para completar la validación.',
    documentoRef: 'REF-EXPEDIENTE-2026',
    etiquetas: ['expediente', 'tramite'],
    redirectUrl: 'https://ejemplo-origen.com/retorno',
    expiresInMinutes: 30,
  });

  const [extString, setExtString] = useState('.pdf, .png, .jpg, .jpeg, .docx');
  const [etiquetasString, setEtiquetasString] = useState('expediente, tramite');

  const [loading, setLoading] = useState(false);
  const [createdSession, setCreatedSession] = useState<CreateSessionResponse | null>(null);
  const [inspectedSession, setInspectedSession] = useState<DocumentSession | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: CreateSessionDto = {
        ...form,
        allowedExtensions: extString
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        etiquetas: etiquetasString
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar la sesión');
      }

      setCreatedSession(data);
      handleInspect(data.sessionId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (id: string) => {
    setInspectLoading(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        headers: {
          'x-api-key': apiKey.trim(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setInspectedSession(data);
      }
    } catch {
      // Ignore
    } finally {
      setInspectLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#292524] pb-16 antialiased font-sans">
      <header className="border-b border-[#E7E5E4] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#292524] text-white flex items-center justify-center font-bold text-xs">
              GD
            </div>
            <div>
              <span className="font-semibold text-stone-900 tracking-tight text-sm">Gestión Documental</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/docs"
              className="text-xs text-stone-600 hover:text-stone-900 font-medium px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Documentación API</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <section className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-xs">
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Sandbox de Pruebas
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Entorno de prueba para simular la creación y consulta de sesiones de carga utilizando tus credenciales de proyecto.
          </p>
        </section>

        {/* Grid Principal: Formulario de Creación + Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-7 bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-xs">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-stone-900">
                1. Crear Sesión de Prueba (POST /api/sessions)
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">Autenticación y parámetros de la sesión</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              {/* Campo API Key */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                <label className="block font-medium text-stone-700">
                  API Key Privada (Header <code className="font-mono text-[11px]">x-api-key</code>) <span className="text-stone-900">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 font-mono text-xs"
                  placeholder="prv_live_..."
                />
                <p className="text-[10px] text-stone-400">
                  Llave privada registrada en la base de datos de proyectos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Documento Ref. (documentoRef)
                  </label>
                  <input
                    type="text"
                    value={form.documentoRef || ''}
                    onChange={(e) => setForm({ ...form, documentoRef: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 font-mono text-xs"
                    placeholder="EXPEDIENTE-123"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Título en el Widget
                  </label>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Tamaño Máx. (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.maxFileSizeMB}
                    onChange={(e) => setForm({ ...form, maxFileSizeMB: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Máx. Archivos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.maxFiles}
                    onChange={(e) => setForm({ ...form, maxFiles: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Expiración (Min.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={form.expiresInMinutes}
                    onChange={(e) => setForm({ ...form, expiresInMinutes: parseInt(e.target.value, 10) || 30 })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Extensiones Permitidas
                </label>
                <input
                  type="text"
                  value={extString}
                  onChange={(e) => setExtString(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 font-mono text-xs"
                  placeholder=".pdf, .docx, .png, .jpg"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  URL de Retorno (redirectUrl)
                </label>
                <input
                  type="text"
                  value={form.redirectUrl || ''}
                  onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-stone-900 text-xs font-mono"
                  placeholder="https://tu-sistema.com/retorno"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#292524] hover:bg-[#1C1917] text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generando sesión...</span>
                  </>
                ) : (
                  <span>Generar Sesión de Prueba</span>
                )}
              </button>
            </form>

            {/* Resultado Sesión Creada */}
            {createdSession && (
              <div className="mt-5 p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-800 uppercase tracking-wider">
                    Sesión Generada
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">{createdSession.sessionId}</span>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Enlace para el usuario:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdSession.url}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-800 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(createdSession.url)}
                      className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={createdSession.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#292524] hover:bg-[#1C1917] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>Abrir Widget de Carga</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleInspect(createdSession.sessionId)}
                    className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Inspeccionar JSON
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Inspector de Estado */}
          <div className="lg:col-span-5 bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">2. Consultar Sesión</h3>
                <p className="text-[11px] text-stone-500">GET /api/sessions/[sessionId]</p>
              </div>
              {inspectedSession && (
                <button
                  onClick={() => handleInspect(inspectedSession.sessionId)}
                  className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                >
                  Refrescar
                </button>
              )}
            </div>

            {inspectLoading ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Consultando sesión...
              </div>
            ) : inspectedSession ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="text-stone-500">Estado:</span>
                  <span className="font-semibold text-xs text-stone-900 bg-stone-200 px-2 py-0.5 rounded">
                    {inspectedSession.status}
                  </span>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5">
                  <p className="text-[11px] font-medium text-stone-500 mb-1">
                    Documentos ({inspectedSession.documents.length}):
                  </p>
                  {inspectedSession.documents.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">Sin archivos subidos aún</p>
                  ) : (
                    <div className="space-y-1">
                      {inspectedSession.documents.map((doc, i) => (
                        <div key={i} className="text-[11px] bg-white p-2 rounded border border-stone-200 flex items-center justify-between">
                          <span className="text-stone-800 truncate max-w-[140px] font-medium">{doc.originalName}</span>
                          <span className="text-stone-500 font-mono text-[10px]">{doc.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] text-stone-500 mb-1 font-mono">Respuesta JSON:</p>
                  <pre className="bg-[#242933] text-zinc-100 border border-zinc-700/60 rounded-xl p-3 text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                    {JSON.stringify(inspectedSession, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-stone-400 text-xs space-y-1">
                <p>Genera una sesión para inspeccionar sus datos.</p>
                <p className="text-[11px] text-stone-300">Los datos se consultarán con tu API Key.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
