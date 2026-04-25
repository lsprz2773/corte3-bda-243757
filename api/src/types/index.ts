export interface Dueno {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
}

export interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  fecha_nacimiento: string | null;
  dueno_id: number;
  dueno_nombre?: string;
}

export interface Veterinario {
  id: number;
  nombre: string;
  cedula: string;
  dias_descanso: string;
  activo: boolean;
}

export interface Cita {
  id: number;
  mascota_id: number;
  veterinario_id: number;
  fecha_hora: string;
  motivo: string | null;
  costo: number | null;
  estado: 'AGENDADA' | 'COMPLETADA' | 'CANCELADA';
}

export interface VacunaAplicada {
  id: number;
  mascota_id: number;
  vacuna_id: number;
  veterinario_id: number;
  fecha_aplicacion: string;
  costo_cobrado: number | null;
}

export interface InventarioVacuna {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
}

export interface MascotaVacunacionPendiente {
  mascota_id: number;
  mascota_nombre: string;
  especie: string;
  dueno_nombre: string;
  telefono: string | null;
  estado_vacunacion: string;
  ultima_vacunacion: string | null;
}

export interface HistorialMovimiento {
  id: number;
  tipo: string;
  referencia_id: number | null;
  descripcion: string | null;
  fecha: string;
}

export interface AuthPayload {
  rol: 'veterinario' | 'recepcion' | 'admin';
  vet_id?: number;
  nombre?: string;
}

export interface LoginRequest {
  rol: 'veterinario' | 'recepcion' | 'admin';
  vet_id?: number;
  cedula?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  rol: 'veterinario' | 'recepcion' | 'admin';
  vet_id?: number;
  nombre?: string;
}
