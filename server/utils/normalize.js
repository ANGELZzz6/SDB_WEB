/**
 * Normaliza un número de teléfono eliminando cualquier carácter no numérico.
 * @param {string} phone El teléfono a normalizar.
 * @returns {string} El teléfono normalizado.
 */
function normalizePhone(phone) {
  if (!phone) return ''
  return phone.toString().replace(/\D/g, '')
}

module.exports = { normalizePhone }
