const mongoose = require('mongoose');

const SiteConfigSchema = new mongoose.Schema({
  // Info del negocio
  nombreSalon: { type: String, default: "L'Élixir Salon" },
  telefono: { type: String, default: "+57 300 000 0000" },
  whatsapp: { type: String, default: "3000000000" },
  direccion: { type: String, default: "Calle Falsa 123, Bogotá" },
  horario: { type: String, default: "Lun-Sab 9am-7pm" },
  mapaUrl: { 
    type: String, 
    default: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127248.88277259163!2d-74.15077271444158!3d4.678125867915575!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9bfd2da6cb29%3A0x239d635520a33914!2sBogot%C3%A1!5e0!3m2!1ses!2sco!4v1713459144865!5m2!1ses!2sco" 
  },

  // Redes sociales
  instagram: { type: String, default: "elixirsulon" },
  facebook: { type: String, default: "elixirsulon_fb" },
  whatsappLink: { type: String, default: "" },

  // Textos landing
  heroTitulo: { type: String, default: "Tu belleza, nuestra pasión" },
  heroSubtitulo: { type: String, default: "Experiencias de lujo para resaltar tu esencia natural." },
  heroBotonTexto: { type: String, default: "Reservar Cita" },
  seccionServiciosTitulo: { type: String, default: "Nuestros Servicios" },
  seccionEspecialistasTitulo: { type: String, default: "Nuestros Especialistas" },
  footerTexto: { type: String, default: "L'Élixir Salon — © 2026 Todos los derechos reservados." },

  // Colores (Personalización pública)
  colorPrimario: { type: String, default: "#944555" },
  colorSecundario: { type: String, default: "#3e0215" },
  colorAcento: { type: String, default: "#fdf8f9" },

  // Imágenes (URLs de Cloudinary)
  heroImagenUrl: { type: String, default: "" },
  heroVideoUrl: { type: String, default: "" },
  fondoImagenUrl: { type: String, default: "" },

  // Mensajes WhatsApp (Plantillas editables)
  mensajeConfirmacion: { type: String, default: '¡Hola {nombre}! Tu cita para {servicio} el día {fecha} a las {hora} ha sido confirmada. Te esperamos.' },
  mensajeCancelacion: { type: String, default: '¡Hola {nombre}! Tu cita para el día {fecha} ha sido cancelada.' },
  mensajeReagendamiento: { type: String, default: 'Hola {nombre} 🕒, te informamos que hemos reagendado tu cita de *{servicio}*. Tu nueva cita es el día *{fecha}* a las *{hora}*. ¡Te esperamos! 💅 — L´Élixir Salon' },
  mensajeRechazoConflicto: { type: String, default: 'Lo sentimos {nombre}, el espacio para {fecha} a las {hora} ya no está disponible. Por favor, intenta agendar en otro horario.' },
  mensajeCompletada: { type: String, default: '¡Hola {nombre}! Gracias por visitarnos hoy para tu servicio de {servicio}. ¡Esperamos verte pronto!' },
  
  // Horario de Agendamiento (Dynamic)
  horaAperturaAgendamiento: { type: String, default: '08:00' },
  horaCierreAgendamiento: { type: String, default: '19:00' },
  duracionSlot: { type: Number, default: 30 },

  // Metadata
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', SiteConfigSchema);
