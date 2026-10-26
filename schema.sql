-- =====================================================================
-- TexMachina - B2B Textile Machinery Sales Platform (Multi-Tenant)
-- MySQL Database Schema
-- Target: MySQL 5.7+ / 8.0+ / MariaDB 10.3+ (Hostinger Compatible)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS `leads`;
DROP TABLE IF EXISTS `machines`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `tenants`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- TABLE: tenants (Representa cada empresa/aplicativo independente)
-- =====================================================================
CREATE TABLE `tenants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(100) NULL UNIQUE,
  `logo_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `image_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- TABLE: users
-- =====================================================================
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- TABLE: machines
-- =====================================================================
CREATE TABLE `machines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(500) NULL,
  `status` ENUM('disponivel', 'vendido', 'manutencao') NOT NULL DEFAULT 'disponivel',
  `origin` VARCHAR(150) NULL DEFAULT 'Brasil',
  `warranty` VARCHAR(150) NULL DEFAULT '6 Meses',
  `payment_type` ENUM('a_vista', 'financiado') NOT NULL DEFAULT 'a_vista',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_machines_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- TABLE: leads
-- =====================================================================
CREATE TABLE `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `client_name` VARCHAR(200) NOT NULL,
  `client_phone` VARCHAR(50) NOT NULL,
  `machine_id` INT NULL,
  `status` ENUM('novo', 'orcamento', 'negociacao', 'fechado') NOT NULL DEFAULT 'novo',
  `notes` TEXT NULL,
  `follow_up_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_leads_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leads_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES
CREATE INDEX `idx_users_tenant` ON `users` (`tenant_id`);
CREATE INDEX `idx_machines_tenant` ON `machines` (`tenant_id`);
CREATE INDEX `idx_leads_tenant` ON `leads` (`tenant_id`);
CREATE INDEX `idx_machines_status` ON `machines` (`status`);
CREATE INDEX `idx_leads_status` ON `leads` (`status`);

-- =====================================================================
-- INITIAL SEED (Tenant 1: TexMachina Matriz)
-- =====================================================================
INSERT INTO `tenants` (`id`, `name`, `slug`) VALUES (1, 'TexMachina Matriz', 'matriz');

INSERT INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`) VALUES
(1, 1, 'Carlos Eduardo Menezes', 'admin@texmachina.com.br', '$2a$10$wT3yY13vBwR2hIu1g8hFTe9jF/j4j8qH.Kj5f0m5a7l3a6p5O2gXm', 'admin'),
(2, 1, 'Renata Silveira', 'vendedor@texmachina.com.br', '$2a$10$hQ7w8sD8b1G2Yj3kL4m5NO6pQ7rS8tU9vW0xY1zA2bC3dE4fG5h6i', 'vendedor');

INSERT INTO `machines` (`id`, `tenant_id`, `name`, `model`, `description`, `price`, `image_url`, `status`) VALUES
(1, 1, 'Mayer & Cie Relanit 3.2 II', 'Single Jersey E28', 'Tear circular de alta rotação para malharia refinada.', 420000.00, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80', 'disponivel'),
(2, 1, 'Toyota JAT810 Air Jet Loom', 'JAT810-190 Dobby', 'Tear plano a jato de ar de altíssima produtividade.', 340000.00, 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=900&q=80', 'disponivel');

INSERT INTO `leads` (`id`, `tenant_id`, `client_name`, `client_phone`, `machine_id`, `status`) VALUES
(1, 1, 'Malharia Santa Catarina Ltda', '+55 (47) 99881-2244', 1, 'novo'),
(2, 1, 'Têxtil Vale do Itajaí S/A', '+55 (47) 99123-4567', 2, 'orcamento');
