CREATE OR REPLACE FUNCTION fn_trg_historial_cita()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion)
    VALUES (
        'NUEVA_CITA',
        NEW.id,
        FORMAT(
            'Cita agendada: mascota_id=%s, vet_id=%s, fecha=%s',
            NEW.mascota_id,
            NEW.veterinario_id,
            NEW.fecha_hora
        )
    );
    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_historial_cita ON citas;

CREATE TRIGGER trg_historial_cita
    AFTER INSERT ON citas
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_historial_cita();
