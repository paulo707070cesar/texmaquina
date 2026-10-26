import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface Tenant {
  id: number;
  name: string;
  slug?: string | null;
  created_at: string;
}

export interface User {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'vendedor';
  created_at: string;
}

export interface Machine {
  id: number;
  tenant_id: number;
  name: string;
  model: string;
  description: string;
  price: number;
  image_url: string;
  status: 'disponivel' | 'vendido' | 'manutencao';
  created_at: string;
}

export interface Lead {
  id: number;
  tenant_id: number;
  client_name: string;
  client_phone: string;
  machine_id: number | null;
  status: 'novo' | 'orcamento' | 'negociacao' | 'fechado';
  notes: string;
  follow_up_date: string | null;
  created_at: string;
  machine_name?: string | null;
  machine_model?: string | null;
  machine_price?: number | null;
  machine_image?: string | null;
}

let mysqlPool: mysql.Pool | null = null;
let isMySQLConnected = false;
let dbConnectionError: string | null = null;

// Initial Fallback / In-Memory Store
const memoryTenants: Tenant[] = [
  { id: 1, name: 'TexMachina Matriz', slug: 'matriz', created_at: new Date().toISOString() }
];

const memoryUsers: User[] = [
  {
    id: 1,
    tenant_id: 1,
    name: 'Carlos Eduardo Menezes',
    email: 'admin@texmachina.com.br',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    created_at: new Date().toISOString(),
  }
];

const memoryMachines: Machine[] = [];
const memoryLeads: Lead[] = [];

let nextTenantId = 2;
let nextUserId = 2;
let nextMachineId = 1;
let nextLeadId = 1;

export async function initDatabase(): Promise<void> {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

  if (DB_HOST && DB_USER && DB_NAME) {
    try {
      const pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD || '',
        database: DB_NAME,
        port: Number(DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });

      const connection = await pool.getConnection();
      console.log('[Database] MySQL connection established (Multi-Tenant).');
      isMySQLConnected = true;
      mysqlPool = pool;
      connection.release();
      await ensureTablesCreated(pool);
    } catch (err: any) {
      console.warn('[Database] MySQL connection failed:', err.message);
      dbConnectionError = err.message;
      isMySQLConnected = false;
    }
  }
}

async function ensureTablesCreated(pool: mysql.Pool): Promise<void> {
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
  } catch (err: any) {
    console.error('[Database] Table verification failed:', err.message);
  }
}

export function getDatabaseStatus() {
  return {
    isMySQL: isMySQLConnected,
    mode: isMySQLConnected ? 'Multi-Tenant MySQL' : 'Multi-Tenant In-Memory',
    error: dbConnectionError,
    counts: {
      tenants: isMySQLConnected ? 'MySQL' : memoryTenants.length,
      users: isMySQLConnected ? 'MySQL' : memoryUsers.length,
    }
  };
}

// ----------------- REPOSITORIES (Isolated by tenant_id) -----------------

export const tenantsRepo = {
  async create(name: string): Promise<Tenant> {
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query('INSERT INTO tenants (name) VALUES (?)', [name]);
      return { id: result.insertId, name, created_at: new Date().toISOString() };
    }
    const tenant: Tenant = { id: nextTenantId++, name, created_at: new Date().toISOString() };
    memoryTenants.push(tenant);
    return tenant;
  },
  async findById(id: number): Promise<Tenant | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM tenants WHERE id = ?', [id]);
      return rows[0] || null;
    }
    return memoryTenants.find(t => t.id === id) || null;
  }
};

export const usersRepo = {
  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      return rows[0] || null;
    }
    return memoryUsers.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },
  async findById(id: number): Promise<User | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    }
    return memoryUsers.find(u => u.id === id) || null;
  },
  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [user.tenant_id, user.name, user.email.toLowerCase(), user.password_hash, user.role]
      );
      return { id: result.insertId, ...user, created_at: new Date().toISOString() };
    }
    const newUser: User = { id: nextUserId++, ...user, created_at: new Date().toISOString() };
    memoryUsers.push(newUser);
    return newUser;
  }
};

export const machinesRepo = {
  async list(tenant_id: number, filters?: { search?: string; status?: string }): Promise<Machine[]> {
    if (isMySQLConnected && mysqlPool) {
      let sql = 'SELECT * FROM machines WHERE tenant_id = ?';
      const params: any[] = [tenant_id];
      if (filters?.search) {
        sql += ' AND (name LIKE ? OR model LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      if (filters?.status && filters.status !== 'all') {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      sql += ' ORDER BY id DESC';
      const [rows]: any = await mysqlPool.query(sql, params);
      return rows;
    }
    let items = memoryMachines.filter(m => m.tenant_id === tenant_id);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(m => m.name.toLowerCase().includes(q) || m.model.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== 'all') {
      items = items.filter(m => m.status === filters.status);
    }
    return items.sort((a, b) => b.id - a.id);
  },
  async findById(tenant_id: number, id: number): Promise<Machine | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM machines WHERE tenant_id = ? AND id = ?', [tenant_id, id]);
      return rows[0] || null;
    }
    return memoryMachines.find(m => m.tenant_id === tenant_id && m.id === id) || null;
  },
  async create(data: Omit<Machine, 'id' | 'created_at'>): Promise<Machine> {
    if (isMySQLConnected && mysqlPool) {
      const [res]: any = await mysqlPool.query(
        'INSERT INTO machines (tenant_id, name, model, description, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.tenant_id, data.name, data.model, data.description, data.price, data.image_url, data.status]
      );
      return { id: res.insertId, ...data, created_at: new Date().toISOString() };
    }
    const item: Machine = { id: nextMachineId++, ...data, created_at: new Date().toISOString() };
    memoryMachines.unshift(item);
    return item;
  },
  async update(tenant_id: number, id: number, data: Partial<Machine>): Promise<Machine | null> {
    if (isMySQLConnected && mysqlPool) {
      const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id' && k !== 'created_at').map(k => `${k} = ?`);
      const values = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id' && k !== 'created_at').map(k => (data as any)[k]);
      if (fields.length === 0) return this.findById(tenant_id, id);
      values.push(tenant_id, id);
      await mysqlPool.query(`UPDATE machines SET ${fields.join(', ')} WHERE tenant_id = ? AND id = ?`, values);
      return this.findById(tenant_id, id);
    }
    const idx = memoryMachines.findIndex(m => m.tenant_id === tenant_id && m.id === id);
    if (idx === -1) return null;
    memoryMachines[idx] = { ...memoryMachines[idx], ...data };
    return memoryMachines[idx];
  },
  async delete(tenant_id: number, id: number): Promise<boolean> {
    if (isMySQLConnected && mysqlPool) {
      const [res]: any = await mysqlPool.query('DELETE FROM machines WHERE tenant_id = ? AND id = ?', [tenant_id, id]);
      return res.affectedRows > 0;
    }
    const idx = memoryMachines.findIndex(m => m.tenant_id === tenant_id && m.id === id);
    if (idx === -1) return false;
    memoryMachines.splice(idx, 1);
    return true;
  }
};

export const leadsRepo = {
  async list(tenant_id: number): Promise<Lead[]> {
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query(`
        SELECT l.*, m.name as machine_name, m.model as machine_model, m.price as machine_price, m.image_url as machine_image
        FROM leads l LEFT JOIN machines m ON l.machine_id = m.id
        WHERE l.tenant_id = ? ORDER BY l.id DESC
      `, [tenant_id]);
      return rows;
    }
    return memoryLeads.filter(l => l.tenant_id === tenant_id).map(l => {
      const m = l.machine_id ? memoryMachines.find(mx => mx.id === l.machine_id) : null;
      return { ...l, machine_name: m?.name, machine_model: m?.model, machine_price: m?.price, machine_image: m?.image_url };
    }).sort((a, b) => b.id - a.id);
  },
  async create(data: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    if (isMySQLConnected && mysqlPool) {
      const [res]: any = await mysqlPool.query(
        'INSERT INTO leads (tenant_id, client_name, client_phone, machine_id, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.tenant_id, data.client_name, data.client_phone, data.machine_id, data.status, data.notes, data.follow_up_date]
      );
      const [rows]: any = await mysqlPool.query('SELECT * FROM leads WHERE id = ?', [res.insertId]);
      return rows[0];
    }
    const item: Lead = { id: nextLeadId++, ...data, created_at: new Date().toISOString() };
    memoryLeads.unshift(item);
    return item;
  },
  async update(tenant_id: number, id: number, data: Partial<Lead>): Promise<Lead | null> {
    if (isMySQLConnected && mysqlPool) {
      const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id' && k !== 'created_at').map(k => `${k} = ?`);
      const values = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id' && k !== 'created_at').map(k => (data as any)[k]);
      values.push(tenant_id, id);
      await mysqlPool.query(`UPDATE leads SET ${fields.join(', ')} WHERE tenant_id = ? AND id = ?`, values);
      const [rows]: any = await mysqlPool.query('SELECT * FROM leads WHERE id = ?', [id]);
      return rows[0];
    }
    const idx = memoryLeads.findIndex(l => l.tenant_id === tenant_id && l.id === id);
    if (idx === -1) return null;
    memoryLeads[idx] = { ...memoryLeads[idx], ...data };
    return memoryLeads[idx];
  },
  async delete(tenant_id: number, id: number): Promise<boolean> {
    if (isMySQLConnected && mysqlPool) {
      const [res]: any = await mysqlPool.query('DELETE FROM leads WHERE tenant_id = ? AND id = ?', [tenant_id, id]);
      return res.affectedRows > 0;
    }
    const idx = memoryLeads.findIndex(l => l.tenant_id === tenant_id && l.id === id);
    if (idx === -1) return false;
    memoryLeads.splice(idx, 1);
    return true;
  }
};
