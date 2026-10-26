var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  authenticateToken: () => authenticateToken,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// server/db.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var mysqlPool = null;
var isMySQLConnected = false;
var dbConnectionError = null;
var memoryUsers = [
  {
    id: 1,
    name: "Carlos Eduardo Menezes",
    email: "admin@texmachina.com.br",
    password_hash: import_bcryptjs.default.hashSync("admin123", 10),
    role: "admin",
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 2,
    name: "Renata Silveira",
    email: "vendedor@texmachina.com.br",
    password_hash: import_bcryptjs.default.hashSync("vendedor123", 10),
    role: "vendedor",
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 3,
    name: "Marcio Zanetti",
    email: "marcio.vendas@texmachina.com.br",
    password_hash: import_bcryptjs.default.hashSync("vendedor123", 10),
    role: "vendedor",
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1e3).toISOString()
  }
];
var memoryMachines = [
  {
    id: 1,
    name: "Mayer & Cie Relanit 3.2 II",
    model: "Single Jersey E28",
    description: "Tear circular de alta rota\xE7\xE3o para malharia refinada. Di\xE2metro 34 polegadas, 96 alimentadores com alimentadores Memminger MPF, inversor de frequ\xEAncia e painel digital com controle de tens\xE3o.",
    price: 42e4,
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
    status: "disponivel",
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 2,
    name: "Toyota JAT810 Air Jet Loom",
    model: "JAT810-190 Dobby",
    description: "Tear plano a jato de ar de alt\xEDssima produtividade. Largura \xFAtil de 190 cm, maquineta eletr\xF4nica Staubli, velocidade operacional de at\xE9 1.250 RPM. Ideal para tecidos planos leves e m\xE9dios.",
    price: 34e4,
    image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=900&q=80",
    status: "disponivel",
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 3,
    name: "Monforts Montex 6500 Stenter Frame",
    model: "Montex 6500 Gas 5C",
    description: "Rama industrial para termofixa\xE7\xE3o, secagem e acabamento cont\xEDnuo de tecidos. 5 c\xE2maras a g\xE1s GLP, largura operacional \xFAtil de 2.400 mm, automa\xE7\xE3o completa Qualitex PLC.",
    price: 128e4,
    image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
    status: "manutencao",
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 4,
    name: "Rieter G36 Spun Yarn Ring Frame",
    model: "G36 1200 Spindles",
    description: "Fia\xE7\xE3o de anel cont\xEDnua para fios finos e cardados. 1.200 fusos, anel de 42 mm, sistema autom\xE1tico SERVOgrip de doffing e controle eletr\xF4nico de estiragem.",
    price: 89e4,
    image_url: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
    status: "disponivel",
    created_at: new Date(Date.now() - 18 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 5,
    name: "Picanol OmniPlus-i TC Connect 220",
    model: "OmniPlus-i 220cm",
    description: "Tear a jato de ar de \xFAltima gera\xE7\xE3o com interface digital BlueTouch, 4 cores smart, monitoramento de consumo de ar comprimido por sensor t\xE9rmico.",
    price: 51e4,
    image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80",
    status: "vendido",
    created_at: new Date(Date.now() - 40 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 6,
    name: "Dornier P2 Rapier Weaving Machine",
    model: "P2 Type TFN",
    description: "Tear de pin\xE7as r\xEDgidas para tecidos t\xE9cnicos, fibras sint\xE9ticas e aramidas. Largura \xFAtil 260 cm com cala limpa para m\xE1xima precis\xE3o de trama.",
    price: 75e4,
    image_url: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80",
    status: "disponivel",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1e3).toISOString()
  }
];
var nextMachineId = 7;
var nextLeadId = 7;
var nextUserId = 4;
var memoryLeads = [
  {
    id: 1,
    client_name: "Malharia Santa Catarina Ltda (Sr. Roberto)",
    client_phone: "+55 (47) 99881-2244",
    machine_id: 1,
    status: "novo",
    notes: "Cliente solicitou cat\xE1logo t\xE9cnico com tabela de rendimento de malha em poli\xE9ster/elastano. Agendar liga\xE7\xE3o preliminar.",
    follow_up_date: new Date(Date.now() + 2 * 24 * 3600 * 1e3).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 2,
    client_name: "T\xEAxtil Vale do Itaja\xED S/A (Dra. Juliana)",
    client_phone: "+55 (47) 99123-4567",
    machine_id: 2,
    status: "orcamento",
    notes: "Enviada proposta formal com desconto de 5% \xE0 vista ou financiamento FINAME em 36 parcelas. Aguardando parecer da diretoria.",
    follow_up_date: new Date(Date.now() + 4 * 24 * 3600 * 1e3).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 3,
    client_name: "Fia\xE7\xE3o & Tecelagem Paulista (Eng. Hamilton)",
    client_phone: "+55 (19) 98765-4321",
    machine_id: 4,
    status: "negociacao",
    notes: "Visita t\xE9cnica realizada no parque fabril em Americana/SP. Em negocia\xE7\xE3o final sobre frete industrial e comissionamento no local.",
    follow_up_date: new Date(Date.now() + 1 * 24 * 3600 * 1e3).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 4,
    client_name: "Coteminas Ind\xFAstria T\xEAxtil (Marcos Bastos)",
    client_phone: "+55 (38) 99712-3300",
    machine_id: 5,
    status: "fechado",
    notes: "Contrato assinado via DocuSign. Pagamento do sinal de 40% confirmado, envio da m\xE1quina agendado para transportadora especializada.",
    follow_up_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 5,
    client_name: "Tecidos Nobres do Nordeste (Felipe Arcoverde)",
    client_phone: "+55 (81) 98442-1199",
    machine_id: 6,
    status: "novo",
    notes: "Demonstrou interesse na m\xE1quina Dornier P2 para produ\xE7\xE3o de tecidos industriais de seguran\xE7a.",
    follow_up_date: new Date(Date.now() + 3 * 24 * 3600 * 1e3).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1e3).toISOString()
  },
  {
    id: 6,
    client_name: "Tinturaria & Acabamento Rio Claro (Alberto)",
    client_phone: "+55 (19) 97100-8822",
    machine_id: 3,
    status: "negociacao",
    notes: "Aguardando libera\xE7\xE3o de vistoria preventiva da c\xE2mara de aquecimento da rama Montex 6500.",
    follow_up_date: new Date(Date.now() + 5 * 24 * 3600 * 1e3).toISOString().split("T")[0],
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1e3).toISOString()
  }
];
async function initDatabase() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
  if (DB_HOST && DB_USER && DB_NAME) {
    try {
      console.log(`[Database] Attempting connection to MySQL at ${DB_HOST}:${DB_PORT || 3306}/${DB_NAME}...`);
      const pool = import_promise.default.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD || "",
        database: DB_NAME,
        port: Number(DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : void 0
      });
      const connection = await pool.getConnection();
      console.log("[Database] MySQL connection established successfully!");
      isMySQLConnected = true;
      mysqlPool = pool;
      connection.release();
      await ensureTablesCreated(pool);
    } catch (err) {
      console.warn("[Database] MySQL connection failed. Error:", err.message);
      dbConnectionError = err.message;
      isMySQLConnected = false;
      console.log("[Database] Operating with fallback In-Memory persistence (Full CRUD active).");
    }
  } else {
    console.log("[Database] No MySQL DB_HOST/DB_NAME environment variables specified.");
    console.log("[Database] Operating with fallback In-Memory persistence (Hostinger ready with schema.sql).");
  }
}
async function ensureTablesCreated(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(150) NOT NULL,
        description TEXT NULL,
        price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        image_url VARCHAR(500) NULL,
        status ENUM('disponivel', 'vendido', 'manutencao') NOT NULL DEFAULT 'disponivel',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(200) NOT NULL,
        client_phone VARCHAR(50) NOT NULL,
        machine_id INT NULL,
        status ENUM('novo', 'orcamento', 'negociacao', 'fechado') NOT NULL DEFAULT 'novo',
        notes TEXT NULL,
        follow_up_date DATE NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_machine (machine_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("[Database] Verified MySQL tables structure.");
  } catch (err) {
    console.error("[Database] Failed to verify tables:", err.message);
  }
}
function getDatabaseStatus() {
  return {
    isMySQL: isMySQLConnected,
    mode: isMySQLConnected ? "MySQL Connection Pool" : "In-Memory Enterprise Store (Hostinger Ready)",
    error: dbConnectionError,
    config: {
      host: process.env.DB_HOST || "Not configured (using memory store)",
      database: process.env.DB_NAME || "texmachina_db",
      user: process.env.DB_USER || "root"
    },
    counts: {
      users: isMySQLConnected ? "MySQL" : memoryUsers.length,
      machines: isMySQLConnected ? "MySQL" : memoryMachines.length,
      leads: isMySQLConnected ? "MySQL" : memoryLeads.length
    }
  };
}
var usersRepo = {
  async findByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query(
        "SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1",
        [cleanEmail]
      );
      if (rows.length > 0) return rows[0];
      return null;
    }
    const found = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    return found || null;
  },
  async findById(id) {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1",
        [id]
      );
      if (rows.length > 0) return rows[0];
      return null;
    }
    const found = memoryUsers.find((u) => u.id === id);
    return found ? { ...found } : null;
  },
  async create(user) {
    if (isMySQLConnected && mysqlPool) {
      const [result] = await mysqlPool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [user.name, user.email.toLowerCase(), user.password_hash, user.role]
      );
      return {
        id: result.insertId,
        name: user.name,
        email: user.email.toLowerCase(),
        password_hash: user.password_hash,
        role: user.role,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const newUser = {
      id: nextUserId++,
      name: user.name,
      email: user.email.toLowerCase(),
      password_hash: user.password_hash,
      role: user.role,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryUsers.push(newUser);
    return newUser;
  }
};
var machinesRepo = {
  async list(filters) {
    if (isMySQLConnected && mysqlPool) {
      let query = "SELECT * FROM machines WHERE 1=1";
      const params = [];
      if (filters?.search) {
        query += " AND (name LIKE ? OR model LIKE ? OR description LIKE ?)";
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      if (filters?.status && filters.status !== "all") {
        query += " AND status = ?";
        params.push(filters.status);
      }
      query += " ORDER BY id DESC";
      const [rows] = await mysqlPool.query(query, params);
      return rows;
    }
    let items = [...memoryMachines];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (m) => m.name.toLowerCase().includes(q) || m.model.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
      );
    }
    if (filters?.status && filters.status !== "all") {
      items = items.filter((m) => m.status === filters.status);
    }
    return items.sort((a, b) => b.id - a.id);
  },
  async findById(id) {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query(
        "SELECT * FROM machines WHERE id = ? LIMIT 1",
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    }
    const found = memoryMachines.find((m) => m.id === id);
    return found ? { ...found } : null;
  },
  async create(data) {
    if (isMySQLConnected && mysqlPool) {
      const [result] = await mysqlPool.query(
        "INSERT INTO machines (name, model, description, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?)",
        [data.name, data.model, data.description, data.price, data.image_url, data.status]
      );
      return {
        id: result.insertId,
        ...data,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const item = {
      id: nextMachineId++,
      name: data.name,
      model: data.model,
      description: data.description,
      price: Number(data.price),
      image_url: data.image_url,
      status: data.status,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryMachines.unshift(item);
    return item;
  },
  async update(id, data) {
    if (isMySQLConnected && mysqlPool) {
      const fields = [];
      const values = [];
      if (data.name !== void 0) {
        fields.push("name = ?");
        values.push(data.name);
      }
      if (data.model !== void 0) {
        fields.push("model = ?");
        values.push(data.model);
      }
      if (data.description !== void 0) {
        fields.push("description = ?");
        values.push(data.description);
      }
      if (data.price !== void 0) {
        fields.push("price = ?");
        values.push(data.price);
      }
      if (data.image_url !== void 0) {
        fields.push("image_url = ?");
        values.push(data.image_url);
      }
      if (data.status !== void 0) {
        fields.push("status = ?");
        values.push(data.status);
      }
      if (fields.length === 0) return this.findById(id);
      values.push(id);
      await mysqlPool.query(`UPDATE machines SET ${fields.join(", ")} WHERE id = ?`, values);
      return this.findById(id);
    }
    const index = memoryMachines.findIndex((m) => m.id === id);
    if (index === -1) return null;
    memoryMachines[index] = {
      ...memoryMachines[index],
      ...data,
      price: data.price !== void 0 ? Number(data.price) : memoryMachines[index].price
    };
    return memoryMachines[index];
  },
  async delete(id) {
    if (isMySQLConnected && mysqlPool) {
      const [result] = await mysqlPool.query("DELETE FROM machines WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
    const index = memoryMachines.findIndex((m) => m.id === id);
    if (index === -1) return false;
    memoryMachines.splice(index, 1);
    memoryLeads.forEach((lead) => {
      if (lead.machine_id === id) {
        lead.machine_id = null;
      }
    });
    return true;
  }
};
var leadsRepo = {
  async list() {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query(`
        SELECT 
          l.id,
          l.client_name,
          l.client_phone,
          l.machine_id,
          l.status,
          l.notes,
          DATE_FORMAT(l.follow_up_date, '%Y-%m-%d') as follow_up_date,
          l.created_at,
          m.name AS machine_name,
          m.model AS machine_model,
          m.price AS machine_price,
          m.image_url AS machine_image
        FROM leads l
        LEFT JOIN machines m ON l.machine_id = m.id
        ORDER BY l.id DESC
      `);
      return rows;
    }
    return memoryLeads.map((lead) => {
      const machine = lead.machine_id ? memoryMachines.find((m) => m.id === lead.machine_id) : null;
      return {
        ...lead,
        machine_name: machine ? machine.name : null,
        machine_model: machine ? machine.model : null,
        machine_price: machine ? machine.price : null,
        machine_image: machine ? machine.image_url : null
      };
    }).sort((a, b) => b.id - a.id);
  },
  async findById(id) {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query(
        `SELECT 
          l.*,
          m.name AS machine_name,
          m.model AS machine_model,
          m.price AS machine_price,
          m.image_url AS machine_image
        FROM leads l
        LEFT JOIN machines m ON l.machine_id = m.id
        WHERE l.id = ? LIMIT 1`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    }
    const lead = memoryLeads.find((l) => l.id === id);
    if (!lead) return null;
    const machine = lead.machine_id ? memoryMachines.find((m) => m.id === lead.machine_id) : null;
    return {
      ...lead,
      machine_name: machine ? machine.name : null,
      machine_model: machine ? machine.model : null,
      machine_price: machine ? machine.price : null,
      machine_image: machine ? machine.image_url : null
    };
  },
  async create(data) {
    const machineId = data.machine_id ? Number(data.machine_id) : null;
    if (isMySQLConnected && mysqlPool) {
      const [result] = await mysqlPool.query(
        "INSERT INTO leads (client_name, client_phone, machine_id, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?)",
        [data.client_name, data.client_phone, machineId, data.status, data.notes, data.follow_up_date || null]
      );
      const inserted = await this.findById(result.insertId);
      return inserted;
    }
    const newLead = {
      id: nextLeadId++,
      client_name: data.client_name,
      client_phone: data.client_phone,
      machine_id: machineId,
      status: data.status,
      notes: data.notes || "",
      follow_up_date: data.follow_up_date || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    memoryLeads.unshift(newLead);
    const machine = machineId ? memoryMachines.find((m) => m.id === machineId) : null;
    return {
      ...newLead,
      machine_name: machine ? machine.name : null,
      machine_model: machine ? machine.model : null,
      machine_price: machine ? machine.price : null,
      machine_image: machine ? machine.image_url : null
    };
  },
  async update(id, data) {
    if (isMySQLConnected && mysqlPool) {
      const fields = [];
      const values = [];
      if (data.client_name !== void 0) {
        fields.push("client_name = ?");
        values.push(data.client_name);
      }
      if (data.client_phone !== void 0) {
        fields.push("client_phone = ?");
        values.push(data.client_phone);
      }
      if (data.machine_id !== void 0) {
        fields.push("machine_id = ?");
        values.push(data.machine_id ? Number(data.machine_id) : null);
      }
      if (data.status !== void 0) {
        fields.push("status = ?");
        values.push(data.status);
      }
      if (data.notes !== void 0) {
        fields.push("notes = ?");
        values.push(data.notes);
      }
      if (data.follow_up_date !== void 0) {
        fields.push("follow_up_date = ?");
        values.push(data.follow_up_date || null);
      }
      if (fields.length === 0) return this.findById(id);
      values.push(id);
      await mysqlPool.query(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`, values);
      return this.findById(id);
    }
    const index = memoryLeads.findIndex((l) => l.id === id);
    if (index === -1) return null;
    memoryLeads[index] = {
      ...memoryLeads[index],
      ...data,
      machine_id: data.machine_id !== void 0 ? data.machine_id ? Number(data.machine_id) : null : memoryLeads[index].machine_id
    };
    return this.findById(id);
  },
  async delete(id) {
    if (isMySQLConnected && mysqlPool) {
      const [result] = await mysqlPool.query("DELETE FROM leads WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
    const index = memoryLeads.findIndex((l) => l.id === id);
    if (index === -1) return false;
    memoryLeads.splice(index, 1);
    return true;
  }
};

// server.ts
import_dotenv.default.config();
var currentDir = typeof __dirname !== "undefined" ? __dirname : import_path.default.resolve(".");
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "texmachina_super_secure_jwt_secret_key_2025";
app.use((0, import_cors.default)());
app.use(import_express.default.json());
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Token de autentica\xE7\xE3o n\xE3o fornecido. Fa\xE7a login para continuar." });
    return;
  }
  import_jsonwebtoken.default.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Sess\xE3o expirada ou token inv\xE1lido. Fa\xE7a login novamente." });
      return;
    }
    req.user = decoded;
    next();
  });
}
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Nome, e-mail e senha s\xE3o obrigat\xF3rios." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "A senha deve conter no m\xEDnimo 6 caracteres." });
      return;
    }
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Este e-mail j\xE1 est\xE1 cadastrado no sistema." });
      return;
    }
    const password_hash = await import_bcryptjs2.default.hash(password, 10);
    const assignedRole = role === "admin" ? "admin" : "vendedor";
    const newUser = await usersRepo.create({
      name,
      email,
      password_hash,
      role: assignedRole
    });
    const token = import_jsonwebtoken.default.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      message: "Usu\xE1rio registrado com sucesso.",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar usu\xE1rio." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Informe e-mail e senha." });
      return;
    }
    const user = await usersRepo.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }
    const match = await import_bcryptjs2.default.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }
    const token = import_jsonwebtoken.default.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Erro interno ao realizar autentica\xE7\xE3o." });
  }
});
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await usersRepo.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
      return;
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter dados do usu\xE1rio." });
  }
});
app.get("/api/machines", authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    const machines = await machinesRepo.list({
      search: typeof search === "string" ? search : void 0,
      status: typeof status === "string" ? status : void 0
    });
    res.json(machines);
  } catch (error) {
    console.error("Error fetching machines:", error);
    res.status(500).json({ error: "Erro ao buscar cat\xE1logo de m\xE1quinas." });
  }
});
app.post("/api/machines", authenticateToken, async (req, res) => {
  try {
    const { name, model, description, price, image_url, status } = req.body;
    if (!name || !model || price === void 0) {
      res.status(400).json({ error: "Nome da m\xE1quina, modelo e pre\xE7o s\xE3o obrigat\xF3rios." });
      return;
    }
    const validStatus = ["disponivel", "vendido", "manutencao"].includes(status) ? status : "disponivel";
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: "Pre\xE7o inv\xE1lido." });
      return;
    }
    const machine = await machinesRepo.create({
      name,
      model,
      description: description || "",
      price: parsedPrice,
      image_url: image_url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
      status: validStatus
    });
    res.status(201).json(machine);
  } catch (error) {
    console.error("Error creating machine:", error);
    res.status(500).json({ error: "Erro ao cadastrar m\xE1quina." });
  }
});
app.put("/api/machines/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inv\xE1lido." });
      return;
    }
    const { name, model, description, price, image_url, status } = req.body;
    const existing = await machinesRepo.findById(id);
    if (!existing) {
      res.status(404).json({ error: "M\xE1quina n\xE3o encontrada." });
      return;
    }
    const updateData = {};
    if (name !== void 0) updateData.name = name;
    if (model !== void 0) updateData.model = model;
    if (description !== void 0) updateData.description = description;
    if (price !== void 0) updateData.price = parseFloat(price);
    if (image_url !== void 0) updateData.image_url = image_url;
    if (status !== void 0) {
      if (!["disponivel", "vendido", "manutencao"].includes(status)) {
        res.status(400).json({ error: "Status de m\xE1quina inv\xE1lido." });
        return;
      }
      updateData.status = status;
    }
    const updated = await machinesRepo.update(id, updateData);
    res.json(updated);
  } catch (error) {
    console.error("Error updating machine:", error);
    res.status(500).json({ error: "Erro ao atualizar m\xE1quina." });
  }
});
app.delete("/api/machines/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inv\xE1lido." });
      return;
    }
    const success = await machinesRepo.delete(id);
    if (!success) {
      res.status(404).json({ error: "M\xE1quina n\xE3o encontrada para exclus\xE3o." });
      return;
    }
    res.json({ message: "M\xE1quina exclu\xEDda com sucesso.", id });
  } catch (error) {
    console.error("Error deleting machine:", error);
    res.status(500).json({ error: "Erro ao excluir m\xE1quina." });
  }
});
app.get("/api/leads", authenticateToken, async (_req, res) => {
  try {
    const leads = await leadsRepo.list();
    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Erro ao buscar leads e pipeline." });
  }
});
app.post("/api/leads", authenticateToken, async (req, res) => {
  try {
    const { client_name, client_phone, machine_id, status, notes, follow_up_date } = req.body;
    if (!client_name || !client_phone) {
      res.status(400).json({ error: "Nome do cliente e telefone de contato s\xE3o obrigat\xF3rios." });
      return;
    }
    const validStatus = ["novo", "orcamento", "negociacao", "fechado"].includes(status) ? status : "novo";
    const lead = await leadsRepo.create({
      client_name,
      client_phone,
      machine_id: machine_id ? parseInt(machine_id, 10) : null,
      status: validStatus,
      notes: notes || "",
      follow_up_date: follow_up_date || null
    });
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Erro ao criar lead de vendas." });
  }
});
app.put("/api/leads/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inv\xE1lido." });
      return;
    }
    const { client_name, client_phone, machine_id, status, notes, follow_up_date } = req.body;
    const existing = await leadsRepo.findById(id);
    if (!existing) {
      res.status(404).json({ error: "Lead n\xE3o encontrado." });
      return;
    }
    const updateData = {};
    if (client_name !== void 0) updateData.client_name = client_name;
    if (client_phone !== void 0) updateData.client_phone = client_phone;
    if (machine_id !== void 0) updateData.machine_id = machine_id ? parseInt(machine_id, 10) : null;
    if (notes !== void 0) updateData.notes = notes;
    if (follow_up_date !== void 0) updateData.follow_up_date = follow_up_date;
    if (status !== void 0) {
      if (!["novo", "orcamento", "negociacao", "fechado"].includes(status)) {
        res.status(400).json({ error: "Status de funil inv\xE1lido." });
        return;
      }
      updateData.status = status;
    }
    const updated = await leadsRepo.update(id, updateData);
    res.json(updated);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Erro ao atualizar lead." });
  }
});
app.delete("/api/leads/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inv\xE1lido." });
      return;
    }
    const success = await leadsRepo.delete(id);
    if (!success) {
      res.status(404).json({ error: "Lead n\xE3o encontrado." });
      return;
    }
    res.json({ message: "Lead removido com sucesso.", id });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Erro ao remover lead." });
  }
});
app.get("/api/dashboard/stats", authenticateToken, async (_req, res) => {
  try {
    const machines = await machinesRepo.list();
    const leads = await leadsRepo.list();
    const totalMachines = machines.length;
    const availableMachines = machines.filter((m) => m.status === "disponivel").length;
    const soldMachines = machines.filter((m) => m.status === "vendido").length;
    const maintenanceMachines = machines.filter((m) => m.status === "manutencao").length;
    const totalInventoryValue = machines.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const availableInventoryValue = machines.filter((m) => m.status === "disponivel").reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const activeLeads = leads.filter((l) => l.status !== "fechado").length;
    const closedLeads = leads.filter((l) => l.status === "fechado").length;
    const pipelineValue = leads.filter((l) => l.status !== "fechado").reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);
    const closedRevenue = leads.filter((l) => l.status === "fechado").reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);
    const leadsByStatus = {
      novo: leads.filter((l) => l.status === "novo").length,
      orcamento: leads.filter((l) => l.status === "orcamento").length,
      negociacao: leads.filter((l) => l.status === "negociacao").length,
      fechado: closedLeads
    };
    const recentLeads = leads.slice(0, 5);
    res.json({
      totalMachines,
      availableMachines,
      soldMachines,
      maintenanceMachines,
      totalInventoryValue,
      availableInventoryValue,
      totalLeads: leads.length,
      activeLeads,
      closedLeads,
      pipelineValue,
      closedRevenue,
      leadsByStatus,
      recentLeads
    });
  } catch (error) {
    console.error("Error computing dashboard stats:", error);
    res.status(500).json({ error: "Erro ao calcular estat\xEDsticas do painel." });
  }
});
app.get("/api/system/status", (_req, res) => {
  const status = getDatabaseStatus();
  res.json({
    ...status,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    serverPort: PORT
  });
});
app.get("/api/system/schema-sql", (_req, res) => {
  const schemaPath = import_path.default.resolve(currentDir, "schema.sql");
  if (import_fs.default.existsSync(schemaPath)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.sendFile(schemaPath);
  } else {
    res.status(404).send("schema.sql not found");
  }
});
app.get("/api/system/download-env", (_req, res) => {
  const envContent = `# =====================================================================
# TexMachina OS - Configura\xE7\xE3o Hostinger (Node.js + MySQL)
# =====================================================================

DB_HOST=localhost
DB_USER=u940098558_texmaquina
DB_PASSWORD==Eg*XWs:9r/5
DB_NAME=u940098558_texmaquina
DB_PORT=3306

JWT_SECRET=texmachina_super_secure_jwt_secret_key_2025
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=production
APP_URL=https://seudominio.com.br
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename=".env"');
  res.send(envContent);
});
async function startServer() {
  try {
    await initDatabase();
  } catch (dbErr) {
    console.warn("[Database] Initial startup warning:", dbErr.message);
  }
  const isProd = process.env.NODE_ENV === "production";
  const prodDistPath = import_path.default.resolve(currentDir, "dist");
  const clientDistPath = import_path.default.resolve(currentDir, "../client/dist");
  const activeDist = import_fs.default.existsSync(prodDistPath) ? prodDistPath : import_fs.default.existsSync(clientDistPath) ? clientDistPath : null;
  if (isProd && activeDist) {
    console.log(`[Hostinger Production] Serving static files from ${activeDist}`);
    app.use(import_express.default.static(activeDist));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(activeDist, "index.html"));
    });
  } else {
    console.log("[Dev Mode] Mounting Vite development server middlewares...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\u{1F680} TexMachina Server running on http://0.0.0.0:${PORT}`);
    console.log(`\u{1F4CA} API endpoints ready at http://localhost:${PORT}/api/*`);
  });
}
startServer().catch((err) => {
  console.error("Fatal server startup failure:", err);
});
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authenticateToken
});
