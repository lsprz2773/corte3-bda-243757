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

## Seccion de preguntas
### 1. ¿Qué política RLS aplicaste a `mascotas`?

```sql
CREATE POLICY mascotas_vet_isolation ON mascotas
  FOR ALL TO PUBLIC
  USING (
    COALESCE(current_setting('app.current_role', TRUE), 'admin') != 'veterinario'
    OR id IN (
      SELECT mascota_id FROM vet_atiende_mascota
      WHERE vet_id = NULLIF(current_setting('app.current_vet_id', TRUE), '')::INT
    )
  );
```

**Explicación:** Si el rol activo no es `'veterinario'`, la condición `COALESCE(...) != 'veterinario'` evalúa a `TRUE` y la fila es visible (recepción y admin ven todas las filas). Si el rol es `'veterinario'`, el primer operando del `OR` es `FALSE` y la política cae al segundo: solo se muestran las filas donde el `id` de la mascota aparece en `vet_atiende_mascota` con el `vet_id` del veterinario activo. El `NULLIF` previene un cast fallido si la variable llega vacía.

---

### 2. ¿Qué vector de ataque tiene tu estrategia de identificación de veterinario en RLS?

El vector de ataque es que cualquier proceso con acceso a la conexión de base de datos podría ejecutar:

```sql
SELECT set_config('app.current_vet_id', '1', true);
```

antes de una query y hacerse pasar por otro veterinario, saltándose el filtro RLS de esa sesión.

**El sistema lo previene por tres razones:**

1. Solo el backend tiene acceso directo a la base de datos. El frontend nunca se conecta a PostgreSQL — pasa siempre por la API Express.
2. El `vet_id` se extrae del JWT firmado con `JWT_SECRET`. El cliente no puede alterar ese valor sin invalidar la firma.
3. La variable se establece con `SET LOCAL`, que la hace local a la transacción actual. Al hacer `COMMIT` o `ROLLBACK` (o al terminar la transacción), PostgreSQL la descarta automáticamente. Una nueva query en la misma conexión de pool ya no hereda el valor.

---

### 3. ¿Usas SECURITY DEFINER?

No. Ningún procedure ni función del proyecto usa `SECURITY DEFINER`.

El procedure `sp_agendar_cita` usa `SECURITY INVOKER` (el comportamiento por defecto de PostgreSQL), lo que significa que se ejecuta con los privilegios del rol que hace la llamada — en producción, `clinica_app`. Esto elimina el riesgo de escalada de privilegios porque el procedure nunca obtiene privilegios superiores a los del llamador. No es necesario fijar `search_path` explícitamente porque no hay cambio de contexto de privilegio que pudiera ser explotado mediante un `search_path` malicioso.

---

### 4. ¿Qué TTL elegiste para Redis y por qué?

**TTL = 300 segundos (5 minutos).**

Justificación numérica:

- La vista `v_mascotas_vacunacion_pendiente` tarda aproximadamente 80–150 ms en ejecutarse (JOIN sobre tablas con 10 000–50 000 filas en producción real).
- El endpoint se consulta aproximadamente 30 veces por hora cuando hay una pantalla activa por usuario.
- Sin caché: 30 × 150 ms = **4.5 s de cómputo DB por hora**.
- Con TTL = 300 s hay ~6 misses/hora: 6 × 150 ms = 0.9 s → **80 % de reducción**.

Por qué no 60 s: generaría 30 misses/hora — casi sin beneficio real.  
Por qué no 3 600 s: si se aplica una vacuna, la lista pendiente quedaría desactualizada hasta 1 hora, degradando la experiencia clínica.

El sistema invalida el caché manualmente con `DEL vacunacion_pendiente` en `POST /vacunas`, así que el TTL actúa solo como fallback de seguridad ante errores de invalidación.

---

### 5. Línea exacta del backend que protege el endpoint de búsqueda de mascotas

```
Archivo: api/src/routes/mascotas.ts
```

```typescript
return client.query(
  'SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento, m.dueno_id, d.nombre AS dueno_nombre FROM mascotas m JOIN duenos d ON d.id = m.dueno_id WHERE m.nombre ILIKE $1 LIMIT 50',
  [`%${q}%`]
);
```

El valor `q` (el parámetro de búsqueda recibido del cliente) nunca se concatena a la cadena SQL. Se pasa como segundo argumento al método `.query()` del driver `pg`, que lo serializa como parámetro posicional `$1` y lo escapa antes de enviarlo al servidor PostgreSQL. Cualquier payload de inyección — comillas simples, `UNION`, `--` — se trata como texto literal a buscar en el campo `nombre`. No existe interpolación de strings en ningún punto de esa query.

---

### 6. Si se revocan todos los permisos del veterinario excepto SELECT en mascotas

Tres operaciones que dejarían de funcionar:

1. **Agendar citas** — el procedure `sp_agendar_cita` ejecuta un `INSERT INTO citas`. Como usa `SECURITY INVOKER`, hereda los permisos del llamador (`clinica_app` asumiendo `rol_veterinario`). Sin `INSERT` en `citas`, el procedure lanza `permission denied for table citas` y la transacción hace rollback.

2. **Aplicar vacunas** — el endpoint `POST /vacunas` ejecuta `INSERT INTO vacunas_aplicadas`. Sin ese permiso para `rol_veterinario`, PostgreSQL rechaza la operación con `permission denied for table vacunas_aplicadas`. El endpoint retorna 500.

3. **Registrar en historial** — el trigger `trg_historial_cita` se dispara `AFTER INSERT ON citas` e intenta `INSERT INTO historial_movimientos`. Dado que el trigger hereda el contexto `SECURITY INVOKER` del rol que ejecutó el `INSERT` original (el veterinario), el `INSERT` al historial también falla por falta de permisos. Incluso si el `INSERT` en `citas` llegara a ejecutarse, el trigger lo revertiría.
