/**
 * Sanitización recursiva para prevenir Inyección NoSQL.
 * Elimina cualquier clave que empiece por '$' o que contenga '.'.
 * 
 * Basado en la lógica de express-mongo-sanitize, pero compatible con Express 5
 * (evitando sobreescribir propiedades read-only como req.query).
 */
function sanitize(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    obj.forEach(item => sanitize(item));
    return obj;
  }

  Object.keys(obj).forEach(key => {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      sanitize(obj[key]);
    }
  });

  return obj;
}

module.exports = sanitize;
