# Cuaderno de Ataques — Clínica Veterinaria


---

## Ataque 1: Login Bypass (Classic SQLi)

**Objetivo:** Autenticarse como un veterinario sin conocer su cédula.

**Endpoint:** `POST /auth/login`

**Payload sin defensa:**
```json
{ "rol": "veterinario", "vet_id": 1, "cedula": "' OR '1'='1" }
```

**Query vulnerable (si se usara concatenación de strings):**
```sql
SELECT id, nombre FROM veterinarios
WHERE id = '1' AND cedula = '' OR '1'='1' AND activo = TRUE
-- El OR '1'='1' siempre evalúa a TRUE
-- Retorna el primer registro activo → login sin credenciales válidas
```

**Resultado sin defensa:** El atacante obtiene un JWT válido del Dr. Fernando López sin conocer su cédula real (`VET-2018-001`). A partir de ese token puede acceder a todas las rutas protegidas con ese rol.

**Defensa implementada (`api/src/routes/auth.ts`):**
```typescript
const result = await pool.query(
  'SELECT id, nombre, cedula FROM veterinarios WHERE id = $1 AND cedula = $2 AND activo = TRUE',
  [vet_id, cedula]
);
```

`$1` y `$2` son parámetros posicionales. El driver `pg` los serializa y escapa antes de enviar la query al servidor. La cédula `' OR '1'='1` se trata literalmente como una cadena de texto: PostgreSQL busca una fila donde `cedula = ''' OR ''1''=''1'` — no existe ninguna → la query retorna 0 filas → `401 Unauthorized`.

---

## Ataque 2: UNION Exfiltration

**Objetivo:** Extraer todos los veterinarios y sus cédulas vía el endpoint de búsqueda de mascotas.

**Endpoint:** `GET /mascotas/buscar?q=`

**Payload sin defensa:**
```
GET /mascotas/buscar?q=x' UNION SELECT id, cedula, especie, fecha_nacimiento, dueno_id, nombre FROM veterinarios--
```

**Query vulnerable (si se usara interpolación de strings):**
```sql
SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento, m.dueno_id, d.nombre AS dueno_nombre
FROM mascotas m JOIN duenos d ON d.id = m.dueno_id
WHERE m.nombre ILIKE '%x'
UNION
SELECT id, cedula, especie, fecha_nacimiento, dueno_id, nombre FROM veterinarios--'%'
-- El UNION inyecta todas las filas de veterinarios en el resultado
-- La cédula aparece en la columna "nombre" de la respuesta JSON
```

**Resultado sin defensa:** La respuesta JSON incluye objetos con `nombre = "VET-2018-001"` (la cédula del Dr. López), `"VET-2019-014"`, etc. Las credenciales de acceso quedan expuestas en una petición GET sin autenticación.

**Defensa implementada (`api/src/routes/mascotas.ts`, aproximadamente línea 25):**
```typescript
return client.query(
  'SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento, m.dueno_id, d.nombre AS dueno_nombre FROM mascotas m JOIN duenos d ON d.id = m.dueno_id WHERE m.nombre ILIKE $1 LIMIT 50',
  [`%${q}%`]
);
```

Con el parámetro preparado, el valor completo `x' UNION SELECT id, cedula...` se trata como una sola cadena de texto a buscar en `m.nombre`. El servidor PostgreSQL nunca interpreta la comilla ni el `UNION` como sintaxis SQL. La query literalmente busca mascotas cuyo nombre contenga esa cadena exacta. Resultado: `[]` — array vacío, sin fuga de datos.

---

## Ataque 3: Blind Time-Based SQLi

**Objetivo:** Confirmar la existencia de la tabla `veterinarios` sin acceso directo, usando el tiempo de respuesta como canal encubierto de información.

**Endpoint:** `GET /mascotas/buscar?q=`

**Payload sin defensa:**
```
GET /mascotas/buscar?q=x'; SELECT CASE WHEN (SELECT COUNT(*) FROM veterinarios) > 0 THEN pg_sleep(5) ELSE pg_sleep(0) END--
```

**Query vulnerable (stacked queries en algunos drivers/configuraciones):**
```sql
SELECT ... FROM mascotas m WHERE m.nombre ILIKE '%x';
SELECT CASE
  WHEN (SELECT COUNT(*) FROM veterinarios) > 0 THEN pg_sleep(5)
  ELSE pg_sleep(0)
END--'%'
-- Si la tabla existe y tiene filas → respuesta tarda >5 segundos
-- El tiempo de respuesta confirma la hipótesis sin errores visibles en el cuerpo
```

**Resultado sin defensa:** La respuesta HTTP tarda más de 5 segundos → el atacante confirma que la tabla `veterinarios` existe y tiene al menos un registro. Con variaciones del payload puede enumerar tablas, columnas y valores de forma silenciosa.

**Defensa implementada:** El mismo prepared statement de `mascotas.ts`. El driver `pg` no permite stacked queries en queries parametrizadas: solo se puede enviar una query por llamada a `.query()`. El payload completo — incluyendo el punto y coma y el `SELECT pg_sleep(5)` — se busca como string literal en los nombres de mascotas. La respuesta llega en menos de 50 ms. No hay información de timing explotable.

---

## Sección 2: Demo RLS

### Escenario

El mismo `SELECT` sobre `mascotas` produce resultados distintos según las variables de sesión que establece el backend antes de ejecutar la query.

### Como Dr. Fernando López (vet_id = 1)

La API establece estas variables al inicio de la transacción:

```sql
-- La API ejecuta dentro de la misma transacción, antes de la query de negocio:
SELECT set_config('app.current_role', 'veterinario', true);
SELECT set_config('app.current_vet_id', '1', true);
```

Query de búsqueda:
```sql
SELECT id, nombre FROM mascotas WHERE nombre ILIKE '%';
```

Resultado filtrado por la política RLS `mascotas_vet_isolation`:
```
 id | nombre
----+---------
  1 | Firulais
  5 | Toby
  7 | Max
(3 filas)
```

Solo las mascotas asignadas al Dr. López en `vet_atiende_mascota`. Las 7 filas restantes existen en la tabla pero RLS las oculta completamente — no hay error, simplemente no aparecen.

### Como Administrador

```sql
SELECT set_config('app.current_role', 'admin', true);

SELECT id, nombre FROM mascotas;
```

Resultado:
```
 id | nombre
----+---------
  1 | Firulais
  2 | Misifú
  3 | Rocky
  4 | Luna
  5 | Toby
  6 | Pelusa
  7 | Max
  8 | Coco
  9 | Dante
 10 | Mango
(10 filas)
```

La condición `COALESCE(current_setting('app.current_role', TRUE), 'admin') != 'veterinario'` evalúa a `TRUE` para el rol `'admin'`, por lo que todas las filas pasan el filtro.

### Recepcionista intentando acceder a vacunas_aplicadas

```sql
SELECT set_config('app.current_role', 'recepcion', true);

SELECT * FROM vacunas_aplicadas;
```

Resultado:
```
(0 filas)
```

La política RLS de `vacunas_aplicadas` solo permite acceso a `'admin'` (todas las filas) o `'veterinario'` (solo las de sus mascotas). El rol `'recepcion'` no satisface ninguna rama de la política. Adicionalmente, `rol_recepcion` no tiene `GRANT` sobre esa tabla. El resultado es 0 filas sin error — RLS es silencioso por diseño.

---

## Sección 3: Demo Redis

### Secuencia de llamadas al endpoint de vacunación pendiente

**Primera llamada — cold cache:**
```
Request:  GET /vacunacion/pendiente
Log:      [CACHE MISS] vacunacion_pendiente
Acción:   SELECT * FROM v_mascotas_vacunacion_pendiente  (~120 ms)
Redis:    SET vacunacion_pendiente <json> EX 300
Response: { "data": [...], "from_cache": false }
```

**Segunda llamada — hot cache (dentro de los primeros 5 minutos):**
```
Request:  GET /vacunacion/pendiente
Log:      [CACHE HIT] vacunacion_pendiente
Redis:    GET vacunacion_pendiente  (~3 ms)
Response: { "data": [...], "from_cache": true }
```

La respuesta es idéntica al contenido anterior pero llega ~40 veces más rápido. La base de datos no recibe ninguna query.

**Después de aplicar una vacuna:**
```
Request:  POST /vacunas  { mascota_id: 1, vacuna_id: 3, costo_cobrado: 290 }
Acción:   INSERT INTO vacunas_aplicadas (...)
Acción:   DEL vacunacion_pendiente   ← invalidación inmediata del caché
Log:      [CACHE INVALIDATED] vacunacion_pendiente

Siguiente GET /vacunacion/pendiente:
Log:      [CACHE MISS] vacunacion_pendiente   ← datos frescos
Acción:   SELECT * FROM v_mascotas_vacunacion_pendiente  (~120 ms)
Response: { "data": [...], "from_cache": false }
          ↑ ya no incluye la mascota recién vacunada
```

### Por qué TTL = 300 s

| Escenario           | Misses/hora | Cómputo DB/hora | Datos desactualizados hasta |
|---------------------|-------------|-----------------|------------------------------|
| Sin caché           | 30          | ~4 500 ms       | N/A                          |
| TTL = 60 s          | 30          | ~4 500 ms       | 60 s                         |
| **TTL = 300 s**     | **6**       | **~900 ms**     | **300 s (fallback)**         |
| TTL = 3 600 s       | 1           | ~150 ms         | Hasta 1 hora                 |

Con TTL = 300 s se logra una reducción del 80 % en cómputo de base de datos respecto a no usar caché. El valor de 60 s ofrece casi ningún beneficio porque el número de misses es igual al de no tener caché. El valor de 3 600 s introduce riesgo real de datos clínicos desactualizados (una mascota vacunada seguiría apareciendo como "pendiente" hasta 1 hora). La invalidación manual con `DEL` hace que el TTL sea solo el mecanismo de seguridad ante fallos en la invalidación, no el mecanismo principal de actualización.