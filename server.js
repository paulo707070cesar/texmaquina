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
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_bcryptjs2 = __toESM(require("bcryptjs"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_dotenv = __toESM(require("dotenv"));
var import_multer = __toESM(require("multer"));

// server/db.ts
var import_promise = __toESM(require("mysql2/promise"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var mysqlPool = null;
var isMySQLConnected = false;
var dbConnectionError = null;
var memoryTenants = [
  { id: 1, name: "TexMachina Matriz", slug: "matriz", created_at: (/* @__PURE__ */ new Date()).toISOString() }
];
var memoryUsers = [
  {
    id: 1,
    tenant_id: 1,
    name: "Carlos Eduardo Menezes",
    email: "admin@texmachina.com.br",
    password_hash: import_bcryptjs.default.hashSync("admin123", 10),
    role: "admin",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var memoryMachines = [];
var memoryLeads = [];
var nextUserId = 2;
var nextMachineId = 1;
var nextLeadId = 1;
async function initDatabase() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
  if (DB_HOST && DB_USER && DB_NAME) {
    try {
      const pool = import_promise.default.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD || "",
        database: DB_NAME,
        port: Number(DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5e3,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : void 0
      });
      const connection = await pool.getConnection();
      console.log("[Database] MySQL connection established (Multi-Tenant).");
      isMySQLConnected = true;
      mysqlPool = pool;
      connection.release();
      await ensureTablesCreated(pool);
    } catch (err) {
      console.warn("[Database] MySQL connection failed:", err.message);
      dbConnectionError = err.message;
      isMySQLConnected = false;
    }
  }
}
async function ensureTablesCreated(pool) {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS tenants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(100) NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (tenant_id)
    ) ENGINE=InnoDB;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS machines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      model VARCHAR(150) NOT NULL,
      description TEXT NULL,
      price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      image_url VARCHAR(500) NULL,
      status ENUM('disponivel', 'vendido', 'manutencao') NOT NULL DEFAULT 'disponivel',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (tenant_id)
    ) ENGINE=InnoDB;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      client_name VARCHAR(200) NOT NULL,
      client_phone VARCHAR(50) NOT NULL,
      machine_id INT NULL,
      status ENUM('novo', 'orcamento', 'negociacao', 'fechado') NOT NULL DEFAULT 'novo',
      notes TEXT NULL,
      follow_up_date DATE NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (tenant_id)
    ) ENGINE=InnoDB;`);
  } catch (err) {
    console.error("[Database] Table verification failed:", err.message);
  }
}
function getDatabaseStatus() {
  return {
    isMySQL: isMySQLConnected,
    mode: isMySQLConnected ? "Multi-Tenant MySQL" : "Multi-Tenant In-Memory",
    error: dbConnectionError,
    counts: {
      tenants: isMySQLConnected ? "MySQL" : memoryTenants.length,
      users: isMySQLConnected ? "MySQL" : memoryUsers.length
    }
  };
}
var usersRepo = {
  async findByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM users WHERE LOWER(email) = ?", [cleanEmail]);
      return rows[0] || null;
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },
  async findById(id) {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM users WHERE id = ?", [id]);
      return rows[0] || null;
    }
    return memoryUsers.find((u) => u.id === id) || null;
  },
  async create(user) {
    if (isMySQLConnected && mysqlPool) {
      const [result] = await mysqlPool.query(
        "INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        [user.tenant_id, user.name, user.email.toLowerCase(), user.password_hash, user.role]
      );
      return { id: result.insertId, ...user, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    }
    const newUser = { id: nextUserId++, ...user, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    memoryUsers.push(newUser);
    return newUser;
  }
};
var machinesRepo = {
  async list(tenant_id, filters) {
    if (isMySQLConnected && mysqlPool) {
      let sql = "SELECT * FROM machines WHERE tenant_id = ?";
      const params = [tenant_id];
      if (filters?.search) {
        sql += " AND (name LIKE ? OR model LIKE ?)";
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      if (filters?.status && filters.status !== "all") {
        sql += " AND status = ?";
        params.push(filters.status);
      }
      sql += " ORDER BY id DESC";
      const [rows] = await mysqlPool.query(sql, params);
      return rows;
    }
    let items = memoryMachines.filter((m) => m.tenant_id === tenant_id);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((m) => m.name.toLowerCase().includes(q) || m.model.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== "all") {
      items = items.filter((m) => m.status === filters.status);
    }
    return items.sort((a, b) => b.id - a.id);
  },
  async findById(tenant_id, id) {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query("SELECT * FROM machines WHERE tenant_id = ? AND id = ?", [tenant_id, id]);
      return rows[0] || null;
    }
    return memoryMachines.find((m) => m.tenant_id === tenant_id && m.id === id) || null;
  },
  async create(data) {
    if (isMySQLConnected && mysqlPool) {
      const [res] = await mysqlPool.query(
        "INSERT INTO machines (tenant_id, name, model, description, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.tenant_id, data.name, data.model, data.description, data.price, data.image_url, data.status]
      );
      return { id: res.insertId, ...data, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    }
    const item = { id: nextMachineId++, ...data, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    memoryMachines.unshift(item);
    return item;
  },
  async update(tenant_id, id, data) {
    if (isMySQLConnected && mysqlPool) {
      const fields = Object.keys(data).filter((k) => k !== "id" && k !== "tenant_id" && k !== "created_at").map((k) => `${k} = ?`);
      const values = Object.keys(data).filter((k) => k !== "id" && k !== "tenant_id" && k !== "created_at").map((k) => data[k]);
      if (fields.length === 0) return this.findById(tenant_id, id);
      values.push(tenant_id, id);
      await mysqlPool.query(`UPDATE machines SET ${fields.join(", ")} WHERE tenant_id = ? AND id = ?`, values);
      return this.findById(tenant_id, id);
    }
    const idx = memoryMachines.findIndex((m) => m.tenant_id === tenant_id && m.id === id);
    if (idx === -1) return null;
    memoryMachines[idx] = { ...memoryMachines[idx], ...data };
    return memoryMachines[idx];
  },
  async delete(tenant_id, id) {
    if (isMySQLConnected && mysqlPool) {
      const [res] = await mysqlPool.query("DELETE FROM machines WHERE tenant_id = ? AND id = ?", [tenant_id, id]);
      return res.affectedRows > 0;
    }
    const idx = memoryMachines.findIndex((m) => m.tenant_id === tenant_id && m.id === id);
    if (idx === -1) return false;
    memoryMachines.splice(idx, 1);
    return true;
  }
};
var leadsRepo = {
  async list(tenant_id) {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query(`
        SELECT l.*, m.name as machine_name, m.model as machine_model, m.price as machine_price, m.image_url as machine_image
        FROM leads l LEFT JOIN machines m ON l.machine_id = m.id
        WHERE l.tenant_id = ? ORDER BY l.id DESC
      `, [tenant_id]);
      return rows;
    }
    return memoryLeads.filter((l) => l.tenant_id === tenant_id).map((l) => {
      const m = l.machine_id ? memoryMachines.find((mx) => mx.id === l.machine_id) : null;
      return { ...l, machine_name: m?.name, machine_model: m?.model, machine_price: m?.price, machine_image: m?.image_url };
    }).sort((a, b) => b.id - a.id);
  },
  async create(data) {
    if (isMySQLConnected && mysqlPool) {
      const [res] = await mysqlPool.query(
        "INSERT INTO leads (tenant_id, client_name, client_phone, machine_id, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.tenant_id, data.client_name, data.client_phone, data.machine_id, data.status, data.notes, data.follow_up_date]
      );
      const [rows] = await mysqlPool.query("SELECT * FROM leads WHERE id = ?", [res.insertId]);
      return rows[0];
    }
    const item = { id: nextLeadId++, ...data, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    memoryLeads.unshift(item);
    return item;
  },
  async update(tenant_id, id, data) {
    if (isMySQLConnected && mysqlPool) {
      const fields = Object.keys(data).filter((k) => k !== "id" && k !== "tenant_id" && k !== "created_at").map((k) => `${k} = ?`);
      const values = Object.keys(data).filter((k) => k !== "id" && k !== "tenant_id" && k !== "created_at").map((k) => data[k]);
      values.push(tenant_id, id);
      await mysqlPool.query(`UPDATE leads SET ${fields.join(", ")} WHERE tenant_id = ? AND id = ?`, values);
      const [rows] = await mysqlPool.query("SELECT * FROM leads WHERE id = ?", [id]);
      return rows[0];
    }
    const idx = memoryLeads.findIndex((l) => l.tenant_id === tenant_id && l.id === id);
    if (idx === -1) return null;
    memoryLeads[idx] = { ...memoryLeads[idx], ...data };
    return memoryLeads[idx];
  },
  async delete(tenant_id, id) {
    if (isMySQLConnected && mysqlPool) {
      const [res] = await mysqlPool.query("DELETE FROM leads WHERE tenant_id = ? AND id = ?", [tenant_id, id]);
      return res.affectedRows > 0;
    }
    const idx = memoryLeads.findIndex((l) => l.tenant_id === tenant_id && l.id === id);
    if (idx === -1) return false;
    memoryLeads.splice(idx, 1);
    return true;
  }
};

// server.ts
import_dotenv.default.config();
var currentDir = typeof __dirname !== "undefined" ? __dirname : import_path.default.resolve(".");
var uploadDir = import_path.default.join(currentDir, "uploads");
if (!import_fs.default.existsSync(uploadDir)) {
  import_fs.default.mkdirSync(uploadDir, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = import_path.default.extname(file.originalname);
    cb(null, `machine-${uniqueSuffix}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = import_path.default.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      return cb(null, true);
    }
    cb(new Error("Apenas imagens (jpeg, jpg, png, webp) s\xE3o permitidas."));
  }
});
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "texmachina_super_secure_jwt_secret_key_2025";
app.use((0, import_cors.default)());
app.use(import_express.default.json());
app.use("/uploads", import_express.default.static(uploadDir));
app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof import_multer.default.MulterError) {
      return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Fa\xE7a login para continuar." });
    return;
  }
  import_jsonwebtoken.default.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Sess\xE3o expirada. Fa\xE7a login novamente." });
      return;
    }
    req.user = decoded;
    next();
  });
}
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, company_name } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Nome, e-mail e senha s\xE3o obrigat\xF3rios." });
      return;
    }
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: "E-mail j\xE1 cadastrado." });
      return;
    }
    const newTenant = await tenantsRepo.create(company_name || `Empresa de ${name}`);
    const password_hash = await import_bcryptjs2.default.hash(password, 10);
    const newUser = await usersRepo.create({
      tenant_id: newTenant.id,
      name,
      email,
      password_hash,
      role: "admin"
      // First user is always admin of their tenant
    });
    const token = import_jsonwebtoken.default.sign(
      {
        id: newUser.id,
        tenant_id: newUser.tenant_id,
        tenant_name: newTenant.name,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      message: "Conta e empresa criadas com sucesso.",
      token,
      user: {
        id: newUser.id,
        tenant_id: newUser.tenant_id,
        tenant_name: newTenant.name,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Reg error:", error);
    res.status(500).json({ error: "Erro ao cadastrar." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usersRepo.findByEmail(email);
    if (!user || !await import_bcryptjs2.default.compare(password, user.password_hash)) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }
    const tenant = await tenantsRepo.findById(user.tenant_id);
    const token = import_jsonwebtoken.default.sign(
      {
        id: user.id,
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || "Empresa",
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || "Empresa",
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erro no login." });
  }
});
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await usersRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    const tenant = await tenantsRepo.findById(user.tenant_id);
    res.json({
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || "Empresa",
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter dados." });
  }
});
app.get("/api/machines", authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    const machines = await machinesRepo.list(req.user.tenant_id, {
      search: typeof search === "string" ? search : void 0,
      status: typeof status === "string" ? status : void 0
    });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar m\xE1quinas." });
  }
});
app.post("/api/machines", authenticateToken, async (req, res) => {
  try {
    const machine = await machinesRepo.create({
      ...req.body,
      tenant_id: req.user.tenant_id,
      price: parseFloat(req.body.price) || 0
    });
    res.status(201).json(machine);
  } catch (error) {
    res.status(500).json({ error: "Erro ao cadastrar." });
  }
});
app.put("/api/machines/:id", authenticateToken, async (req, res) => {
  try {
    const updated = await machinesRepo.update(req.user.tenant_id, parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "N\xE3o encontrada." });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar." });
  }
});
app.delete("/api/machines/:id", authenticateToken, async (req, res) => {
  try {
    const success = await machinesRepo.delete(req.user.tenant_id, parseInt(req.params.id));
    if (!success) return res.status(404).json({ error: "N\xE3o encontrada." });
    res.json({ message: "Exclu\xEDda.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir." });
  }
});
app.get("/api/leads", authenticateToken, async (req, res) => {
  try {
    const leads = await leadsRepo.list(req.user.tenant_id);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar leads." });
  }
});
app.post("/api/leads", authenticateToken, async (req, res) => {
  try {
    const lead = await leadsRepo.create({
      ...req.body,
      tenant_id: req.user.tenant_id,
      machine_id: req.body.machine_id ? parseInt(req.body.machine_id) : null
    });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar lead." });
  }
});
app.put("/api/leads/:id", authenticateToken, async (req, res) => {
  try {
    const updated = await leadsRepo.update(req.user.tenant_id, parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Lead n\xE3o encontrado." });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar." });
  }
});
app.delete("/api/leads/:id", authenticateToken, async (req, res) => {
  try {
    const success = await leadsRepo.delete(req.user.tenant_id, parseInt(req.params.id));
    if (!success) return res.status(404).json({ error: "Lead n\xE3o encontrado." });
    res.json({ message: "Lead removido.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover lead." });
  }
});
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const [machines, leads] = await Promise.all([
      machinesRepo.list(tenant_id),
      leadsRepo.list(tenant_id)
    ]);
    const totalMachines = machines.length;
    const availableMachines = machines.filter((m) => m.status === "disponivel").length;
    const totalInventoryValue = machines.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const activeLeads = leads.filter((l) => l.status !== "fechado").length;
    const pipelineValue = leads.filter((l) => l.status !== "fechado").reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);
    res.json({
      totalMachines,
      availableMachines,
      totalInventoryValue,
      totalLeads: leads.length,
      activeLeads,
      pipelineValue,
      leadsByStatus: {
        novo: leads.filter((l) => l.status === "novo").length,
        orcamento: leads.filter((l) => l.status === "orcamento").length,
        negociacao: leads.filter((l) => l.status === "negociacao").length,
        fechado: leads.filter((l) => l.status === "fechado").length
      },
      recentLeads: leads.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular estat\xEDsticas." });
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
var prodDistPath = import_path.default.resolve(currentDir, "dist");
var clientDistPath = import_path.default.resolve(currentDir, "../client/dist");
var activeDist = import_fs.default.existsSync(prodDistPath) ? prodDistPath : import_fs.default.existsSync(clientDistPath) ? clientDistPath : null;
if (activeDist) {
  console.log(`[Hostinger Production] Serving static files from ${activeDist}`);
  app.use(import_express.default.static(activeDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const indexFile = import_path.default.join(activeDist, "index.html");
    if (import_fs.default.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send("TexMachina index.html not found. Run npm run build.");
    }
  });
}
initDatabase().catch((dbErr) => {
  console.warn("[Database] Initial startup warning:", dbErr?.message || dbErr);
});
var startApp = () => {
  const rawPort = process.env.PORT || 3e3;
  const numericPort = Number(rawPort);
  const listenTarget = isNaN(numericPort) ? rawPort : numericPort;
  if (process.env.NODE_ENV !== "production" && !activeDist) {
    console.log("[Dev Mode] Mounting Vite development server...");
    import("vite").then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      }).then((vite) => {
        app.use(vite.middlewares);
      }).catch((e) => console.warn("[Dev Mode] Vite error:", e.message));
    });
  }
  app.listen(listenTarget, () => {
    console.log(`\u{1F680} TexMachina Server running on ${listenTarget}`);
    if (process.env.LSWS_CHILD || process.env.LSNODE_PID) {
      console.log("\u26A1 LiteSpeed environment detected.");
    }
  });
};
startApp();
if (typeof module !== "undefined" && module.exports) {
  module.exports = app;
  module.exports.default = app;
}
var server_default = app;
