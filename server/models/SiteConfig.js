const mongoose = require('mongoose');

const SiteConfigSchema = new mongoose.Schema({
  // Info del negocio
  nombreSalon: { type: String, default: "L'Élixir Salon" },
  telefono: { type: String, default: "+57 300 000 0000" },
  whatsapp: { type: String, default: "3000000000" },
  direccion: { type: String, default: "Calle Falsa 123, Bogotá" },
  horario: { type: String, default: "Lun-Sab 9am-7pm" },

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
  fondoImagenUrl: { type: String, default: "" },

  // Mensajes WhatsApp (Plantillas editables)
  mensajeConfirmacion: { type: String, default: "" },
  mensajeCancelacion: { type: String, default: "" },
  mensajeReagendamiento: { type: String, default: "" },
  
  // Horario de Agendamiento (Dynamic)
  horaAperturaAgendamiento: { type: String, default: '08:00' },
  horaCierreAgendamiento: { type: String, default: '19:00' },
  duracionSlot: { type: Number, default: 30 },

  // Metadata
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', SiteConfigSchema);
