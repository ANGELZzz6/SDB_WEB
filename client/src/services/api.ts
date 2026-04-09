import type {
  Employee,
  Service,
  Appointment,
  BlockedSlot,
  Settings,
  ApiResponse,
  GalleryCategory,
  GalleryItem,
  SiteConfig
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Función auxiliar para manejar la respuesta del servidor.
 * Atrapa el 401 para hacer un logout automático y extraer campos de error en español.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  let body: any;
  try {
    body = await res.json();
  } catch (e) {
    if (!res.ok) {
      throw new Error(`Error de red o servidor (${res.status})`);
    }
    return {} as T;
  }

  // Manejo de expiración de token o credenciales inválidas
  if (res.status === 401) {
    localStorage.removeItem('token');
    // Prevenir redirección en la propia vista de login
    if (window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
    throw new Error(body.message || 'Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
  }

  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Error en la solicitud (${res.status})`);
  }

  return body as T;
}

/**
 * Función base genérica para fetch invocando el JWT almacenado.
 */
export const api = {
  baseUrl: API_BASE,

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
      return await handleResponse<T>(res);
    } catch (error: any) {
      // Manejar error para no reventar la app con promesas no capturadas
      console.error('API Error:', error.message);
      throw error;
    }
  },

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  },

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
};

// ─── SERVICIOS ESPECÍFICOS DE LA APLICACIÓN ─────────────────────────────────

export const authService = {
  login: (credentials: any) => api.post<ApiResponse<{ token: string, user: any }>>('/auth/login', credentials),
  logout: async () => {
    try {
      await api.post<ApiResponse<null>>('/auth/logout', {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
    }
  },
  getMe: () => api.get<ApiResponse<any>>('/auth/me'),
  createEmployeeAccount: (data: any) => api.post<ApiResponse<any>>('/auth/create-employee-account', data),
  resetEmployeePassword: (data: any) => api.post<ApiResponse<any>>('/auth/reset-employee-password', data),
};

export const employeeService = {
  getAll: (includeInactive = false) =>
    api.get<ApiResponse<Employee[]>>(`/employees${includeInactive ? '?includeInactive=true' : ''}`),
  getById: (id: string) => api.get<ApiResponse<Employee>>(`/employees/${id}`),
  create: (data: Partial<Employee>) => api.post<ApiResponse<Employee>>('/employees', data),
  update: (id: string, data: Partial<Employee>) => api.put<ApiResponse<Employee>>(`/employees/${id}`, data),
  deactivate: (id: string) => api.delete<ApiResponse<Employee>>(`/employees/${id}`),
  reactivate: (id: string) => api.patch<ApiResponse<Employee>>(`/employees/${id}/reactivate`, {}),
  updateAvailability: (id: string, disponibleHoy: boolean) =>
    api.patch<ApiResponse<Employee>>(`/employees/${id}/disponibilidad`, { disponibleHoy }),
  updateProfile: (data: any) => api.put<ApiResponse<Employee>>('/employees/profile', data),
};

export const serviceService = {
  getAll: (employeeId?: string, includeInactive = false) => {
    let query = '';
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    if (employeeId) params.append('employeeId', employeeId);
    if (params.toString()) query = `?${params.toString()}`;
    return api.get<ApiResponse<Service[]>>(`/services${query}`);
  },
  getById: (id: string) => api.get<ApiResponse<Service>>(`/services/${id}`),
  create: (data: Partial<Service>) => api.post<ApiResponse<Service>>('/services', data),
  update: (id: string, data: Partial<Service>) => api.put<ApiResponse<Service>>(`/services/${id}`, data),
  deactivate: (id: string) => api.delete<ApiResponse<Service>>(`/services/${id}`),
  reactivate: (id: string) => api.patch<ApiResponse<Service>>(`/services/${id}/reactivate`, {}),
};

export const appointmentService = {
  getAll: (params?: { date?: string; employeeId?: string; status?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return api.get<ApiResponse<Appointment[]> & { pagination?: any }>(`/appointments${query}`);
  },
  getById: (id: string) => api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
  create: (data: Partial<Appointment>) => api.post<ApiResponse<Appointment>>('/appointments', data),
  updateStatus: (id: string, status: string, notes?: string) => api.put<ApiResponse<Appointment>>(`/appointments/${id}`, { status, notes }),
  cancel: (id: string) => api.put<ApiResponse<Appointment>>(`/appointments/${id}`, { status: 'cancelled' }),
  reschedule: (id: string, data: { date: string, timeSlot: string, employeeId: string, reason?: string }) => api.patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, data),
  complete: (id: string, data?: { finalPrice: number }) => api.patch<ApiResponse<Appointment>>(`/appointments/${id}/complete`, data || {}),
  createBulk: (data: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    appointments: any[];
    notes?: string;
    isFlexible?: boolean;
    flexibleAvailabilities?: any[];
  }) => api.post<ApiResponse<Appointment[]>>('/appointments/bulk', data),
  getStats: () => api.get<ApiResponse<any>>('/appointments/stats'),
  getClients: () => api.get<ApiResponse<any[]>>('/appointments/clients'),
  getItinerary: (employeeId: string, date: string) => api.get<ApiResponse<any>>(`/appointments/itinerary/${employeeId}/${date}`),
};

export const availabilityService = {
  getSlots: (employeeId: string, serviceId: string, date: string) =>
    api.get<ApiResponse<string[]>>(`/appointments/availability/${employeeId}/${date}?serviceId=${serviceId}`),
};

export const settingsService = {
  get: () => api.get<ApiResponse<Settings>>('/settings'),
  update: (data: Partial<Settings>) => api.put<ApiResponse<Settings>>('/settings', data),
};

export const blockedSlotService = {
  getAll: (employeeId?: string, isFullDay?: boolean) => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (isFullDay !== undefined) params.append('isFullDay', isFullDay.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ApiResponse<BlockedSlot[]>>(`/blocked-slots${query}`);
  },
  create: (data: Partial<BlockedSlot>) => api.post<ApiResponse<BlockedSlot>>('/blocked-slots', data),
  delete: (id: string) => api.delete<ApiResponse<any>>(`/blocked-slots/${id}`),
};

export const galleryService = {
  getCategories: (all: boolean = false) => api.get<ApiResponse<GalleryCategory[]>>(`/gallery/categories?all=${all}`),
  createCategory: (data: Partial<GalleryCategory>) => api.post<ApiResponse<GalleryCategory>>('/gallery/categories', data),
  updateCategory: (id: string, data: Partial<GalleryCategory>) => api.put<ApiResponse<GalleryCategory>>(`/gallery/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<ApiResponse<null>>(`/gallery/categories/${id}`),

  getItems: (categoryId?: string, all: boolean = false) => api.get<ApiResponse<GalleryItem[]>>(`/gallery/items?all=${all}${categoryId ? `&categoryId=${categoryId}` : ''}`),
  createItem: (data: Partial<GalleryItem>) => api.post<ApiResponse<GalleryItem>>('/gallery/items', data),
  updateItem: (id: string, data: Partial<GalleryItem>) => api.put<ApiResponse<GalleryItem>>(`/gallery/items/${id}`, data),
  deleteItem: (id: string) => api.delete<ApiResponse<null>>(`/gallery/items/${id}`)
};

export const clientService = {
  getAll: () => api.get<ApiResponse<any[]>>('/clients'),
  getOne: (phone: string) => api.get<ApiResponse<any>>(`/clients/${phone}`),
  delete: (phone: string) => api.delete<ApiResponse<null>>(`/clients/${phone}`),
};

export const settlementService = {
  getPending: (specialistId: string) => api.get<ApiResponse<any>>(`/settlements/pending/${specialistId}`),
  create: (data: any) => api.post<ApiResponse<any>>('/settlements', data),
  getHistory: (specialistId: string) => api.get<ApiResponse<any[]>>(`/settlements/history/${specialistId}`),
  getStats: () => api.get<ApiResponse<any>>('/settlements/stats'),
};

export const siteConfigService = {
  get: () => api.get<ApiResponse<SiteConfig>>('/config'),
  update: (data: Partial<SiteConfig>) => api.put<ApiResponse<SiteConfig>>('/config', data),
};
