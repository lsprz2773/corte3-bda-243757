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

export interface SessionData {
  rol: 'veterinario' | 'recepcion' | 'admin';
  vet_id?: number;
  nombre?: string;
}

export interface ApiError {
  error: string;
}
