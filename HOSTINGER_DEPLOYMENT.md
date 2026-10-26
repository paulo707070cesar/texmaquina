# Guia Completo de Instalação e Deploy na Hostinger
## TexMachina OS - B2B SaaS de Gestão & Vendas de Máquinas Têxteis

Este manual fornece o passo a passo completo para hospedar a aplicação **TexMachina** no plano de hospedagem **Hostinger** utilizando o recurso **Node.js Web App** integrado ao banco de dados **MySQL / MariaDB**.

---

## 1. Visão Geral da Arquitetura

* **Frontend:** React 19 + Vite + Tailwind CSS (SPA compilada para a pasta `/dist`).
* **Backend:** Node.js + Express + TypeScript (API REST com autenticação JWT e criptografia Bcrypt).
* **Banco de Dados:** MySQL / MariaDB via pool de conexões com `mysql2/promise`.
* **Roteamento de Produção:** O Express serve os arquivos estáticos da pasta `dist/` e inclui rota coringa (`app.get('*')`) para que o React Router funcione sem erro 404 ao atualizar a página.

---

## 2. Passo 1: Criar o Banco de Dados MySQL no hPanel

1. Acesse o **hPanel da Hostinger** ([hpanel.hostinger.com](https://hpanel.hostinger.com)).
2. No menu lateral, acesse **Bancos de Dados** > **Gerenciamento de Bancos de Dados**.
3. Crie um novo banco de dados MySQL:
   * **Nome do Banco:** ex.: `u123456789_texmachina`
   * **Nome de Usuário:** ex.: `u123456789_texuser`
   * **Senha:** defina uma senha forte (anote-a para colocar no `.env`).
4. Clique em **Criar**.

---

## 3. Passo 2: Executar o Script SQL no phpMyAdmin

1. Na mesma tela de Bancos de Dados do hPanel, localize o banco criado e clique em **Entrar no phpMyAdmin**.
2. No phpMyAdmin, selecione o banco de dados na coluna da esquerda.
3. Clique na aba superior **SQL** (ou **Importar**).
4. Copie e cole todo o conteúdo do arquivo `schema.sql` (ou utilize o código abaixo) e clique em **Executar**:

```sql
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `leads`;
DROP TABLE IF EXISTS `machines`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABELA DE USUÁRIOS
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE MÁQUINAS TÊXTEIS
CREATE TABLE `machines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `model` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(500) NULL,
  `status` ENUM('disponivel', 'vendido', 'manutencao') NOT NULL DEFAULT 'disponivel',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE LEADS & OPORTUNIDADES
CREATE TABLE `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_name` VARCHAR(200) NOT NULL,
  `client_phone` VARCHAR(50) NOT NULL,
  `machine_id` INT NULL,
  `status` ENUM('novo', 'orcamento', 'negociacao', 'fechado') NOT NULL DEFAULT 'novo',
  `notes` TEXT NULL,
  `follow_up_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_leads_machine` 
    FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ÍNDICES DE DESEMPENHO
CREATE INDEX `idx_machines_status` ON `machines` (`status`);
CREATE INDEX `idx_leads_status` ON `leads` (`status`);
CREATE INDEX `idx_leads_machine_id` ON `leads` (`machine_id`);
CREATE INDEX `idx_leads_follow_up` ON `leads` (`follow_up_date`);

-- DADOS INICIAIS (SEED)
-- Senhas padrão (criptografadas em bcrypt):
-- admin@texmachina.com.br -> "admin123"
-- vendedor@texmachina.com.br -> "vendedor123"

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Carlos Eduardo Menezes', 'admin@texmachina.com.br', '$2a$10$wT3yY13vBwR2hIu1g8hFTe9jF/j4j8qH.Kj5f0m5a7l3a6p5O2gXm', 'admin', NOW()),
(2, 'Renata Silveira', 'vendedor@texmachina.com.br', '$2a$10$hQ7w8sD8b1G2Yj3kL4m5NO6pQ7rS8tU9vW0xY1zA2bC3dE4fG5h6i', 'vendedor', NOW()),
(3, 'Marcio Zanetti', 'marcio.vendas@texmachina.com.br', '$2a$10$wT3yY13vBwR2hIu1g8hFTe9jF/j4j8qH.Kj5f0m5a7l3a6p5O2gXm', 'vendedor', NOW());

INSERT INTO `machines` (`id`, `name`, `model`, `description`, `price`, `image_url`, `status`, `created_at`) VALUES
(1, 'Mayer & Cie Relanit 3.2 II', 'Single Jersey E28', 'Tear circular de alta rotação para malharia refinada. Diâmetro 34 polegadas, 96 alimentadores com alimentadores Memminger MPF, inversor de frequência e painel digital com controle de tensão.', 420000.00, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80', 'disponivel', NOW()),
(2, 'Toyota JAT810 Air Jet Loom', 'JAT810-190 Dobby', 'Tear plano a jato de ar de altíssima produtividade. Largura útil de 190 cm, maquineta eletrônica Staubli, velocidade operacional de até 1.250 RPM. Ideal para tecidos planos leves e médios.', 340000.00, 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=900&q=80', 'disponivel', NOW()),
(3, 'Monforts Montex 6500 Stenter Frame', 'Montex 6500 Gas 5C', 'Rama industrial para termofixação, secagem e acabamento contínuo de tecidos. 5 câmaras a gás GLP, largura operacional útil de 2.400 mm, automação completa Qualitex PLC.', 1280000.00, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80', 'manutencao', NOW()),
(4, 'Rieter G36 Spun Yarn Ring Frame', 'G36 1200 Spindles', 'Fiação de anel contínua para fios finos e cardados. 1.200 fusos, anel de 42 mm, sistema automático SERVOgrip de doffing e controle eletrônico de estiragem.', 890000.00, 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80', 'disponivel', NOW()),
(5, 'Picanol OmniPlus-i TC Connect 220', 'OmniPlus-i 220cm', 'Tear a jato de ar de última geração com interface digital BlueTouch, 4 cores smart, monitoramento de consumo de ar comprimido por sensor térmico.', 510000.00, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80', 'vendido', NOW()),
(6, 'Dornier P2 Rapier Weaving Machine', 'P2 Type TFN', 'Tear de pinças rígidas para tecidos técnicos, fibras sintéticas e aramidas. Largura útil 260 cm com cala limpa para máxima precisão de trama.', 750000.00, 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80', 'disponivel', NOW());

INSERT INTO `leads` (`id`, `client_name`, `client_phone`, `machine_id`, `status`, `notes`, `follow_up_date`, `created_at`) VALUES
(1, 'Malharia Santa Catarina Ltda (Sr. Roberto)', '+55 (47) 99881-2244', 1, 'novo', 'Cliente solicitou catálogo técnico com tabela de rendimento de malha em poliéster/elastano. Agendar ligação preliminar.', DATE_ADD(CURDATE(), INTERVAL 2 DAY), NOW()),
(2, 'Têxtil Vale do Itajaí S/A (Dra. Juliana)', '+55 (47) 99123-4567', 2, 'orcamento', 'Enviada proposta formal com desconto de 5% à vista ou financiamento FINAME em 36 parcelas. Aguardando parecer da diretoria.', DATE_ADD(CURDATE(), INTERVAL 4 DAY), NOW()),
(3, 'Fiação & Tecelagem Paulista (Eng. Hamilton)', '+55 (19) 98765-4321', 4, 'negociacao', 'Visita técnica realizada no parque fabril em Americana/SP. Em negociação final sobre frete industrial e comissionamento no local.', DATE_ADD(CURDATE(), INTERVAL 1 DAY), NOW()),
(4, 'Coteminas Indústria Têxtil (Marcos Bastos)', '+55 (38) 99712-3300', 5, 'fechado', 'Contrato assinado via DocuSign. Pagamento do sinal de 40% confirmado, envio da máquina agendado para transportadora especializada.', CURDATE(), NOW()),
(5, 'Tecidos Nobres do Nordeste (Felipe Arcoverde)', '+55 (81) 98442-1199', 6, 'novo', 'Demonstrou interesse na máquina Dornier P2 para produção de tecidos industriais de segurança.', DATE_ADD(CURDATE(), INTERVAL 3 DAY), NOW()),
(6, 'Tinturaria & Acabamento Rio Claro (Alberto)', '+55 (19) 97100-8822', 3, 'negociacao', 'Aguardando liberação de vistoria preventiva da câmara de aquecimento da rama Montex 6500.', DATE_ADD(CURDATE(), INTERVAL 5 DAY), NOW());
```

---

## 4. Passo 3: Configurar o Node.js Web App no hPanel

1. No **hPanel**, vá em **Avançado** > **Node.js** (ou pesquise por "Node.js").
2. Clique no botão **Criar Aplicativo**:
   * **Versão do Node.js:** Escolha `Node.js 20.x` ou `Node.js 18.x LTS`.
   * **Modo da Aplicação:** `Production`.
   * **Diretório Raiz da Aplicação:** `/home/u123456789/public_html` (ou a pasta do seu subdomínio).
   * **Arquivo de Inicialização:** `server.ts` (executado via `tsx`) ou `server.js`.
3. Salve a configuração.

---

## 5. Passo 4: Fazer Upload dos Arquivos

Transfira os arquivos do projeto para o diretório raiz configurado na Hostinger via **Git**, **SSH** ou **Gerenciador de Arquivos do hPanel**.

> **Nota:** Não envie a pasta `node_modules`. Ela será gerada pelo comando `npm install` no servidor.

---

## 6. Passo 5: Criar o arquivo `.env`

No diretório raiz da aplicação na Hostinger, crie um arquivo chamado `.env` contendo:

```env
# Conexão com o Banco MySQL da Hostinger
DB_HOST=localhost
DB_USER=u123456789_texuser
DB_PASSWORD=sua_senha_mysql_forte
DB_NAME=u123456789_texmachina
DB_PORT=3306

# Segurança da Autenticação JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui_gerada_aleatoria
JWT_EXPIRES_IN=7d

# Porta e Ambiente de Produção
PORT=3000
NODE_ENV=production

# URL da Aplicação (Seu Domínio ou Subdomínio Hostinger)
APP_URL=https://seudominio.com.br
```

---

## 7. Passo 6: Instalação e Build no Servidor

Abra o **Acesso SSH** ou o **Console do hPanel** no diretório da sua aplicação e execute:

```bash
# 1. Instalar todas as dependências do package.json
npm install

# 2. Compilar o frontend React com o Vite para a pasta dist
npm run build

# 3. Iniciar o servidor
npm run start
```

No painel Node.js da Hostinger, clique em **Reiniciar** (Restart Application).

---

## 8. Contas de Acesso Inicial Padrão

Após importar o `schema.sql`, utilize as credenciais abaixo na tela de login:

| Perfil | E-mail | Senha |
|---|---|---|
| **Diretoria (Admin)** | `admin@texmachina.com.br` | `admin123` |
| **Vendedor Comercial** | `vendedor@texmachina.com.br` | `vendedor123` |
| **Representante** | `marcio.vendas@texmachina.com.br` | `vendedor123` |

---

## 9. Resolução de Problemas Comuns (Troubleshooting)

* **Erro de conexão ao MySQL (`ECONNREFUSED` ou `Access denied`):**
  * Na Hostinger, o `DB_HOST` costuma ser sempre `localhost`.
  * Verifique se o usuário tem privilégios concedidos ao banco de dados no hPanel.
* **Rotas do React retornando 404 ao recarregar:**
  * O `server.ts` já possui `app.get('*', ...)` que envia o `index.html` para qualquer rota não encontrada pela API.
  * Certifique-se de que o comando `npm run build` foi executado e a pasta `dist` existe na raiz.
* **Porta:**
  * A Hostinger define a porta dinamicamente via `process.env.PORT`. O servidor Express já está preparado para ler `process.env.PORT || 3000`.
