import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { initDatabase, getDatabaseStatus, usersRepo, machinesRepo, leadsRepo, tenantsRepo, categoriesRepo } from './server/db.js';

dotenv.config();

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve('.');

// Ensure upload directory exists
const uploadDir = path.join(currentDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `machine-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas.'));
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'texmachina_super_secure_jwt_secret_key_2025';

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// ----------------- UPLOAD ROUTE -----------------
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});


// ----------------- JWT AUTHENTICATION MIDDLEWARE -----------------
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    tenant_id: number;
    name: string;
    email: string;
    role: 'admin' | 'vendedor';
  };
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Faça login para continuar.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Sessão expirada. Faça login novamente.' });
      return;
    }
    req.user = decoded;
    next();
  });
}

// ----------------- AUTH ROUTES -----------------
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, company_name } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }

    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    // 1. Create a NEW TENANT for this specific account
    const newTenant = await tenantsRepo.create(company_name || `Empresa de ${name}`);

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await usersRepo.create({
      tenant_id: newTenant.id,
      name,
      email,
      password_hash,
      role: 'admin', // First user is always admin of their tenant
    });

    const token = jwt.sign(
      { 
        id: newUser.id, 
        tenant_id: newUser.tenant_id, 
        tenant_name: newTenant.name,
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Conta e empresa criadas com sucesso.',
      token,
      user: { 
        id: newUser.id, 
        tenant_id: newUser.tenant_id,
        tenant_name: newTenant.name,
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        tenant_logo: newTenant.logo_url
      },
    });
  } catch (error: any) {
    console.error('Reg error:', error);
    res.status(500).json({ error: 'Erro ao cadastrar.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await usersRepo.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const tenant = await tenantsRepo.findById(user.tenant_id);

    const token = jwt.sign(
      { 
        id: user.id, 
        tenant_id: user.tenant_id, 
        tenant_name: tenant?.name || 'Empresa',
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || 'Empresa',
        name: user.name, 
        email: user.email, 
        role: user.role,
        tenant_logo: tenant?.logo_url
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro no login.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await usersRepo.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const tenant = await tenantsRepo.findById(user.tenant_id);
    res.json({ 
      user: { 
        id: user.id, 
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || 'Empresa',
        name: user.name, 
        email: user.email, 
        role: user.role,
        tenant_logo: tenant?.logo_url
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao obter dados.' });
  }
});

// ----------------- MACHINES CRUD ROUTES (Tenant Restricted) -----------------
app.get('/api/machines', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const machines = await machinesRepo.list(req.user!.tenant_id, {
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
    });
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar máquinas.' });
  }
});

app.post('/api/machines', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const machine = await machinesRepo.create({
      ...req.body,
      tenant_id: req.user!.tenant_id,
      price: parseFloat(req.body.price) || 0,
    });
    res.status(201).json(machine);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar.' });
  }
});

app.put('/api/machines/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await machinesRepo.update(req.user!.tenant_id, parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Não encontrada.' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar.' });
  }
});

app.delete('/api/machines/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await machinesRepo.delete(req.user!.tenant_id, parseInt(req.params.id));
    if (!success) return res.status(404).json({ error: 'Não encontrada.' });
    res.json({ message: 'Excluída.', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir.' });
  }
});

// ----------------- LEADS CRUD ROUTES (Tenant Restricted) -----------------
app.get('/api/leads', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leads = await leadsRepo.list(req.user!.tenant_id);
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar leads.' });
  }
});

app.post('/api/leads', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lead = await leadsRepo.create({
      ...req.body,
      tenant_id: req.user!.tenant_id,
      machine_id: req.body.machine_id ? parseInt(req.body.machine_id) : null,
    });
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar lead.' });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await leadsRepo.update(req.user!.tenant_id, parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Lead não encontrado.' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar.' });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await leadsRepo.delete(req.user!.tenant_id, parseInt(req.params.id));
    if (!success) return res.status(404).json({ error: 'Lead não encontrado.' });
    res.json({ message: 'Lead removido.', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao remover lead.' });
  }
});

// ----------------- SETTINGS & TENANT MGMT -----------------
app.get('/api/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenant = await tenantsRepo.findById(req.user!.tenant_id);
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

app.put('/api/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, logo_url } = req.body;
    const updated = await tenantsRepo.update(req.user!.tenant_id, { name, logo_url });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// ----------------- CATEGORIES ROUTES -----------------
app.get('/api/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await categoriesRepo.list(req.user!.tenant_id);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

app.post('/api/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = await categoriesRepo.create({
      ...req.body,
      tenant_id: req.user!.tenant_id,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await categoriesRepo.delete(req.user!.tenant_id, parseInt(req.params.id));
    if (!success) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ message: 'Categoria excluída.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
});

// ----------------- DASHBOARD STATS (Tenant Restricted) -----------------
app.get('/api/dashboard/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenant_id = req.user!.tenant_id;
    const [machines, leads] = await Promise.all([
      machinesRepo.list(tenant_id),
      leadsRepo.list(tenant_id),
    ]);

    const totalMachines = machines.length;
    const availableMachines = machines.filter(m => m.status === 'disponivel').length;
    const totalInventoryValue = machines.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const activeLeads = leads.filter(l => l.status !== 'fechado').length;
    const pipelineValue = leads.filter(l => l.status !== 'fechado').reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);

    res.json({
      totalMachines,
      availableMachines,
      totalInventoryValue,
      totalLeads: leads.length,
      activeLeads,
      pipelineValue,
      leadsByStatus: {
        novo: leads.filter(l => l.status === 'novo').length,
        orcamento: leads.filter(l => l.status === 'orcamento').length,
        negociacao: leads.filter(l => l.status === 'negociacao').length,
        fechado: leads.filter(l => l.status === 'fechado').length,
      },
      recentLeads: leads.slice(0, 5),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
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



// ----------------- STATIC FILES & PRODUCTION SPA ROUTING -----------------
const prodDistPath = path.resolve(currentDir, 'dist');
const clientDistPath = path.resolve(currentDir, '../client/dist');
const activeDist = fs.existsSync(prodDistPath) ? prodDistPath : fs.existsSync(clientDistPath) ? clientDistPath : null;

if (activeDist) {
  console.log(`[Hostinger Production] Serving static files from ${activeDist}`);
  app.use(express.static(activeDist));

  // Catch-all route to handle React Router client-side history navigation
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexFile = path.join(activeDist, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send('TexMachina index.html not found. Run npm run build.');
    }
  });
}

// Start database connection in background (does not block server ready state)
initDatabase().catch((dbErr: any) => {
  console.warn('[Database] Initial startup warning:', dbErr?.message || dbErr);
});

// ----------------- STARTUP & LISTENING -----------------
const startApp = () => {
  const rawPort = process.env.PORT || 3000;
  const numericPort = Number(rawPort);
  const listenTarget = isNaN(numericPort) ? rawPort : numericPort;

  // Mount Vite development server only if NOT in production and NO build exists
  if (process.env.NODE_ENV !== 'production' && !activeDist) {
    console.log('[Dev Mode] Mounting Vite development server...');
    import('vite').then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then((vite) => {
        app.use(vite.middlewares);
      }).catch((e) => console.warn('[Dev Mode] Vite error:', e.message));
    });
  }

  app.listen(listenTarget, () => {
    console.log(`🚀 TexMachina Server running on ${listenTarget}`);
    if (process.env.LSWS_CHILD || process.env.LSNODE_PID) {
      console.log('⚡ LiteSpeed environment detected.');
    }
  });
};

// Execute startup
startApp();

// Critical for LiteSpeed lsnode.js / cPanel / Phusion Passenger integration
// We export the app directly as module.exports for CJS compatibility
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = app;
  // @ts-ignore
  module.exports.default = app;
}

export default app;


