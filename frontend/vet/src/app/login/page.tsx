'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Veterinario, SessionData } from '@/types';

type Rol = 'veterinario' | 'recepcion' | 'admin';

export default function LoginPage() {
  const router = useRouter();

  const [rol, setRol] = useState<Rol>('recepcion');
  const [vetId, setVetId] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loadingVets, setLoadingVets] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (rol === 'veterinario') {
      setLoadingVets(true);
      fetch('/api/veterinarios')
        .then((r) => r.json())
        .then((data: Veterinario[]) => {
          setVeterinarios(data);
          if (data.length > 0) setVetId(String(data[0].id));
        })
        .catch(() => setError('No se pudo cargar la lista de veterinarios.'))
        .finally(() => setLoadingVets(false));
    }
  }, [rol]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const body: Record<string, string | number> = { rol };
      if (rol === 'veterinario') {
        body.vet_id = Number(vetId);
        body.cedula = cedula;
      } else {
        body.password = password;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Credenciales incorrectas.');
        return;
      }

      const session: SessionData = {
        rol: data.rol,
        vet_id: data.vet_id,
        nombre: data.nombre,
      };
      localStorage.setItem('session', JSON.stringify(session));
      router.push('/mascotas');
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow';

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 flex-col justify-between p-14">
        <div>
          <div className="flex items-center gap-2.5 mb-20">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-white font-semibold tracking-tight">VetClinic</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Sistema de<br />Gestion Clinica
          </h1>
          <p className="text-slate-400 mt-5 text-base leading-relaxed max-w-xs">
            Plataforma centralizada para la gestion de pacientes, citas y control de vacunacion.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <p className="text-slate-600 text-xs">
            Acceso restringido al personal autorizado
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900">VetClinic</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesion</h2>
          <p className="text-slate-500 text-sm mt-1.5 mb-8">
            Selecciona tu rol e ingresa tus credenciales
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Rol de acceso
              </label>
              <select
                value={rol}
                onChange={(e) => {
                  setRol(e.target.value as Rol);
                  setError('');
                  setCedula('');
                  setPassword('');
                }}
                className={inputClass}
              >
                <option value="recepcion">Recepcion</option>
                <option value="veterinario">Veterinario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {rol === 'veterinario' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Veterinario
                  </label>
                  {loadingVets ? (
                    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-400 text-sm">
                      Cargando...
                    </div>
                  ) : (
                    <select value={vetId} onChange={(e) => setVetId(e.target.value)} required className={inputClass}>
                      {veterinarios.map((v) => (
                        <option key={v.id} value={v.id}>{v.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Cedula profesional
                  </label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="VET-XXXX-XXX"
                    required
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {(rol === 'recepcion' || rol === 'admin') && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  className={inputClass}
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 mt-2"
            >
              {submitting ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
