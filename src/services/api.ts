import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token in request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('texmachina_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle authentication expiration (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Only clear and redirect if we had a token and it was rejected
      const hadToken = !!localStorage.getItem('texmachina_token');
      if (hadToken && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('texmachina_token');
        localStorage.removeItem('texmachina_user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  tenant_id: number;
  tenant_name: string;
  name: string;
  email: string;
  role: 'admin' | 'vendedor';
  tenant_logo?: string | null;
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
}

export interface Category {
  id: number;
  tenant_id: number;
  name: string;
  image_url: string;
}

export interface Machine {
  id: number;
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

export interface DashboardStats {
  totalMachines: number;
  availableMachines: number;
  soldMachines: number;
  maintenanceMachines: number;
  totalInventoryValue: number;
  availableInventoryValue: number;
  totalLeads: number;
  activeLeads: number;
  closedLeads: number;
  pipelineValue: number;
  closedRevenue: number;
  leadsByStatus: {
    novo: number;
    orcamento: number;
    negociacao: number;
    fechado: number;
  };
  recentLeads: Lead[];
}

export interface SystemStatus {
  isMySQL: boolean;
  mode: string;
  error: string | null;
  config: {
    host: string;
    database: string;
    user: string;
  };
  counts: {
    users: number | string;
    machines: number | string;
    leads: number | string;
  };
  nodeVersion: string;
  environment: string;
  serverPort: number | string;
}

// API methods
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ token: string; user: User; message: string }>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { name: string; email: string; password: string; company_name: string }) => {
    const res = await api.post<{ token: string; user: User; message: string }>('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
};

export const machinesApi = {
  list: async (params?: { search?: string; status?: string }) => {
    const res = await api.get<Machine[]>('/machines', { params });
    return res.data;
  },
  create: async (data: Omit<Machine, 'id' | 'created_at'>) => {
    const res = await api.post<Machine>('/machines', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Omit<Machine, 'id' | 'created_at'>>) => {
    const res = await api.put<Machine>(`/machines/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete<{ message: string; id: number }>(`/machines/${id}`);
    return res.data;
  },
};

export const leadsApi = {
  list: async () => {
    const res = await api.get<Lead[]>('/leads');
    return res.data;
  },
  create: async (data: {
    client_name: string;
    client_phone: string;
    machine_id?: number | null;
    status: 'novo' | 'orcamento' | 'negociacao' | 'fechado';
    notes?: string;
    follow_up_date?: string | null;
  }) => {
    const res = await api.post<Lead>('/leads', data);
    return res.data;
  },
  update: async (
    id: number,
    data: Partial<{
      client_name: string;
      client_phone: string;
      machine_id: number | null;
      status: 'novo' | 'orcamento' | 'negociacao' | 'fechado';
      notes: string;
      follow_up_date: string | null;
    }>
  ) => {
    const res = await api.put<Lead>(`/leads/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete<{ message: string; id: number }>(`/leads/${id}`);
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};

export const settingsApi = {
  get: async () => {
    const res = await api.get<Tenant>('/settings');
    return res.data;
  },
  update: async (data: { name: string; logo_url?: string | null }) => {
    const res = await api.put<Tenant>('/settings', data);
    return res.data;
  },
};

export const categoriesApi = {
  list: async () => {
    const res = await api.get<Category[]>('/categories');
    return res.data;
  },
  create: async (data: { name: string; image_url: string }) => {
    const res = await api.post<Category>('/categories', data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

export const systemApi = {
  getStatus: async () => {
    const res = await api.get<SystemStatus>('/system/status');
    return res.data;
  },
  getSchemaSql: async () => {
    const res = await api.get<string>('/system/schema-sql', { responseType: 'text' });
    return res.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    // The shared Axios instance defaults to application/json.
    // Override it for FormData so the browser/Axios can add the multipart boundary.
    const res = await api.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!res.data?.url) {
      throw new Error('O servidor não retornou o endereço da imagem.');
    }

    return res.data;
  },
};

export default api;
