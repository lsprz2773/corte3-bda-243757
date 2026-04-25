ALTER TABLE mascotas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas_aplicadas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas              ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS mascotas_vet_isolation ON mascotas;

CREATE POLICY mascotas_vet_isolation
    ON mascotas
    FOR ALL
    TO PUBLIC
    USING (
        COALESCE(current_setting('app.current_role', TRUE), 'admin') != 'veterinario'
        OR id IN (
            SELECT mascota_id
              FROM vet_atiende_mascota
             WHERE vet_id = NULLIF(
                       current_setting('app.current_vet_id', TRUE), ''
                   )::INT
        )
    );


DROP POLICY IF EXISTS vacunas_vet_isolation ON vacunas_aplicadas;

CREATE POLICY vacunas_vet_isolation
    ON vacunas_aplicadas
    FOR ALL
    TO PUBLIC
    USING (
        COALESCE(current_setting('app.current_role', TRUE), 'admin') = 'admin'
        OR (
            COALESCE(current_setting('app.current_role', TRUE), 'admin') = 'veterinario'
            AND mascota_id IN (
                SELECT mascota_id
                  FROM vet_atiende_mascota
                 WHERE vet_id = NULLIF(
                           current_setting('app.current_vet_id', TRUE), ''
                       )::INT
            )
        )
    );


DROP POLICY IF EXISTS citas_vet_isolation ON citas;

CREATE POLICY citas_vet_isolation
    ON citas
    FOR ALL
    TO PUBLIC
    USING (
        COALESCE(current_setting('app.current_role', TRUE), 'admin') != 'veterinario'
        OR veterinario_id = NULLIF(
               current_setting('app.current_vet_id', TRUE), ''
           )::INT
    );
