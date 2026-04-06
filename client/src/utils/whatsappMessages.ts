export const waLink = (phone: string, message: string) => {
  const clean = phone.replace(/\D/g, '').replace(/^57/, '');
  return `https://wa.me/57${clean}?text=${encodeURIComponent(message)}`;
};

export const WA_MESSAGES = {
  confirmacion: (nombre: string, servicio: string, fecha: string, hora: string) =>
    `Hola ${nombre} ✅, tu cita de *${servicio}* está confirmada para el *${fecha}* a las *${hora}*. ¡Te esperamos! 💅 — L'Élixir Salon`,

  rechazo: (nombre: string, fecha: string) =>
    `Hola ${nombre} 😔, lamentablemente no podemos atenderte el *${fecha}*. Te invitamos a reagendar cuando gustes 🙏 — L'Élixir Salon`,

  reagendamiento: (nombre: string, servicio: string) =>
    `Hola ${nombre} 🕒, necesitamos mover tu cita de *${servicio}*. ¿Tienes disponibilidad otro día? Escríbenos para coordinar 😊 — L'Élixir Salon`,

  nuevaCita: (nombre: string, servicio: string, fecha: string, hora: string) =>
    `Hola ${nombre} 👋, recibimos tu solicitud de cita para *${servicio}* el *${fecha}* el *${fecha}* a las *${hora}*. Te confirmamos en breve 💅 — L'Élixir Salon`,
};

export const formatFecha = (fecha: string) => {
  // Ensure the date is interpreted as local noon to avoid time zone shifts
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  }); // "domingo, 5 de abril"
};

export const buildMessage = (
  template: string,
  vars: { nombre: string, servicio?: string, fecha?: string, hora?: string }
) => {
  return template
    .replace(/{nombre}/g, vars.nombre)
    .replace(/{servicio}/g, vars.servicio || '')
    .replace(/{fecha}/g, vars.fecha || '')
    .replace(/{hora}/g, vars.hora || '');
};
