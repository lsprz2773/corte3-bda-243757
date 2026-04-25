# Clinica Veterinaria — Proyecto Final Corte 3 (BDA)

Sistema de gestión segura para una clínica veterinaria. Implementa control de acceso por roles (RLS en PostgreSQL), hardening contra SQL Injection con prepared statements, y caché de consultas costosas con Redis.

---

## Uso

```bash
docker compose up --build
```

| Servicio  | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| API       | http://localhost:3001    |

### Credenciales por defecto

| Rol           | Instrucción de acceso                                          |
|---------------|----------------------------------------------------------------|
| Veterinario   | Seleccionar el veterinario en el dropdown, ingresar su cédula  |
|               | VET-2018-001 (Dr. Fernando López)                              |
|               | VET-2019-014 (Dra. Sofía García)                               |
|               | VET-2021-027 (Dr. Andrés Méndez)                               |
| Recepción     | password = `recepcion123`                                      |
| Administrador | password = `admin123`                                          |

---