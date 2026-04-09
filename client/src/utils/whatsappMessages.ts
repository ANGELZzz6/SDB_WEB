export const waLink = (phone: string, message: string) => {
  const clean = phone.replace(/\D/g, '').replace(/^57/, '');
  return `https://wa.me/57${clean}?text=${encodeURIComponent(message)}`;
};

export const WA_MESSAGES = {
  confirmacion: (nombre: string, servicio: string, fecha: string, hora: string) =>
    `Hola ${nombre} ✅, tu cita de *${servicio}* está confirmada para el *${fecha}* a las *${hora}*. ¡Te esperamos! 💅 — L'Élixir Salon`,

  rechazo: (nombre: string, fecha: string) =>
    `Hola ${nombre} 😔, lamentablemente no podemos atenderte el *${fecha}*. Te invitamos a reagendar cuando gustes 🙏 — L'Élixir Salon`,

  reagendamiento: (nombre: string, servicio: string, fecha: string, hora: string) =>
    `Hola ${nombre} 🕒, te informamos que hemos reagendado tu cita de *${servicio}*. Tu nueva cita es el día *${fecha}* a las *${hora}*. ¡Te esperamos! 💅 — L'Élixir Salon`,

  nuevaCita: (nombre: string, servicio: string, fecha: string, hora: string) =>
    `Hola ${nombre} 👋, recibimos tu solicitud de cita para *${servicio}* el *${fecha}* a las *${hora}*. Te confirmamos en breve 💅 — L'Élixir Salon`,

  rechazoConflicto: (nombre: string, fecha: string, hora: string) =>
    `Hola ${nombre} 🥺, lamentablemente el espacio para el *${fecha}* a las *${hora}* acaba de ser tomado. ¿Te gustaría agendar en otro horario disponible? 🙏 — L'Élixir Salon`,
};

export const formatFecha = (fecha: string) => {
  // Ensure the date is interpreted as local noon to avoid time zone shifts
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  }); // "domingo, 5 de abril"
};

export const buildMessage = (
  template: string,
  vars: { nombre: string, servicio?: string, fecha?: string, hora?: string, especialista?: string }
) => {
  return template
    .replace(/{nombre}/g, vars.nombre)
    .replace(/{servicio}/g, vars.servicio || '')
    .replace(/{fecha}/g, vars.fecha || '')
    .replace(/{hora}/g, vars.hora || '')
    .replace(/{especialista}/g, vars.especialista || '');
};

/**
 * Facilitates opening WhatsApp with a pre-filled message based on an appointment action.
 * Refactored to accept the full appointment object for better scalability and TS consistency.
 */
export const sendApptNotification = (
  type: 'confirm' | 'cancel' | 'reschedule' | 'reject' | 'complete',
  appt: any, // Supports both backend Appointment and frontend UIAppointment shapes
  siteConfig: any
) => {
  if (!appt) return;

  // Extraction logic to handle different object shapes (Calendar vs Dashboard)
  const client = appt.clientName || appt.client || '';
  const phone = appt.clientPhone || appt.phone || '';
  const date = appt.date || '';
  const time = appt.timeSlot || appt.time || '';
  
  // Handle service as object or string
  const service = typeof appt.service === 'string' 
    ? appt.service 
    : (appt.service?.nombre || appt.service || '');

  // Handle specialist as object or string
  const specialist = typeof appt.employee === 'string'
    ? appt.employee
    : (appt.employee?.nombre || appt.specialist || '');

  let template = '';
  let actionVerb = '';

  switch (type) {
    case 'confirm':
      template = siteConfig?.mensajeConfirmacion || WA_MESSAGES.confirmacion('{nombre}', '{servicio}', '{fecha}', '{hora}');
      actionVerb = 'confirmada';
      break;
    case 'cancel':
    case 'reject':
      template = siteConfig?.mensajeCancelacion || WA_MESSAGES.rechazo('{nombre}', '{fecha}');
      actionVerb = 'cancelada/rechazada';
      break;
    case 'reschedule':
      template = siteConfig?.mensajeReagendamiento || WA_MESSAGES.reagendamiento('{nombre}', '{servicio}', '{fecha}', '{hora}');
      actionVerb = 'reagendada';
      break;
    case 'complete':
      template = siteConfig?.mensajeCompletada || `¡Hola {nombre}! Gracias por visitarnos hoy para tu servicio de {servicio}. ¡Esperamos verte pronto!`;
      actionVerb = 'completada';
      break;
  }

  const message = buildMessage(template, {
    nombre: client,
    servicio: service,
    fecha: formatFecha(date),
    hora: time,
    especialista: specialist
  });

  const confirmMsg = `Cita ${actionVerb} correctamente.\n\n¿Deseas notificar al cliente (${client}) por WhatsApp?`;
  
  if (confirm(confirmMsg)) {
    window.open(waLink(phone, message), '_blank');
  }
};
