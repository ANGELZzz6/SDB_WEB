export const waLink = (phone: string, message: string) => {
  const clean = phone.replace(/\D/g, '').replace(/^57/, '');
  return `https://wa.me/57${clean}?text=${encodeURIComponent(message)}`;
};

/**
 * Converts a 24h time string "HH:MM" to 12h format "h:MM AM/PM".
 * Safe: handles empty strings, midnight (00:xx), noon (12:xx).
 * Examples: "14:30" → "2:30 PM" | "09:00" → "9:00 AM" | "00:00" → "12:00 AM"
 */
export const formatHora12 = (hora24: string): string => {
  if (!hora24 || !hora24.includes(':')) return hora24 || '';
  const [hhStr, mmStr] = hora24.split(':');
  const hh = parseInt(hhStr, 10);
  const mm = mmStr?.padStart(2, '0') || '00';
  if (isNaN(hh)) return hora24;
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${period}`;
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
  // Extract only YYYY-MM-DD to safely handle both plain dates and full ISO timestamps
  // (e.g. "2026-04-25T00:00:00.000Z" from the server after a fetchData refresh)
  const dateOnly = (fecha || '').split('T')[0];
  return new Date(dateOnly + 'T12:00:00').toLocaleDateString('es-CO', {
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
    hora: formatHora12(time),
    especialista: specialist
  });

  const confirmMsg = `Cita ${actionVerb} correctamente.\n\n¿Deseas notificar al cliente (${client}) por WhatsApp?`;
  
  if (confirm(confirmMsg)) {
    window.open(waLink(phone, message), '_blank');
  }
};
