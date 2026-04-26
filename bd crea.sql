

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;



DROP TABLE IF EXISTS `reportes`;
CREATE TABLE IF NOT EXISTS `reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Usuario` varchar(50) NOT NULL,
  `Zona` varchar(500) NOT NULL,
  `Cometario` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Usuario` varchar(100) NOT NULL,
  `Correo` varchar(100) NOT NULL,
  `Contra` varchar(255) NOT NULL,
  `rol` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `Usuario`, `Correo`, `Contra`, `rol`) VALUES
(9, 'FernandoA', 'admin2026@gmail.com', 'Admin2026!', 'admin'),
(10, 'prueba04', 'prueba4567@gmail.com', 'Prueba45!', 'user'),
(2, 'Admin', 'Fernando@gmail.com', '$2y$10$5mzbR0CLxZVN8VXl3wIkneJE4DNrMhC9qVLQlZJFvBPxLNxR4JuXe', 'admin'),
(3, 'Usuario Demo', 'user@cdb.edu.sv', '$2y$10$XEHSEr.tSqBQWq1kMGiCOOPnDJ7x6L/UnAHwlqXfNGEgVLKL6aGGu', 'user'),
(4, 'Demo', 'demo@hotmail.com', '$2y$10$N6/Fo0Cd6dMN/BmDXJ9eNuHwz5bMQ3RjN5Lx2qPxF/xFGRtm2r7X.', 'user'),
(7, 'prueba02', 'prueba23456@gmail.com', 'Prueba2134!', 'user'),
(8, 'prueba03', 'prueba3@gmail.com', 'Prueba34567!', 'user');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
