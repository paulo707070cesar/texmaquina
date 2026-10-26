import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'vendedor';
  created_at: string;
}

export interface Machine {
  id: number;
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

// Initial Fallback / In-Memory Store (Mirrors MySQL tables identically)
const memoryUsers: User[] = [
  {
    id: 1,
    name: 'Carlos Eduardo Menezes',
    email: 'admin@texmachina.com.br',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    name: 'Renata Silveira',
    email: 'vendedor@texmachina.com.br',
    password_hash: bcrypt.hashSync('vendedor123', 10),
    role: 'vendedor',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    name: 'Marcio Zanetti',
    email: 'marcio.vendas@texmachina.com.br',
    password_hash: bcrypt.hashSync('vendedor123', 10),
    role: 'vendedor',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

const memoryMachines: Machine[] = [
  {
    id: 1,
    name: 'Mayer & Cie Relanit 3.2 II',
    model: 'Single Jersey E28',
    description: 'Tear circular de alta rotação para malharia refinada. Diâmetro 34 polegadas, 96 alimentadores com alimentadores Memminger MPF, inversor de frequência e painel digital com controle de tensão.',
    price: 420000.0,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
    status: 'disponivel',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    name: 'Toyota JAT810 Air Jet Loom',
    model: 'JAT810-190 Dobby',
    description: 'Tear plano a jato de ar de altíssima produtividade. Largura útil de 190 cm, maquineta eletrônica Staubli, velocidade operacional de até 1.250 RPM. Ideal para tecidos planos leves e médios.',
    price: 340000.0,
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=900&q=80',
    status: 'disponivel',
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    name: 'Monforts Montex 6500 Stenter Frame',
    model: 'Montex 6500 Gas 5C',
    description: 'Rama industrial para termofixação, secagem e acabamento contínuo de tecidos. 5 câmaras a gás GLP, largura operacional útil de 2.400 mm, automação completa Qualitex PLC.',
    price: 1280000.0,
    image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80',
    status: 'manutencao',
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    name: 'Rieter G36 Spun Yarn Ring Frame',
    model: 'G36 1200 Spindles',
    description: 'Fiação de anel contínua para fios finos e cardados. 1.200 fusos, anel de 42 mm, sistema automático SERVOgrip de doffing e controle eletrônico de estiragem.',
    price: 890000.0,
    image_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
    status: 'disponivel',
    created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 5,
    name: 'Picanol OmniPlus-i TC Connect 220',
    model: 'OmniPlus-i 220cm',
    description: 'Tear a jato de ar de última geração com interface digital BlueTouch, 4 cores smart, monitoramento de consumo de ar comprimido por sensor térmico.',
    price: 510000.0,
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80',
    status: 'vendido',
    created_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 6,
    name: 'Dornier P2 Rapier Weaving Machine',
    model: 'P2 Type TFN',
    description: 'Tear de pinças rígidas para tecidos técnicos, fibras sintéticas e aramidas. Largura útil 260 cm com cala limpa para máxima precisão de trama.',
    price: 750000.0,
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80',
    status: 'disponivel',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
];

let nextMachineId = 7;
let nextLeadId = 7;
let nextUserId = 4;

const memoryLeads: Lead[] = [
  {
    id: 1,
    client_name: 'Malharia Santa Catarina Ltda (Sr. Roberto)',
    client_phone: '+55 (47) 99881-2244',
    machine_id: 1,
    status: 'novo',
    notes: 'Cliente solicitou catálogo técnico com tabela de rendimento de malha em poliéster/elastano. Agendar ligação preliminar.',
    follow_up_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    client_name: 'Têxtil Vale do Itajaí S/A (Dra. Juliana)',
    client_phone: '+55 (47) 99123-4567',
    machine_id: 2,
    status: 'orcamento',
    notes: 'Enviada proposta formal com desconto de 5% à vista ou financiamento FINAME em 36 parcelas. Aguardando parecer da diretoria.',
    follow_up_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    client_name: 'Fiação & Tecelagem Paulista (Eng. Hamilton)',
    client_phone: '+55 (19) 98765-4321',
    machine_id: 4,
    status: 'negociacao',
    notes: 'Visita técnica realizada no parque fabril em Americana/SP. Em negociação final sobre frete industrial e comissionamento no local.',
    follow_up_date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    client_name: 'Coteminas Indústria Têxtil (Marcos Bastos)',
    client_phone: '+55 (38) 99712-3300',
    machine_id: 5,
    status: 'fechado',
    notes: 'Contrato assinado via DocuSign. Pagamento do sinal de 40% confirmado, envio da máquina agendado para transportadora especializada.',
    follow_up_date: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 5,
    client_name: 'Tecidos Nobres do Nordeste (Felipe Arcoverde)',
    client_phone: '+55 (81) 98442-1199',
    machine_id: 6,
    status: 'novo',
    notes: 'Demonstrou interesse na máquina Dornier P2 para produção de tecidos industriais de segurança.',
    follow_up_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 6,
    client_name: 'Tinturaria & Acabamento Rio Claro (Alberto)',
    client_phone: '+55 (19) 97100-8822',
    machine_id: 3,
    status: 'negociacao',
    notes: 'Aguardando liberação de vistoria preventiva da câmara de aquecimento da rama Montex 6500.',
    follow_up_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
];

// Initialize MySQL pool if env credentials exist
export async function initDatabase(): Promise<void> {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

  if (DB_HOST && DB_USER && DB_NAME) {
    try {
      console.log(`[Database] Attempting connection to MySQL at ${DB_HOST}:${DB_PORT || 3306}/${DB_NAME}...`);
      const pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD || '',
        database: DB_NAME,
        port: Number(DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log('[Database] MySQL connection established successfully!');
      isMySQLConnected = true;
      mysqlPool = pool;
      connection.release();

      // Ensure tables exist in MySQL
      await ensureTablesCreated(pool);
    } catch (err: any) {
      console.warn('[Database] MySQL connection failed. Error:', err.message);
      dbConnectionError = err.message;
      isMySQLConnected = false;
      console.log('[Database] Operating with fallback In-Memory persistence (Full CRUD active).');
    }
  } else {
    console.log('[Database] No MySQL DB_HOST/DB_NAME environment variables specified.');
    console.log('[Database] Operating with fallback In-Memory persistence (Hostinger ready with schema.sql).');
  }
}

async function ensureTablesCreated(pool: mysql.Pool): Promise<void> {
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
    console.log('[Database] Verified MySQL tables structure.');
  } catch (err: any) {
    console.error('[Database] Failed to verify tables:', err.message);
  }
}

export function getDatabaseStatus() {
  return {
    isMySQL: isMySQLConnected,
    mode: isMySQLConnected ? 'MySQL Connection Pool' : 'In-Memory Enterprise Store (Hostinger Ready)',
    error: dbConnectionError,
    config: {
      host: process.env.DB_HOST || 'Not configured (using memory store)',
      database: process.env.DB_NAME || 'texmachina_db',
      user: process.env.DB_USER || 'root',
    },
    counts: {
      users: isMySQLConnected ? 'MySQL' : memoryUsers.length,
      machines: isMySQLConnected ? 'MySQL' : memoryMachines.length,
      leads: isMySQLConnected ? 'MySQL' : memoryLeads.length,
    },
  };
}

// ----------------- USERS REPOSITORY -----------------
export const usersRepo = {
  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
        'SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1',
        [cleanEmail]
      );
      if (rows.length > 0) return rows[0] as User;
      return null;
    }
    const found = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    return found || null;
  },

  async findById(id: number): Promise<User | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
        'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length > 0) return rows[0] as User;
      return null;
    }
    const found = memoryUsers.find((u) => u.id === id);
    return found ? { ...found } : null;
  },

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email.toLowerCase(), user.password_hash, user.role]
      );
      return {
        id: result.insertId,
        name: user.name,
        email: user.email.toLowerCase(),
        password_hash: user.password_hash,
        role: user.role,
        created_at: new Date().toISOString(),
      };
    }
    const newUser: User = {
      id: nextUserId++,
      name: user.name,
      email: user.email.toLowerCase(),
      password_hash: user.password_hash,
      role: user.role,
      created_at: new Date().toISOString(),
    };
    memoryUsers.push(newUser);
    return newUser;
  },
};

// ----------------- MACHINES REPOSITORY -----------------
export const machinesRepo = {
  async list(filters?: { search?: string; status?: string }): Promise<Machine[]> {
    if (isMySQLConnected && mysqlPool) {
      let query = 'SELECT * FROM machines WHERE 1=1';
      const params: any[] = [];

      if (filters?.search) {
        query += ' AND (name LIKE ? OR model LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters?.status && filters.status !== 'all') {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY id DESC';
      const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(query, params);
      return rows as Machine[];
    }

    let items = [...memoryMachines];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    if (filters?.status && filters.status !== 'all') {
      items = items.filter((m) => m.status === filters.status);
    }
    return items.sort((a, b) => b.id - a.id);
  },

  async findById(id: number): Promise<Machine | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
        'SELECT * FROM machines WHERE id = ? LIMIT 1',
        [id]
      );
      return rows.length > 0 ? (rows[0] as Machine) : null;
    }
    const found = memoryMachines.find((m) => m.id === id);
    return found ? { ...found } : null;
  },

  async create(data: Omit<Machine, 'id' | 'created_at'>): Promise<Machine> {
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO machines (name, model, description, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [data.name, data.model, data.description, data.price, data.image_url, data.status]
      );
      return {
        id: result.insertId,
        ...data,
        created_at: new Date().toISOString(),
      };
    }
    const item: Machine = {
      id: nextMachineId++,
      name: data.name,
      model: data.model,
      description: data.description,
      price: Number(data.price),
      image_url: data.image_url,
      status: data.status,
      created_at: new Date().toISOString(),
    };
    memoryMachines.unshift(item);
    return item;
  },

  async update(id: number, data: Partial<Omit<Machine, 'id' | 'created_at'>>): Promise<Machine | null> {
    if (isMySQLConnected && mysqlPool) {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
      if (data.model !== undefined) { fields.push('model = ?'); values.push(data.model); }
      if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
      if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
      if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
      if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      await mysqlPool.query(`UPDATE machines SET ${fields.join(', ')} WHERE id = ?`, values);
      return this.findById(id);
    }

    const index = memoryMachines.findIndex((m) => m.id === id);
    if (index === -1) return null;
    memoryMachines[index] = {
      ...memoryMachines[index],
      ...data,
      price: data.price !== undefined ? Number(data.price) : memoryMachines[index].price,
    };
    return memoryMachines[index];
  },

  async delete(id: number): Promise<boolean> {
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query('DELETE FROM machines WHERE id = ?', [id]);
      return result.affectedRows > 0;
    }
    const index = memoryMachines.findIndex((m) => m.id === id);
    if (index === -1) return false;
    memoryMachines.splice(index, 1);
    // nullify in leads
    memoryLeads.forEach((lead) => {
      if (lead.machine_id === id) {
        lead.machine_id = null;
      }
    });
    return true;
  },
};

// ----------------- LEADS REPOSITORY -----------------
export const leadsRepo = {
  async list(): Promise<Lead[]> {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(`
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
      return rows as Lead[];
    }

    return memoryLeads
      .map((lead) => {
        const machine = lead.machine_id ? memoryMachines.find((m) => m.id === lead.machine_id) : null;
        return {
          ...lead,
          machine_name: machine ? machine.name : null,
          machine_model: machine ? machine.model : null,
          machine_price: machine ? machine.price : null,
          machine_image: machine ? machine.image_url : null,
        };
      })
      .sort((a, b) => b.id - a.id);
  },

  async findById(id: number): Promise<Lead | null> {
    if (isMySQLConnected && mysqlPool) {
      const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
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
      return rows.length > 0 ? (rows[0] as Lead) : null;
    }

    const lead = memoryLeads.find((l) => l.id === id);
    if (!lead) return null;
    const machine = lead.machine_id ? memoryMachines.find((m) => m.id === lead.machine_id) : null;
    return {
      ...lead,
      machine_name: machine ? machine.name : null,
      machine_model: machine ? machine.model : null,
      machine_price: machine ? machine.price : null,
      machine_image: machine ? machine.image_url : null,
    };
  },

  async create(data: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const machineId = data.machine_id ? Number(data.machine_id) : null;
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query(
        'INSERT INTO leads (client_name, client_phone, machine_id, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?)',
        [data.client_name, data.client_phone, machineId, data.status, data.notes, data.follow_up_date || null]
      );
      const inserted = await this.findById(result.insertId);
      return inserted!;
    }

    const newLead: Lead = {
      id: nextLeadId++,
      client_name: data.client_name,
      client_phone: data.client_phone,
      machine_id: machineId,
      status: data.status,
      notes: data.notes || '',
      follow_up_date: data.follow_up_date || null,
      created_at: new Date().toISOString(),
    };
    memoryLeads.unshift(newLead);
    const machine = machineId ? memoryMachines.find((m) => m.id === machineId) : null;
    return {
      ...newLead,
      machine_name: machine ? machine.name : null,
      machine_model: machine ? machine.model : null,
      machine_price: machine ? machine.price : null,
      machine_image: machine ? machine.image_url : null,
    };
  },

  async update(id: number, data: Partial<Omit<Lead, 'id' | 'created_at'>>): Promise<Lead | null> {
    if (isMySQLConnected && mysqlPool) {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.client_name !== undefined) { fields.push('client_name = ?'); values.push(data.client_name); }
      if (data.client_phone !== undefined) { fields.push('client_phone = ?'); values.push(data.client_phone); }
      if (data.machine_id !== undefined) {
        fields.push('machine_id = ?');
        values.push(data.machine_id ? Number(data.machine_id) : null);
      }
      if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
      if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
      if (data.follow_up_date !== undefined) { fields.push('follow_up_date = ?'); values.push(data.follow_up_date || null); }

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      await mysqlPool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);
      return this.findById(id);
    }

    const index = memoryLeads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    memoryLeads[index] = {
      ...memoryLeads[index],
      ...data,
      machine_id: data.machine_id !== undefined ? (data.machine_id ? Number(data.machine_id) : null) : memoryLeads[index].machine_id,
    };
    return this.findById(id);
  },

  async delete(id: number): Promise<boolean> {
    if (isMySQLConnected && mysqlPool) {
      const [result]: any = await mysqlPool.query('DELETE FROM leads WHERE id = ?', [id]);
      return result.affectedRows > 0;
    }
    const index = memoryLeads.findIndex((l) => l.id === id);
    if (index === -1) return false;
    memoryLeads.splice(index, 1);
    return true;
  },
};
