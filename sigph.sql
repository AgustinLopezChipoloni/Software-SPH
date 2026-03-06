-- ============================================
-- SIGPH - Script compatible con MariaDB
-- MISMA ESTRUCTURA QUE TENÍAS EN WORKBENCH
-- ============================================
	-- ============================================
-- SIGPH - Script organizado (MariaDB compatible)
-- ============================================

-- Base de datos
CREATE DATABASE IF NOT EXISTS sigph;
USE sigph;

-- ============================
-- TABLA: Roles de usuario
-- ============================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Usuarios
-- ============================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles
    FOREIGN KEY (id_rol) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Cargos
-- ============================
CREATE TABLE IF NOT EXISTS cargos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Turnos (para calcular "tarde")
-- ============================
CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  hora_inicio TIME NOT NULL,          -- ej: '07:00:00'
  tolerancia_min INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Empleados
-- ============================
CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  fecha_ingreso DATE NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  -- Relaciones y QR
  id_cargo INT NULL,
  id_turno INT NULL,
  qr_uid CHAR(36) NULL UNIQUE,         -- UUID v4 del empleado
  qr_secret VARCHAR(64) NULL,          -- reservado por si firmamos QR luego
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_empleados_cargos
    FOREIGN KEY (id_cargo) REFERENCES cargos(id),

  CONSTRAINT fk_empleado_turno
    FOREIGN KEY (id_turno) REFERENCES turnos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Camiones
-- ============================
CREATE TABLE IF NOT EXISTS camiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patente VARCHAR(20) NOT NULL UNIQUE,   -- Patente única
  marca VARCHAR(50),
  modelo VARCHAR(50),
  anio INT,
  capacidad_m3 DECIMAL(5,2),             -- Ej: 7.50 m³
  activo TINYINT(1) DEFAULT 1,           -- 1=activo, 0=baja
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Asistencias (una fila por empleado y día)
-- ============================
CREATE TABLE IF NOT EXISTS asistencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  fecha DATE NOT NULL,                   -- día calendario del check
  check_in DATETIME NULL,
  check_out DATETIME NULL,
  estado ENUM('presente','tarde','ausente') DEFAULT NULL,
  metodo ENUM('manual','qr','pin') DEFAULT 'manual',  -- hoy "manual", mañana "qr"
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_asist_empleado_fecha (empleado_id, fecha),
  KEY idx_asist_fecha (fecha),

  CONSTRAINT fk_asist_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Asignaciones diarias (camión por día)
-- ============================
CREATE TABLE IF NOT EXISTS asignaciones_diarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  camion_id INT NOT NULL,
  chofer_id INT NOT NULL,               -- empleado con cargo CHOFER
  hora_inicio TIME NULL,
  hora_fin TIME NULL,
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_fecha_camion (fecha, camion_id),  -- un camión, una asignación por día
  KEY idx_fecha (fecha),

  CONSTRAINT fk_asig_camion  FOREIGN KEY (camion_id) REFERENCES camiones(id),
  CONSTRAINT fk_asig_chofer  FOREIGN KEY (chofer_id) REFERENCES empleados(id)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 0
);

INSERT INTO materiales (nombre, unidad_medida, cantidad) VALUES
('Arena','Kg',0),
('Piedra','Kg',0),
('Cemento','Kg',0),
('Agua','L',0);


CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    telefono VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    empresa VARCHAR(100),
    CONSTRAINT chk_telefono_numerico CHECK (telefono REGEXP '^\\+?[0-9-]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nombre_cliente VARCHAR(100) NOT NULL,
  apellido_cliente VARCHAR(100) NOT NULL,
  empresa VARCHAR(150),
  m3 DECIMAL(10,2) NOT NULL,
  fecha_entrega DATE NOT NULL,
  fecha_agendado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

ALTER TABLE `pedidos`
  ADD COLUMN `observacion` TEXT NULL AFTER `fecha_entrega`;

ALTER TABLE `pedidos`
  ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `observacion`;

DESCRIBE `pedidos`;
-- Deberías ver ... fecha_entrega | observacion | activo | fecha_agendado

USE sigph;
-- ============================
-- SEMILLAS (NO BORRAR)
-- ============================

-- Roles
INSERT IGNORE INTO roles (nombre) VALUES ('Administrador');
INSERT IGNORE INTO roles (nombre) VALUES ('Gerente'), ('Empleado');
-- (si querés que "Chofer" NO inicie sesión, no lo insertes en roles)

-- Cargos mínimos (chofer y otros)
INSERT IGNORE INTO cargos (nombre)
VALUES ('CHOFER'), ('OPERARIO'), ('ADMIN'), ('JEFE_PLANTA');

-- Usuario administrador inicial
-- (usa id_rol=1 asumiendo que 'Administrador' es el primero tal como venías)
INSERT IGNORE INTO usuarios (username, password_hash, id_rol)
VALUES ('admin', 'admin123', 1);

INSERT IGNORE INTO usuarios (username, password_hash, id_rol)
VALUES ('Matias', '123', 1);

USE sigph;

-- Turno estándar de planta: 07:00 con 10' de tolerancia
INSERT IGNORE INTO turnos (id, nombre, hora_inicio, tolerancia_min)
VALUES (1, 'Mañana', '07:00:00', 10);

-- Si ya tenés empleados, generá qr_uid a los que no tengan (idempotente)
UPDATE empleados
SET qr_uid = UUID()
WHERE qr_uid IS NULL;


INSERT INTO clientes (nombre, apellido, telefono, email, empresa)
VALUES ('Juan','Pérez','3810000000','juan@acme.com','ACME')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

INSERT INTO pedidos
(cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES ( (SELECT id FROM clientes ORDER BY id LIMIT 1),
        'Juan','Pérez','ACME', 7.50, CURDATE(), 'Urgente', 1 );



USE sigph;

INSERT IGNORE INTO empleados
  (nombre, apellido, dni, email, telefono, fecha_ingreso, id_cargo, id_turno, qr_uid)
VALUES
('Nicolás','Álvarez','20000001','nicolas.alvarez01@gmail.com','3815000001','2024-03-15',
  (SELECT id FROM cargos WHERE nombre='CHOFER' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Carla','Medina','20000002','carla.medina02@gmail.com','3815000002','2024-05-02',
  (SELECT id FROM cargos WHERE nombre='OPERARIO' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Bruno','Herrera','20000003','bruno.herrera03@gmail.com','3815000003','2024-07-22',
  (SELECT id FROM cargos WHERE nombre='CHOFER' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Daniela','Cruz','20000004','daniela.cruz04@gmail.com','3815000004','2023-11-10',
  (SELECT id FROM cargos WHERE nombre='ADMIN' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Gabriel','Torres','20000005','gabriel.torres05@gmail.com','3815000005','2024-09-01',
  (SELECT id FROM cargos WHERE nombre='OPERARIO' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Luciana','Gómez','20000006','luciana.gomez06@gmail.com','3815000006','2023-12-18',
  (SELECT id FROM cargos WHERE nombre='JEFE_PLANTA' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Mateo','Ríos','20000007','mateo.rios07@gmail.com','3815000007','2025-01-20',
  (SELECT id FROM cargos WHERE nombre='OPERARIO' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Paula','Navarro','20000008','paula.navarro08@gmail.com','3815000008','2024-10-05',
  (SELECT id FROM cargos WHERE nombre='CHOFER' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Sergio','López','20000009','sergio.lopez09@gmail.com','3815000009','2024-02-28',
  (SELECT id FROM cargos WHERE nombre='OPERARIO' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID()),
('Valentina','Paredes','20000010','valentina.paredes10@gmail.com','3815000010','2024-06-11',
  (SELECT id FROM cargos WHERE nombre='ADMIN' LIMIT 1),
  (SELECT id FROM turnos WHERE nombre='Mañana' LIMIT 1),
  UUID());

-- (Opcional) chequeo rápido
SELECT id, nombre, apellido, dni, telefono, email FROM empleados ORDER BY id DESC LIMIT 10;

-- (Opcional) ver distribución por cargo
SELECT c.nombre AS cargo, COUNT(*) AS cantidad
FROM empleados e
JOIN cargos c ON c.id = e.id_cargo
GROUP BY c.nombre
ORDER BY cantidad DESC;


USE sigph;

-- ============================================
-- OPCIONAL: limpiar el rango para no duplicar
-- (descomentá la línea de abajo si querés resetear)
-- DELETE FROM pedidos
--   WHERE fecha_entrega BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE();
-- ============================================

-- ============================================
-- CLIENTES (idempotentes por email/telefono)
-- ============================================
INSERT INTO clientes (nombre, apellido, telefono, email, empresa) VALUES
('Juan','Pérez','3810000001','juan.perez@acme.com','ACME'),
('María','López','3810000002','maria.lopez@construir.com','Construir S.R.L.'),
('Carlos','García','3810000003','carlos.garcia@andes.com','Andes Obras'),
('Ana','Molina','3810000004','ana.molina@hormigonera.com','Hormigonera Norte'),
('Lucía','Ruiz','3810000005','lucia.ruiz@metalnorte.com','MetalNorte SA'),
('Diego','Sosa','3810000006','diego.sosa@obrasur.com','ObraSur'),
('Sofía','Torres','3810000007','sofia.torres@constructora.com','Constructora del NOA'),
('Matías','Romero','3810000008','matias.romero@logis.com','Logística Tucumán'),
('Paula','Castro','3810000009','paula.castro@piedramix.com','PiedraMix'),
('Federico','Ibarra','3810000010','federico.ibarra@cimentar.com','Cimentar S.A.')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), apellido=VALUES(apellido), empresa=VALUES(empresa);

-- ============================================
-- PEDIDOS: hoy (0) a 7 días atrás
-- Cantidades por día: 5,3,6,2,4,1,5,3
-- ============================================

-- Día 0 (hoy) - 5 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='juan.perez@acme.com'),'Juan','Pérez','ACME', 7.50, CURDATE(), 'Hormigón H21 - Bomba 32m', 1),
((SELECT id FROM clientes WHERE email='maria.lopez@construir.com'),'María','López','Construir S.R.L.', 8.00, CURDATE(), 'H17 - Descarga directa', 1),
((SELECT id FROM clientes WHERE email='carlos.garcia@andes.com'),'Carlos','García','Andes Obras', 5.25, CURDATE(), 'H30 - Armado rápido', 1),
((SELECT id FROM clientes WHERE email='ana.molina@hormigonera.com'),'Ana','Molina','Hormigonera Norte', 9.00, CURDATE(), 'H25 - Aditivo plastificante', 1),
((SELECT id FROM clientes WHERE email='lucia.ruiz@metalnorte.com'),'Lucía','Ruiz','MetalNorte SA', 6.75, CURDATE(), 'Pavimento fino', 1);

-- Día -1 (ayer) - 3 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='diego.sosa@obrasur.com'),'Diego','Sosa','ObraSur', 4.00, CURDATE() - INTERVAL 1 DAY, 'H21 - Calle interna', 1),
((SELECT id FROM clientes WHERE email='sofia.torres@constructora.com'),'Sofía','Torres','Constructora del NOA', 10.00, CURDATE() - INTERVAL 1 DAY, 'H30 - Losa', 1),
((SELECT id FROM clientes WHERE email='matias.romero@logis.com'),'Matías','Romero','Logística Tucumán', 6.00, CURDATE() - INTERVAL 1 DAY, 'H25 - Pilar', 1);

-- Día -2 - 6 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='paula.castro@piedramix.com'),'Paula','Castro','PiedraMix', 3.50, CURDATE() - INTERVAL 2 DAY, 'Mezcla base', 1),
((SELECT id FROM clientes WHERE email='federico.ibarra@cimentar.com'),'Federico','Ibarra','Cimentar S.A.', 12.00, CURDATE() - INTERVAL 2 DAY, 'H30 - Bomba 36m', 1),
((SELECT id FROM clientes WHERE email='juan.perez@acme.com'),'Juan','Pérez','ACME', 7.25, CURDATE() - INTERVAL 2 DAY, 'H21 - Cordón', 1),
((SELECT id FROM clientes WHERE email='maria.lopez@construir.com'),'María','López','Construir S.R.L.', 5.00, CURDATE() - INTERVAL 2 DAY, 'H17 - Vereda', 1),
((SELECT id FROM clientes WHERE email='carlos.garcia@andes.com'),'Carlos','García','Andes Obras', 8.50, CURDATE() - INTERVAL 2 DAY, 'H25 - Cimiento', 1),
((SELECT id FROM clientes WHERE email='ana.molina@hormigonera.com'),'Ana','Molina','Hormigonera Norte', 6.10, CURDATE() - INTERVAL 2 DAY, 'H21 - Columna', 1);

-- Día -3 - 2 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='lucia.ruiz@metalnorte.com'),'Lucía','Ruiz','MetalNorte SA', 9.75, CURDATE() - INTERVAL 3 DAY, 'H30 - Platea', 1),
((SELECT id FROM clientes WHERE email='diego.sosa@obrasur.com'),'Diego','Sosa','ObraSur', 4.80, CURDATE() - INTERVAL 3 DAY, 'H21 - Reparación', 1);

-- Día -4 - 4 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='sofia.torres@constructora.com'),'Sofía','Torres','Constructora del NOA', 11.00, CURDATE() - INTERVAL 4 DAY, 'H30 - Losa alta', 1),
((SELECT id FROM clientes WHERE email='matias.romero@logis.com'),'Matías','Romero','Logística Tucumán', 5.60, CURDATE() - INTERVAL 4 DAY, 'H25 - Viga', 1),
((SELECT id FROM clientes WHERE email='paula.castro@piedramix.com'),'Paula','Castro','PiedraMix', 3.90, CURDATE() - INTERVAL 4 DAY, 'Mortero', 1),
((SELECT id FROM clientes WHERE email='federico.ibarra@cimentar.com'),'Federico','Ibarra','Cimentar S.A.', 7.80, CURDATE() - INTERVAL 4 DAY, 'H21 - Cordón cuneta', 1);

-- Día -5 - 1 pedido
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='juan.perez@acme.com'),'Juan','Pérez','ACME', 6.30, CURDATE() - INTERVAL 5 DAY, 'H25 - Zapata', 1);

-- Día -6 - 5 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='maria.lopez@construir.com'),'María','López','Construir S.R.L.', 7.10, CURDATE() - INTERVAL 6 DAY, 'H21 - Piso galpón', 1),
((SELECT id FROM clientes WHERE email='carlos.garcia@andes.com'),'Carlos','García','Andes Obras', 8.90, CURDATE() - INTERVAL 6 DAY, 'H30 - Colada continua', 1),
((SELECT id FROM clientes WHERE email='ana.molina@hormigonera.com'),'Ana','Molina','Hormigonera Norte', 5.40, CURDATE() - INTERVAL 6 DAY, 'H17 - Reparación', 1),
((SELECT id FROM clientes WHERE email='lucia.ruiz@metalnorte.com'),'Lucía','Ruiz','MetalNorte SA', 9.20, CURDATE() - INTERVAL 6 DAY, 'H25 - Platea chica', 1),
((SELECT id FROM clientes WHERE email='diego.sosa@obrasur.com'),'Diego','Sosa','ObraSur', 4.30, CURDATE() - INTERVAL 6 DAY, 'H21 - Vereda', 1);

-- Día -7 - 3 pedidos
INSERT INTO pedidos (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
VALUES
((SELECT id FROM clientes WHERE email='sofia.torres@constructora.com'),'Sofía','Torres','Constructora del NOA', 10.50, CURDATE() - INTERVAL 7 DAY, 'H30 - Doble turno', 1),
((SELECT id FROM clientes WHERE email='matias.romero@logis.com'),'Matías','Romero','Logística Tucumán', 6.95, CURDATE() - INTERVAL 7 DAY, 'H25 - Viga', 1),
((SELECT id FROM clientes WHERE email='paula.castro@piedramix.com'),'Paula','Castro','PiedraMix', 3.40, CURDATE() - INTERVAL 7 DAY, 'Mezcla base', 1);

-- Listado rápido para chequear
SELECT fecha_entrega, COUNT(*) AS pedidos, SUM(m3) AS total_m3
FROM pedidos
WHERE fecha_entrega BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE()
GROUP BY fecha_entrega
ORDER BY fecha_entrega DESC;



/*
-- Base de datos
CREATE DATABASE IF NOT EXISTS sigph;
USE sigph;

-- ============================
-- TABLA: Roles de usuario
-- ============================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Usuarios
-- ============================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles
    FOREIGN KEY (id_rol) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Empleados
-- ============================
CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  fecha_ingreso DATE NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Cargos (nuevo)
-- ============================
CREATE TABLE IF NOT EXISTS cargos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- TABLA: Camiones (nuevo)
-- ============================
CREATE TABLE IF NOT EXISTS camiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patente VARCHAR(20) NOT NULL UNIQUE,   -- Patente única
  marca VARCHAR(50),
  modelo VARCHAR(50),
  anio INT,
  capacidad_m3 DECIMAL(5,2),             -- Ej: 7.50 m³
  activo TINYINT(1) DEFAULT 1,           -- 1=activo, 0=baja
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- RELACIÓN empleados -> cargos
-- (se agrega igual que lo tenías, vía ALTER)
-- ============================
ALTER TABLE empleados
  ADD COLUMN id_cargo INT NULL;

ALTER TABLE empleados
  ADD CONSTRAINT fk_empleados_cargos
  FOREIGN KEY (id_cargo) REFERENCES cargos(id);

-- ============================
-- SEMILLAS
-- ============================

-- Rol Administrador (con IGNORE para evitar duplicados si re-ejecutás)
INSERT IGNORE INTO roles (nombre) VALUES ('Administrador');
INSERT IGNORE INTO roles (nombre) VALUES ('Gerente'), ('Empleado');
-- (si querés que "Chofer" NO inicie sesión, no lo insertes en roles;
--  si un día querés que sí, lo agregás acá y en usuarios)


-- Cargos mínimos (chofer y otros)
INSERT IGNORE INTO cargos (nombre)
VALUES ('CHOFER'), ('OPERARIO'), ('ADMIN'), ('JEFE_PLANTA');

-- Usuario administrador inicial
-- (usa id_rol=1 asumiendo que 'Administrador' es el primero tal como venías)
INSERT IGNORE INTO usuarios (username, password_hash, id_rol)
VALUES ('admin', 'admin123', 1);
sigphempleados

SELECT * FROM camiones; 

--PARTE NUEVA 

-- ============================
-- TURNOS (opcional pero útil para calcular "tarde")
-- ============================
CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  hora_inicio TIME NOT NULL,          -- ej: '07:00:00'
  tolerancia_min INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Asignar turno al empleado (opcional)
ALTER TABLE empleados
  ADD COLUMN IF NOT EXISTS id_turno INT NULL,
  ADD CONSTRAINT fk_empleado_turno
    FOREIGN KEY (id_turno) REFERENCES turnos(id);

-- ============================
-- ASISTENCIAS (una fila por empleado y día)
-- ============================
CREATE TABLE IF NOT EXISTS asistencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  fecha DATE NOT NULL,                   -- día calendario del check
  check_in DATETIME NULL,
  check_out DATETIME NULL,
  estado ENUM('presente','tarde','ausente') DEFAULT NULL,
  metodo ENUM('manual','qr','pin') DEFAULT 'manual',  -- hoy "manual", mañana "qr"
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asist_empleado_fecha (empleado_id, fecha),
  KEY idx_asist_fecha (fecha),
  CONSTRAINT fk_asist_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- PREPARADO PARA QR (futuro)
-- ============================
ALTER TABLE empleados
  ADD COLUMN IF NOT EXISTS qr_uid CHAR(36) NULL UNIQUE,   -- UUID v4 del empleado
  ADD COLUMN IF NOT EXISTS qr_secret VARCHAR(64) NULL;    -- clave para firmar QR (opcional)


CREATE TABLE IF NOT EXISTS asignaciones_diarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  camion_id INT NOT NULL,
  chofer_id INT NOT NULL,                  -- empleado con cargo CHOFER
  hora_inicio TIME NULL,
  hora_fin TIME NULL,
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fecha_camion (fecha, camion_id),  -- un camión, una asignación por día
  KEY idx_fecha (fecha),
  CONSTRAINT fk_asig_camion  FOREIGN KEY (camion_id) REFERENCES camiones(id),
  CONSTRAINT fk_asig_chofer  FOREIGN KEY (chofer_id) REFERENCES empleados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Turno estándar de planta: 07:00 con 10' de tolerancia
INSERT IGNORE INTO turnos (id, nombre, hora_inicio, tolerancia_min)
VALUES (1, 'Mañana', '07:00:00', 10);

-- nuevo 
-- 1) Agregar columna si no existe
ALTER TABLE empleados
  ADD COLUMN IF NOT EXISTS qr_uid CHAR(36) NULL UNIQUE;

-- 2) Generar un QR UID para los que no tengan
UPDATE empleados
SET qr_uid = UUID()
WHERE qr_uid IS NULL;
*/