DROP PROCEDURE IF EXISTS sp_agendar_cita(INT, INT, TIMESTAMP, TEXT, NUMERIC, OUT INT);

CREATE PROCEDURE sp_agendar_cita(
    IN  p_mascota_id      INT,
    IN  p_veterinario_id  INT,
    IN  p_fecha_hora      TIMESTAMP,
    IN  p_motivo          TEXT,
    IN  p_costo           NUMERIC,
    OUT p_cita_id         INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vet_activo      BOOLEAN;
    v_mascota_existe  BOOLEAN;
BEGIN
    IF p_mascota_id IS NULL THEN
        RAISE EXCEPTION 'sp_agendar_cita: p_mascota_id no puede ser NULL';
    END IF;

    IF p_veterinario_id IS NULL THEN
        RAISE EXCEPTION 'sp_agendar_cita: p_veterinario_id no puede ser NULL';
    END IF;

    IF p_fecha_hora IS NULL THEN
        RAISE EXCEPTION 'sp_agendar_cita: p_fecha_hora no puede ser NULL';
    END IF;

    SELECT activo
      INTO v_vet_activo
      FROM veterinarios
     WHERE id = p_veterinario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'sp_agendar_cita: veterinario_id=% no existe', p_veterinario_id;
    END IF;

    IF NOT v_vet_activo THEN
        RAISE EXCEPTION 'sp_agendar_cita: veterinario_id=% esta inactivo', p_veterinario_id;
    END IF;

    SELECT TRUE
      INTO v_mascota_existe
      FROM mascotas
     WHERE id = p_mascota_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'sp_agendar_cita: mascota_id=% no existe', p_mascota_id;
    END IF;

    INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, motivo, costo, estado)
    VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, p_costo, 'AGENDADA')
    RETURNING id INTO p_cita_id;
END;
$$;


DROP FUNCTION IF EXISTS fn_total_facturado(INT, INT);

CREATE FUNCTION fn_total_facturado(
    p_mascota_id  INT,
    p_anio        INT
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(costo), 0)
      INTO v_total
      FROM citas
     WHERE mascota_id = p_mascota_id
       AND estado     = 'COMPLETADA'
       AND EXTRACT(YEAR FROM fecha_hora) = p_anio;

    RETURN v_total;
END;
$$;
