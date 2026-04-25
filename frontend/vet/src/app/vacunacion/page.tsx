'use client';

import { useState, useEffect } from 'react';
import type { MascotaVacunacionPendiente, SessionData } from '@/types';

function formatFecha(fecha: string | null): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function EstadoPill({ estado }: { estado: string }) {
  const lower = estado.toLowerCase();
  let cls = 'bg-slate-100 text-slate-600 border-slate-200';
  if (lower.includes('nunca')) cls = 'bg-red-50 text-red-700 border-red-200';
  else if (lower.includes('dia')) cls = 'bg-slate-100 text-slate-600 border-slate-200';
  else cls = 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {estado}
    </span>
  );
}

interface VacunacionResponse {
  data: MascotaVacunacionPendiente[];
  from_cache: boolean;
}

const ROL_LABELS: Record<string, string> = {
  veterinario: 'Veterinario',
  recepcion: 'Recepcion',
  admin: 'Administrador',
};

export default function VacunacionPage() {
  const [result, setResult] = useState<VacunacionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('session');
      if (raw) setSession(JSON.parse(raw) as SessionData);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/vacunacion/pendiente')
      .then(async (res) => {
        if (res.status === 401) { window.location.href = '/login'; return; }
        if (!res.ok) {
          const d = await res.json() as { error?: string };
          setError(d.error ?? 'Error al cargar vacunaciones.');
          return;
        }
        setResult(await res.json() as VacunacionResponse);
      })
      .catch(() => setError('Error de conexion. Verifica la red e intenta de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('session');
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-900 text-sm">VetClinic</span>
              </div>
              <nav className="hidden sm:flex items-center gap-1">
                <a href="/mascotas" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                  Mascotas
                </a>
                <a href="/vacunacion" className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                  Vacunacion
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {session && (
                <div className="hidden sm:flex items-center gap-2">
                  {session.nombre && (
                    <span className="text-sm text-slate-600">{session.nombre}</span>
                  )}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {ROL_LABELS[session.rol] ?? session.rol}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Vacunacion pendiente</h1>
            <p className="text-slate-500 text-sm mt-0.5">Mascotas que requieren atencion de vacunas</p>
          </div>

          {result && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${
              result.from_cache
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${result.from_cache ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {result.from_cache ? 'Cache hit' : 'Cache miss'}
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg h-14 animate-pulse border border-slate-200" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && result?.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="w-10 h-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-slate-500">Sin vacunaciones pendientes</p>
            <p className="text-xs mt-1">Todos los pacientes estan al dia</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && result && result.data.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pacientes
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                {result.data.length} {result.data.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mascota</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Especie</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dueno</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefono</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ultima vacuna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((m) => (
                    <tr key={m.mascota_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{m.mascota_nombre}</td>
                      <td className="px-5 py-3.5 text-slate-600 capitalize">{m.especie}</td>
                      <td className="px-5 py-3.5 text-slate-600">{m.dueno_nombre}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-xs tabular-nums">
                        {m.telefono ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <EstadoPill estado={m.estado_vacunacion} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-xs tabular-nums">
                        {formatFecha(m.ultima_vacunacion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
