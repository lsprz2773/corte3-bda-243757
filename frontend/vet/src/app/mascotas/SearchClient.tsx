'use client';

import { useState, useEffect } from 'react';
import type { Mascota, SessionData } from '@/types';

function formatFecha(fecha: string | null): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const ROL_LABELS: Record<string, string> = {
  veterinario: 'Veterinario',
  recepcion: 'Recepcion',
  admin: 'Administrador',
};

function EspeciePill({ especie }: { especie: string }) {
  const map: Record<string, string> = {
    perro: 'bg-amber-50 text-amber-700 border-amber-200',
    gato: 'bg-violet-50 text-violet-700 border-violet-200',
    conejo: 'bg-rose-50 text-rose-700 border-rose-200',
    ave: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const cls = map[especie.toLowerCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border capitalize ${cls}`}>
      {especie}
    </span>
  );
}

export default function SearchClient() {
  const [query, setQuery] = useState<string>('');
  const [mascotas, setMascotas] = useState<Mascota[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searched, setSearched] = useState<boolean>(false);
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('session');
      if (raw) setSession(JSON.parse(raw) as SessionData);
    } catch { /* ignore */ }
  }, []);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/mascotas/buscar?q=${encodeURIComponent(query)}`);
      if (res.status === 401) { window.location.href = '/login'; return; }
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Error al buscar mascotas.');
        setMascotas(null);
        return;
      }
      setMascotas(await res.json() as Mascota[]);
    } catch {
      setError('Error de conexion. Verifica la red e intenta de nuevo.');
      setMascotas(null);
    } finally {
      setLoading(false);
    }
  }

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
                <a href="/mascotas" className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                  Mascotas
                </a>
                <a href="/vacunacion" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
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
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Busqueda de mascotas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Consulta el registro de pacientes por nombre</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2.5 mb-7">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {mascotas !== null && (
          mascotas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg className="w-10 h-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="text-sm font-medium text-slate-500">Sin resultados para &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Intenta con otro termino de busqueda</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Resultados
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {mascotas.length} {mascotas.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Especie</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dueno</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nacimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mascotas.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{m.nombre}</td>
                        <td className="px-5 py-3.5"><EspeciePill especie={m.especie} /></td>
                        <td className="px-5 py-3.5 text-slate-600">{m.dueno_nombre ?? '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-xs tabular-nums">
                          {formatFecha(m.fecha_nacimiento)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-sm text-slate-400">Ingresa un termino para iniciar la busqueda</p>
          </div>
        )}
      </main>
    </div>
  );
}
