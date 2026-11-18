-- Base de datos única del CRUD: crud_empleados.
-- Importa este archivo en phpMyAdmin tanto en la instalacion

CREATE DATABASE IF NOT EXISTS crud_empleados
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crud_empleados;

CREATE TABLE IF NOT EXISTS empleados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_documento ENUM('DNI', 'CE') NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    edad TINYINT UNSIGNED NOT NULL,
    sexo ENUM('Masculino', 'Femenino') NOT NULL,
    telefono VARCHAR(25) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_edad CHECK (edad BETWEEN 18 AND 100)
) ENGINE=InnoDB;

-- Migración segura: detecta las columnas antiguas antes de alterarlas.
SET @crud_tiene_cedula = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleados' AND COLUMN_NAME = 'cedula'
);
SET @crud_sql = IF(
    @crud_tiene_cedula > 0,
    'ALTER TABLE empleados CHANGE COLUMN cedula numero_documento VARCHAR(20) NOT NULL',
    'SELECT 1'
);
PREPARE crud_stmt FROM @crud_sql;
EXECUTE crud_stmt;
DEALLOCATE PREPARE crud_stmt;

SET @crud_falta_tipo = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleados' AND COLUMN_NAME = 'tipo_documento'
);
SET @crud_sql = IF(
    @crud_falta_tipo,
    'ALTER TABLE empleados ADD COLUMN tipo_documento ENUM(''DNI'', ''CE'') NOT NULL DEFAULT ''DNI'' AFTER nombre',
    'SELECT 1'
);
PREPARE crud_stmt FROM @crud_sql;
EXECUTE crud_stmt;
DEALLOCATE PREPARE crud_stmt;

-- Al migrar datos antiguos: 8 dígitos = DNI; otros formatos = CE.
SET @crud_sql = IF(
    @crud_falta_tipo,
    'UPDATE empleados SET tipo_documento = IF(numero_documento REGEXP ''^[0-9]{8}$'', ''DNI'', ''CE'')',
    'SELECT 1'
);
PREPARE crud_stmt FROM @crud_sql;
EXECUTE crud_stmt;
DEALLOCATE PREPARE crud_stmt;
