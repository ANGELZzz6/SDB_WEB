/**
 * test-backend.js — Prueba integral del backend L'Élixir Salon
 * Ejecutar: node test-backend.js
 */
const http = require('http')

const request = (method, path, payload, token) => new Promise((resolve) => {
  const body = payload ? JSON.stringify(payload) : null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  if (body) headers['Content-Length'] = Buffer.byteLength(body)
  const opts = { hostname: 'localhost', port: 5000, path, method, headers }
  const req = http.request(opts, (res) => {
    let data = ''
    res.on('data', d => data += d)
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
      catch (e) { resolve({ status: res.statusCode, raw: data }) }
    })
  })
  req.on('error', e => resolve({ error: e.message }))
  req.setTimeout(8000, () => { req.destroy(); resolve({ error: 'timeout' }) })
  if (body) req.write(body)
  req.end()
})

const ok  = (msg) => console.log('  ✅', msg)
const fail = (msg) => console.log('  ❌', msg)
const sep  = (title) => console.log('\n' + '─'.repeat(50) + '\n📌 ' + title)

async function run() {
  console.log('🧪 PRUEBA INTEGRAL BACKEND — L\'Élixir Salon')
  console.log('='.repeat(50))

  // ─── HEALTH ────────────────────────────────────────────
  sep('SISTEMA')
  let r = await request('GET', '/api/health')
  r.body?.success ? ok('GET /api/health → OK') : fail('health check falló')

  // ─── FASE 1: AUTH ──────────────────────────────────────
  sep('FASE 1 — Autenticación')

  // Login admin correcto
  r = await request('POST', '/api/auth/login', { identifier: 'admin', password: 'Admin1234!', role: 'admin' })
  const token = r.body?.data?.token
  r.body?.success && token
    ? ok('POST /api/auth/login (admin) → JWT: ' + token.slice(0, 20) + '...')
    : fail('Login admin falló: ' + r.body?.message)
  if (!token) { console.log('ABORTANDO — no se puede continuar sin token'); process.exit(1) }

  // Login admin incorrecto
  r = await request('POST', '/api/auth/login', { identifier: 'admin', password: 'wrong', role: 'admin' })
  r.status === 401
    ? ok('POST /api/auth/login (contraseña incorrecta) → 401 OK')
    : fail('Debería rechazar password incorrecta')

  // GET /me
  r = await request('GET', '/api/auth/me', null, token)
  r.body?.data?.role === 'admin'
    ? ok('GET /api/auth/me → role: admin')
    : fail('GET /me falló')

  // Sin token → 401
  r = await request('GET', '/api/auth/me')
  r.status === 401 ? ok('GET /api/auth/me (sin token) → 401 correcto') : fail('Debería ser 401')

  // ─── FASE 1: EMPLEADAS ─────────────────────────────────
  sep('FASE 1 — CRUD Empleadas')

  // Crear
  r = await request('POST', '/api/employees', {
    nombre: 'Valentina Prueba',
    descripcion: 'Test empleada',
    especialidades: ['Corte', 'Color'],
    horarioPersonalizado: {
      lunes:     { inicio: '08:00', fin: '17:00', activo: true },
      martes:    { inicio: '08:00', fin: '17:00', activo: true },
      miercoles: { inicio: '08:00', fin: '17:00', activo: true },
      jueves:    { inicio: '08:00', fin: '17:00', activo: true },
      viernes:   { inicio: '08:00', fin: '17:00', activo: true },
      sabado:    { inicio: '09:00', fin: '14:00', activo: false },
      domingo:   { inicio: '00:00', fin: '00:00', activo: false },
    },
    password: 'empleada123',
  }, token)
  const empId = r.body?.data?._id
  r.body?.success && empId
    ? ok('POST /api/employees → ID: ' + empId)
    : fail('Crear empleada falló: ' + r.body?.message)

  // Crear sin auth → 401
  r = await request('POST', '/api/employees', { nombre: 'Sin Auth' })
  r.status === 401 ? ok('POST /api/employees (sin token) → 401 correcto') : fail('Debería ser 401')

  // Listar
  r = await request('GET', '/api/employees')
  r.body?.success
    ? ok('GET /api/employees → ' + r.body.data.length + ' empleada(s)')
    : fail('Listar empleadas falló')

  // GET por ID
  r = await request('GET', '/api/employees/' + empId)
  r.body?.success ? ok('GET /api/employees/:id → ' + r.body.data.nombre) : fail('GET por ID falló')

  // ─── FASE 2: SERVICIOS ─────────────────────────────────
  sep('FASE 2 — CRUD Servicios')

  r = await request('POST', '/api/services', {
    nombre: 'Manicure Gel Test',
    descripcion: 'Servicio de prueba',
    precio: 35000,
    duracion: 60,
    empleadas: empId ? [empId] : [],
  }, token)
  const svcId = r.body?.data?._id
  r.body?.success && svcId
    ? ok('POST /api/services → ID: ' + svcId + ' duración: ' + r.body.data.duracion + 'min precio: $' + r.body.data.precio)
    : fail('Crear servicio falló: ' + r.body?.message)

  // Listar
  r = await request('GET', '/api/services')
  r.body?.success ? ok('GET /api/services → ' + r.body.data.length + ' servicio(s)') : fail('Listar servicios falló')

  // ─── FASE 2: SETTINGS ──────────────────────────────────
  sep('FASE 2 — Settings')

  r = await request('GET', '/api/settings')
  r.body?.success
    ? ok("GET /api/settings → businessName: '" + r.body.data.businessName + "' buffer: " + r.body.data.bufferBetweenAppointments + 'min maxDays: ' + r.body.data.maxDaysInAdvance)
    : fail('GET settings falló')

  r = await request('PUT', '/api/settings', {
    businessName: "L'Élixir Salon",
    bufferBetweenAppointments: 10,
    maxDaysInAdvance: 15,
    address: 'Carrera 102 #70-50',
  }, token)
  r.body?.success
    ? ok("PUT /api/settings → buffer actualizado a " + r.body.data.bufferBetweenAppointments + 'min')
    : fail('PUT settings falló: ' + r.body?.message)

  // ─── FASE 3: DISPONIBILIDAD ────────────────────────────
  sep('FASE 3 — Disponibilidad')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  // Saltar fin de semana (sabado/domingo están inactivos para esta empleada)
  while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 1)
  }
  const dateStr = tomorrow.toISOString().split('T')[0]

  r = await request('GET', '/api/appointments/availability/' + empId + '/' + dateStr + '?serviceId=' + svcId)
  const slots = r.body?.data || []
  r.body?.success
    ? ok('GET /availability → ' + slots.length + ' slots disponibles para ' + dateStr + ', primeros 3: [' + slots.slice(0, 3).join(', ') + ']')
    : fail('Disponibilidad falló: ' + r.body?.message)

  // Sin serviceId → 400
  r = await request('GET', '/api/appointments/availability/' + empId + '/' + dateStr)
  r.status === 400 ? ok('GET /availability (sin serviceId) → 400 correcto') : fail('Debería ser 400 sin serviceId')

  // ─── FASE 3: CREAR CITA ─────────────────────────────────
  sep('FASE 3 — Citas')

  const firstSlot = slots[0] || '09:00'
  r = await request('POST', '/api/appointments', {
    clientName: 'María González (Test)',
    clientPhone: '3001234567',
    clientEmail: 'maria@test.com',
    employee: empId,
    service: svcId,
    date: dateStr,
    timeSlot: firstSlot,
    notes: 'Cita de prueba automatizada',
  })
  const apptId = r.body?.data?._id
  r.body?.success && apptId
    ? ok('POST /api/appointments → slot: ' + r.body.data.timeSlot + ' → ' + r.body.data.endTime + ' status: ' + r.body.data.status)
    : fail('Crear cita falló: ' + r.body?.message)

  // Intentar agendar en el mismo slot → 409
  r = await request('POST', '/api/appointments', {
    clientName: 'Otra Cliente',
    clientPhone: '3009999999',
    employee: empId,
    service: svcId,
    date: dateStr,
    timeSlot: firstSlot,
  })
  r.status === 409
    ? ok('POST /api/appointments (slot duplicado) → 409 correcto - ' + r.body?.message)
    : fail('Debería rechazar slot duplicado, status: ' + r.status)

  // Confirmar cita
  r = await request('PUT', '/api/appointments/' + apptId, { status: 'confirmed' }, token)
  r.body?.data?.status === 'confirmed'
    ? ok('PUT /api/appointments (confirmar) → status: confirmed')
    : fail('Confirmar cita falló: ' + r.body?.message)

  // Listar citas (admin)
  r = await request('GET', '/api/appointments', null, token)
  r.body?.success
    ? ok('GET /api/appointments (admin) → ' + r.body.data.length + ' cita(s), total DB: ' + r.body.pagination?.total)
    : fail('Listar citas falló')

  // ─── FASE 3: BLOCKED-SLOTS ──────────────────────────────
  sep('FASE 3 — Blocked Slots')

  r = await request('POST', '/api/blocked-slots', {
    employee: empId,
    date: dateStr,
    isFullDay: false,
    timeSlot: '15:00',
    reason: 'Test bloqueo de hora',
  }, token)
  const blockedId = r.body?.data?._id
  r.body?.success
    ? ok('POST /api/blocked-slots → slot ' + r.body.data.timeSlot + ' bloqueado para ' + dateStr)
    : fail('Crear blocked-slot falló: ' + r.body?.message)

  // Verificar que 15:00 no aparece en disponibilidad
  r = await request('GET', '/api/appointments/availability/' + empId + '/' + dateStr + '?serviceId=' + svcId)
  const has1500 = r.body?.data?.includes('15:00')
  !has1500
    ? ok('Slot 15:00 bloqueado correctamente → no aparece en disponibilidad')
    : fail('15:00 debería estar bloqueado pero aparece en slots')

  // Listar blocked-slots
  r = await request('GET', '/api/blocked-slots', null, token)
  r.body?.success ? ok('GET /api/blocked-slots → ' + r.body.data.length + ' bloqueo(s)') : fail('Listar blocked-slots falló')

  // DELETE blocked-slot
  if (blockedId) {
    r = await request('DELETE', '/api/blocked-slots/' + blockedId, null, token)
    r.body?.success ? ok('DELETE /api/blocked-slots → eliminado correctamente') : fail('DELETE blocked-slot falló')
  }

  // Cancelar cita (sin auth — público según reglas)
  r = await request('DELETE', '/api/appointments/' + apptId)
  r.body?.success
    ? ok('DELETE /api/appointments (cancelar sin auth) → ' + r.body.message)
    : fail('Cancelar cita falló: ' + r.body?.message)

  // Verificar que después de cancelar el slot vuelve a estar disponible
  r = await request('GET', '/api/appointments/availability/' + empId + '/' + dateStr + '?serviceId=' + svcId)
  const hasSlotBack = r.body?.data?.includes(firstSlot)
  hasSlotBack
    ? ok('Slot ' + firstSlot + ' volvió a estar disponible tras cancelar cita')
    : fail('Slot ' + firstSlot + ' debería estar disponible tras cancelación')

  // ─── STATS ──────────────────────────────────────────────
  sep('Stats admin')
  r = await request('GET', '/api/appointments/stats', null, token)
  r.body?.success
    ? ok('GET /api/appointments/stats → hoy: ' + r.body.data.todayCount + ' cita(s)')
    : fail('Stats falló: ' + r.body?.message)

  // ─── CLEANUP (soft-delete) ──────────────────────────────
  sep('Cleanup — soft delete')
  r = await request('DELETE', '/api/employees/' + empId, null, token)
  r.body?.success ? ok('DELETE /api/employees (desactivar) → OK') : fail('Desactivar empleada falló')

  r = await request('DELETE', '/api/services/' + svcId, null, token)
  r.body?.success ? ok('DELETE /api/services (desactivar) → OK') : fail('Desactivar servicio falló')

  console.log('\n' + '='.repeat(50))
  console.log('🎉 PRUEBA INTEGRAL COMPLETADA')
  console.log('='.repeat(50))
  process.exit(0)
}

run().catch(e => {
  console.error('ERROR FATAL:', e)
  process.exit(1)
})
