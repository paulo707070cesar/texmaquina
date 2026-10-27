import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface Tenant {
  id: number;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  catalog_public_enabled?: boolean | number;
  catalog_show_prices?: boolean | number;
  created_at: string;
}

export interface Category {
  id: number;
  tenant_id: number;
  name: string;
  image_url: string;
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
  category_id: number | null;
  name: string;
  model: string;
  description: string;
  price: number;
  image_url: string;
  status: 'disponivel' | 'vendido' | 'manutencao';
  origin: string;
  warranty: string;
  payment_type: 'a_vista' | 'financiado';
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
  { id: 1, name: 'TexMachina Matriz', slug: 'matriz', logo_url: null, catalog_public_enabled: 0, catalog_show_prices: 0, created_at: new Date().toISOString() }
];

const memoryCategories: Category[] = [
  { id: 1, tenant_id: 1, name: 'Tear Circular', image_url: '', created_at: new Date().toISOString() },
  { id: 2, tenant_id: 1, name: 'Tear Jato de Ar', image_url: '', created_at: new Date().toISOString() },
  { id: 3, tenant_id: 1, name: 'Rama Industrial', image_url: '', created_at: new Date().toISOString() },
  { id: 4, tenant_id: 1, name: 'Fiação', image_url: '', created_at: new Date().toISOString() },
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
let nextCategoryId = 5;

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
      logo_url VARCHAR(500) NULL,
      catalog_public_enabled TINYINT(1) NOT NULL DEFAULT 0,
      catalog_show_prices TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`);

    const [catalogEnabledColumns]: any = await pool.query("SHOW COLUMNS FROM tenants LIKE 'catalog_public_enabled'");
    if (catalogEnabledColumns.length === 0) {
      await pool.query('ALTER TABLE tenants ADD COLUMN catalog_public_enabled TINYINT(1) NOT NULL DEFAULT 0');
    }
    const [catalogPriceColumns]: any = await pool.query("SHOW COLUMNS FROM tenants LIKE 'catalog_show_prices'");
    if (catalogPriceColumns.length === 0) {
      await pool.query('ALTER TABLE tenants ADD COLUMN catalog_show_prices TINYINT(1) NOT NULL DEFAULT 0');
    }

    await pool.query(`CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      image_url VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (tenant_id)
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
      category_id INT NULL,
      name VARCHAR(255) NOT NULL,
      model VARCHAR(150) NOT NULL,
      description TEXT NULL,
      price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      image_url VARCHAR(500) NULL,
      status ENUM('disponivel', 'vendido', 'manutencao') NOT NULL DEFAULT 'disponivel',
      origin VARCHAR(150) NULL DEFAULT 'Brasil',
      warranty VARCHAR(150) NULL DEFAULT '6 Meses',
      payment_type ENUM('a_vista', 'financiado') NOT NULL DEFAULT 'a_vista',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (tenant_id)
    ) ENGINE=InnoDB;`);

    // Existing installations may have been created before categories were linked to machines.
    const [categoryColumns]: any = await pool.query("SHOW COLUMNS FROM machines LIKE 'category_id'");
    if (categoryColumns.length === 0) {
      await pool.query('ALTER TABLE machines ADD COLUMN category_id INT NULL AFTER tenant_id');
    }

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
      const newTenant = { id: result.insertId, name, logo_url: null, catalog_public_enabled: 0, catalog_show_prices: 0, created_at: new Date().toISOString() };
      
      // Seed default categories for new tenant
      await categoriesRepo.createBatch(newTenant.id, [
        { name: 'Tear Circular', image_url: '' },
        { name: 'Tear Jato de Ar', image_url: '' },
        { name: 'Rama Industrial', image_url: '' }
      ]);

      return newTenant;
    }
    const tenant: Tenant = { id: nextTenantId++, name, logo_url: null, catalog_public_enabled: 0, catalog_show_prices: 0, created_at: new Date().toISOString() };
    memoryTenants.push(tenant);
    return tenant;
  },
  async findById(id: number): Promise<Tenant | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM tenants WHERE id = ?', [id]);
      return rows[0] || null;
    }
    return memoryTenants.find(t => t.id === id) || null;
  },
  async update(id: number, data: Partial<Tenant>): Promise<Tenant | null> {
    if (isMySQLConnected && mysqlPool) {
      const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at').map(k => `${k} = ?`);
      const values = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at').map(k => (data as any)[k]);
      if (fields.length === 0) return this.findById(id);
      values.push(id);
      await mysqlPool.query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`, values);
      return this.findById(id);
    }
    const idx = memoryTenants.findIndex(t => t.id === id);
    if (idx === -1) return null;
    memoryTenants[idx] = { ...memoryTenants[idx], ...data };
    return memoryTenants[idx];
  }
};

export const categoriesRepo = {
  async list(tenant_id: number): Promise<Category[]> {
    if (isMySQLConnected && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM categories WHERE tenant_id = ? ORDER BY name ASC', [tenant_id]);
      return rows;
    }
    return memoryCategories.filter(c => c.tenant_id === tenant_id).sort((a, b) => a.name.localeCompare(b.name));
  },
  async create(data: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    if (isMySQLConnected && mysqlPool) {
      const [res]: any = await mysqlPool.query(
        'INSERT INTO categories (tenant_id, name, image_url) VALUES (?, ?, ?)',
        [data.tenant_id, data.name, data.image_url]
      );
      return { id: res.insertId, ...data, created_at: new Date().toISOString() };
    }
    const item: Category = { id: nextCategoryId++, ...data, created_at: new Date().toISOString() };
    memoryCategories.push(item);
    return item;
  },
  async createBatch(tenant_id: number, categories: { name: string, image_url: string }[]): Promise<void> {
    for (const cat of categories) {
      await this.create({ tenant_id, ...cat });
    }
  },
  async delete(tenant_id: number, id: number): Promise<boolean> {
    if (isMySQLConnected && mysqlPool) {
      const [res]: any = await mysqlPool.query('DELETE FROM categories WHERE tenant_id = ? AND id = ?', [tenant_id, id]);
      return res.affectedRows > 0;
    }
    const idx = memoryCategories.findIndex(c => c.tenant_id === tenant_id && c.id === id);
    if (idx === -1) return false;
    memoryCategories.splice(idx, 1);
    return true;
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
        'INSERT INTO machines (tenant_id, category_id, name, model, description, price, image_url, status, origin, warranty, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data.tenant_id, data.category_id || null, data.name, data.model, data.description, data.price, data.image_url, data.status, data.origin || 'Brasil', data.warranty || '6 Meses', data.payment_type || 'a_vista']
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
