CREATE OR REPLACE VIEW v_mascotas_vacunacion_pendiente AS
SELECT DISTINCT
    m.id                                          AS mascota_id,
    m.nombre                                      AS mascota_nombre,
    m.especie,
    d.nombre                                      AS dueno_nombre,
    d.telefono,
    CASE
        WHEN uv.ultima_vacunacion IS NULL
            THEN 'Sin registro de vacunacion'
        ELSE 'Vacunacion vencida (ultima: ' ||
             TO_CHAR(uv.ultima_vacunacion, 'DD/MM/YYYY') || ')'
    END                                           AS estado_vacunacion,
    uv.ultima_vacunacion
FROM mascotas m
JOIN duenos d
    ON d.id = m.dueno_id
LEFT JOIN (
    SELECT
        mascota_id,
        MAX(fecha_aplicacion) AS ultima_vacunacion
    FROM vacunas_aplicadas
    GROUP BY mascota_id
) uv ON uv.mascota_id = m.id
WHERE uv.ultima_vacunacion IS NULL
   OR uv.ultima_vacunacion < NOW() - INTERVAL '1 year';
