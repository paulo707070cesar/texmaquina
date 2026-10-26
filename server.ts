import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, getDatabaseStatus, usersRepo, machinesRepo, leadsRepo } from './server/db.js';

dotenv.config();

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve('.');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'texmachina_super_secure_jwt_secret_key_2025';

// Middlewares
app.use(cors());
app.use(express.json());

// ----------------- JWT AUTHENTICATION MIDDLEWARE -----------------
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'vendedor';
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação não fornecido. Faça login para continuar.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Sessão expirada ou token inválido. Faça login novamente.' });
      return;
    }
    req.user = decoded;
    next();
  });
}

// ----------------- AUTH ROUTES -----------------
// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado no sistema.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'admin' ? 'admin' : 'vendedor';

    const newUser = await usersRepo.create({
      name,
      email,
      password_hash,
      role: assignedRole,
    });

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Informe e-mail e senha.' });
      return;
    }

    const user = await usersRepo.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno ao realizar autenticação.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await usersRepo.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao obter dados do usuário.' });
  }
});

// ----------------- MACHINES CRUD ROUTES -----------------
// GET /api/machines
app.get('/api/machines', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const machines = await machinesRepo.list({
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
    });
    res.json(machines);
  } catch (error: any) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ error: 'Erro ao buscar catálogo de máquinas.' });
  }
});

// POST /api/machines
app.post('/api/machines', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, model, description, price, image_url, status } = req.body;

    if (!name || !model || price === undefined) {
      res.status(400).json({ error: 'Nome da máquina, modelo e preço são obrigatórios.' });
      return;
    }

    const validStatus = ['disponivel', 'vendido', 'manutencao'].includes(status) ? status : 'disponivel';
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Preço inválido.' });
      return;
    }

    const machine = await machinesRepo.create({
      name,
      model,
      description: description || '',
      price: parsedPrice,
      image_url: image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
      status: validStatus,
    });

    res.status(201).json(machine);
  } catch (error: any) {
    console.error('Error creating machine:', error);
    res.status(500).json({ error: 'Erro ao cadastrar máquina.' });
  }
});

// PUT /api/machines/:id
app.put('/api/machines/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { name, model, description, price, image_url, status } = req.body;

    const existing = await machinesRepo.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Máquina não encontrada.' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (model !== undefined) updateData.model = model;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (status !== undefined) {
      if (!['disponivel', 'vendido', 'manutencao'].includes(status)) {
        res.status(400).json({ error: 'Status de máquina inválido.' });
        return;
      }
      updateData.status = status;
    }

    const updated = await machinesRepo.update(id, updateData);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating machine:', error);
    res.status(500).json({ error: 'Erro ao atualizar máquina.' });
  }
});

// DELETE /api/machines/:id
app.delete('/api/machines/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const success = await machinesRepo.delete(id);
    if (!success) {
      res.status(404).json({ error: 'Máquina não encontrada para exclusão.' });
      return;
    }

    res.json({ message: 'Máquina excluída com sucesso.', id });
  } catch (error: any) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ error: 'Erro ao excluir máquina.' });
  }
});

// ----------------- LEADS CRUD ROUTES -----------------
// GET /api/leads
app.get('/api/leads', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const leads = await leadsRepo.list();
    res.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads e pipeline.' });
  }
});

// POST /api/leads
app.post('/api/leads', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { client_name, client_phone, machine_id, status, notes, follow_up_date } = req.body;

    if (!client_name || !client_phone) {
      res.status(400).json({ error: 'Nome do cliente e telefone de contato são obrigatórios.' });
      return;
    }

    const validStatus = ['novo', 'orcamento', 'negociacao', 'fechado'].includes(status) ? status : 'novo';

    const lead = await leadsRepo.create({
      client_name,
      client_phone,
      machine_id: machine_id ? parseInt(machine_id, 10) : null,
      status: validStatus,
      notes: notes || '',
      follow_up_date: follow_up_date || null,
    });

    res.status(201).json(lead);
  } catch (error: any) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead de vendas.' });
  }
});

// PUT /api/leads/:id (Crucial for Kanban drag and drop)
app.put('/api/leads/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const { client_name, client_phone, machine_id, status, notes, follow_up_date } = req.body;

    const existing = await leadsRepo.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Lead não encontrado.' });
      return;
    }

    const updateData: any = {};
    if (client_name !== undefined) updateData.client_name = client_name;
    if (client_phone !== undefined) updateData.client_phone = client_phone;
    if (machine_id !== undefined) updateData.machine_id = machine_id ? parseInt(machine_id, 10) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (follow_up_date !== undefined) updateData.follow_up_date = follow_up_date;
    if (status !== undefined) {
      if (!['novo', 'orcamento', 'negociacao', 'fechado'].includes(status)) {
        res.status(400).json({ error: 'Status de funil inválido.' });
        return;
      }
      updateData.status = status;
    }

    const updated = await leadsRepo.update(id, updateData);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead.' });
  }
});

// DELETE /api/leads/:id
app.delete('/api/leads/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido.' });
      return;
    }

    const success = await leadsRepo.delete(id);
    if (!success) {
      res.status(404).json({ error: 'Lead não encontrado.' });
      return;
    }

    res.json({ message: 'Lead removido com sucesso.', id });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Erro ao remover lead.' });
  }
});

// ----------------- DASHBOARD STATS -----------------
// GET /api/dashboard/stats
app.get('/api/dashboard/stats', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const machines = await machinesRepo.list();
    const leads = await leadsRepo.list();

    const totalMachines = machines.length;
    const availableMachines = machines.filter((m) => m.status === 'disponivel').length;
    const soldMachines = machines.filter((m) => m.status === 'vendido').length;
    const maintenanceMachines = machines.filter((m) => m.status === 'manutencao').length;

    const totalInventoryValue = machines.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const availableInventoryValue = machines
      .filter((m) => m.status === 'disponivel')
      .reduce((sum, m) => sum + (Number(m.price) || 0), 0);

    const activeLeads = leads.filter((l) => l.status !== 'fechado').length;
    const closedLeads = leads.filter((l) => l.status === 'fechado').length;

    // Pipeline value
    const pipelineValue = leads
      .filter((l) => l.status !== 'fechado')
      .reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);

    const closedRevenue = leads
      .filter((l) => l.status === 'fechado')
      .reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);

    // Group leads by status
    const leadsByStatus = {
      novo: leads.filter((l) => l.status === 'novo').length,
      orcamento: leads.filter((l) => l.status === 'orcamento').length,
      negociacao: leads.filter((l) => l.status === 'negociacao').length,
      fechado: closedLeads,
    };

    // Recent leads
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
      recentLeads,
    });
  } catch (error: any) {
    console.error('Error computing dashboard stats:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas do painel.' });
  }
});

// ----------------- SYSTEM & HOSTINGER DIAGNOSTICS -----------------
app.get('/api/system/status', (_req: Request, res: Response) => {
  const status = getDatabaseStatus();
  res.json({
    ...status,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    serverPort: PORT,
  });
});

app.get('/api/system/schema-sql', (_req: Request, res: Response) => {
  const schemaPath = path.resolve(currentDir, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(schemaPath);
  } else {
    res.status(404).send('schema.sql not found');
  }
});

app.get('/api/system/download-env', (_req: Request, res: Response) => {
  const envContent = `# =====================================================================
# TexMachina OS - Configuração Hostinger (Node.js + MySQL)
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
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=".env"');
  res.send(envContent);
});

// ----------------- PRODUCTION / VITE MIDDLEWARE -----------------
async function startServer() {
  // Initialize Database (MySQL pool or fallback) inside async function (No top-level await)
  try {
    await initDatabase();
  } catch (dbErr: any) {
    console.warn('[Database] Initial startup warning:', dbErr.message);
  }

  const isProd = process.env.NODE_ENV === 'production';

  // Check both possible production build outputs
  const prodDistPath = path.resolve(currentDir, 'dist');
  const clientDistPath = path.resolve(currentDir, '../client/dist');
  const activeDist = fs.existsSync(prodDistPath) ? prodDistPath : fs.existsSync(clientDistPath) ? clientDistPath : null;

  if (isProd && activeDist) {
    console.log(`[Hostinger Production] Serving static files from ${activeDist}`);
    app.use(express.static(activeDist));

    // Catch-all route to handle React Router client-side history navigation
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(activeDist, 'index.html'));
    });
  } else {
    // In development mode, mount Vite middlewares
    console.log('[Dev Mode] Mounting Vite development server middlewares...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 TexMachina Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 API endpoints ready at http://localhost:${PORT}/api/*`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
});

export default app;
