DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_veterinario') THEN
        CREATE ROLE rol_veterinario NOLOGIN;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_recepcion') THEN
        CREATE ROLE rol_recepcion NOLOGIN;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_administrador') THEN
        CREATE ROLE rol_administrador NOLOGIN;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'clinica_app') THEN
        CREATE USER clinica_app WITH LOGIN PASSWORD 'clinica_pass';
    END IF;
END $$;

GRANT CONNECT ON DATABASE clinica_vet TO clinica_app;

GRANT USAGE ON SCHEMA public TO rol_veterinario;
GRANT SELECT, INSERT, UPDATE ON mascotas            TO rol_veterinario;
GRANT SELECT, INSERT, UPDATE ON citas               TO rol_veterinario;
GRANT SELECT, INSERT         ON vacunas_aplicadas   TO rol_veterinario;
GRANT SELECT ON inventario_vacunas    TO rol_veterinario;
GRANT SELECT ON duenos                TO rol_veterinario;
GRANT SELECT ON veterinarios          TO rol_veterinario;
GRANT SELECT ON vet_atiende_mascota   TO rol_veterinario;
GRANT INSERT ON historial_movimientos TO rol_veterinario;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_veterinario;

GRANT USAGE ON SCHEMA public TO rol_recepcion;
GRANT SELECT ON mascotas             TO rol_recepcion;
GRANT SELECT ON duenos               TO rol_recepcion;
GRANT SELECT ON veterinarios         TO rol_recepcion;
GRANT SELECT ON vet_atiende_mascota  TO rol_recepcion;
GRANT SELECT, INSERT, UPDATE ON citas TO rol_recepcion;
GRANT INSERT ON historial_movimientos TO rol_recepcion;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_recepcion;

GRANT USAGE ON SCHEMA public TO rol_administrador;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO rol_administrador;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_administrador;

GRANT rol_veterinario   TO clinica_app;
GRANT rol_recepcion     TO clinica_app;
GRANT rol_administrador TO clinica_app;
