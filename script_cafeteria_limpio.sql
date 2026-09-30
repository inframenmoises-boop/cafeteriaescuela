CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `grupo` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=9;

INSERT INTO `estudiantes` (`id`, `nombre`, `grupo`) VALUES
(1, 'Ana López', '1A'),
(2, 'Carlos Ruiz', '1B'),
(3, 'María Torres', '2A'),
(4, 'Luis Pérez', '2B'),
(5, 'Sofía García', '3A'),
(6, 'Diego Álvarez', '3B'),
(7, 'Valeria Maya', '4A'),
(8, 'Bruno Díaz', '4B');

CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=9;

INSERT INTO `productos` (`id`, `nombre`, `precio`) VALUES
(1, 'Taco de frijoles', 18.00),
(2, 'Refresco', 22.50),
(3, 'Pan dulce', 12.00),
(4, 'Café', 25.00),
(5, 'Sandwich', 35.00),
(6, 'Agua', 15.00),
(7, 'Galletas', 14.50),
(8, 'Yogur', 20.00);

CREATE TABLE `ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `fecha` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ventas_estudiante` (`estudiante_id`),
  KEY `fk_ventas_producto` (`producto_id`),
  CONSTRAINT `fk_ventas_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`),
  CONSTRAINT `fk_ventas_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=14;

INSERT INTO `ventas` (`id`, `estudiante_id`, `producto_id`, `cantidad`, `fecha`) VALUES
(2, 2, 1, 1, '2026-09-02'),
(3, 3, 4, 1, '2026-09-03'),
(4, 4, 3, 3, '2026-09-04'),
(5, 5, 5, 2, '2026-09-05'),
(6, 6, 6, 1, '2026-09-06'),
(7, 7, 7, 4, '2026-09-07'),
(8, 8, 8, 2, '2026-09-08'),
(9, 1, 5, 1, '2026-09-09'),
(13, 1, 3, 67, '2026-09-23');