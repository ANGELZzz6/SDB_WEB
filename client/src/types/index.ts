// Tipos globales del proyecto Salón de Belleza
// Espejo de los modelos Mongoose del backend

export interface Employee {
  _id: string
  nombre: string
  email?: string
  foto: string
  descripcion: string
  especialidades: string[]
  servicios: Service[] | string[]
  horarioPersonalizado: {
    lunes: DaySchedule
    martes: DaySchedule
    miercoles: DaySchedule
    jueves: DaySchedule
    viernes: DaySchedule
    sabado: DaySchedule
    domingo: DaySchedule
  }
  isActive: boolean
}

export interface DaySchedule {
  inicio: string  // "HH:MM"
  fin: string     // "HH:MM"
  activo: boolean
}

export interface Service {
  _id: string
  nombre: string
  descripcion: string
  precio: number
  precioTipo: 'fijo' | 'rango' | 'consultar'
  precioDesde?: number
  precioHasta?: number
  duracion: number  // minutos
  empleadas: Employee[] | string[]
  imagen: string
  isActive: boolean
}

export interface Appointment {
  _id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  employee: Employee | string
  service: Service | string
  date: string  // ISO date string
  timeSlot: string   // "HH:MM"
  endTime: string    // "HH:MM"
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  reminderSent: boolean
  createdAt: string
}

export interface BlockedSlot {
  _id: string
  employee: string  // ObjectId o 'all'
  date: string
  isFullDay: boolean
  timeSlot?: string
  reason?: string
}

export interface Settings {
  _id: string
  businessName: string
  businessHours: {
    inicio: string  // "06:00"
    fin: string     // "21:00"
  }
  bufferBetweenAppointments: number
  maxDaysInAdvance: number
  cancellationHoursLimit: number
  whatsappNumber: string
  address: string
  socialMedia: {
    instagram?: string
    facebook?: string
    tiktok?: string
  }
}

// Respuesta genérica de la API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface GalleryCategory {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface GalleryItem {
  _id: string;
  url: string;
  categoryId: GalleryCategory | string;
  caption?: string;
  isActive: boolean;
}
