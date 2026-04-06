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
  const opts = { hostname: 'localhost', port: 5001, path, method, headers }
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

const ok  = (msg) => console.log('  [OK]', msg)
const fail = (msg) => console.log('  [FAIL]', msg)
const sep  = (title) => console.log('\n' + '--------------------------------------------------' + '\n# ' + title)

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

  const dateStr = '2026-04-06'

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

  // ─── FASE 4: CRM ────────────────────────────────────────
  sep('FASE 4 — Clientes CRM')

  // Creamos una nueva cita que SI completaremos (para no interferir con el test de disponibilidad anterior)
  r = await request('POST', '/api/appointments', {
    clientName: 'María CRM',
    clientPhone: '3001234567',
    employee: empId,
    service: svcId,
    date: dateStr,
    timeSlot: '11:00'
  })
  const crmApptId = r.body?.data?._id
  if (crmApptId) {
    await request('PUT', '/api/appointments/' + crmApptId + '/status', { status: 'completed', price: 120000 }, token)
    ok('Cita CRM ' + crmApptId + ' creada y marcada como COMPLETED')
  }

  // Listar clientes (debe tener al menos 1 tras crear la cita)
  r = await request('GET', '/api/clients', null, token)
  r.body?.success
    ? ok('GET /api/clients → ' + r.body.data.length + ' cliente(s)')
    : fail('Listar clientes falló: ' + r.body?.message)

  // Detalle de cliente por teléfono
  r = await request('GET', '/api/clients/3001234567', null, token)
  r.body?.success
    ? ok('GET /api/clients/:phone → LTV: ' + r.body.data.ltv + ' tier: ' + r.body.data.tier + ' visitas: ' + r.body.data.visits)
    : fail('Detalle cliente falló: ' + r.body?.message)

  // Cliente sin auth → 401
  r = await request('GET', '/api/clients', null, null)
  r.status === 401
    ? ok('GET /api/clients (sin token) → 401 correcto')
    : fail('Debería ser 401')

  // ─── FASE 5: LIQUIDACIONES ──────────────────────────────
  sep('FASE 5 — Liquidaciones')

  // Pendientes de liquidar por especialista
  r = await request('GET', '/api/settlements/' + empId, null, token)
  r.body?.success
    ? ok('GET /api/settlements/:id → pendientes: ' + (r.body.data?.citasPendientes?.length || 0))
    : fail('Settlements pendientes falló: ' + r.body?.message)

  // Historial de liquidaciones
  r = await request('GET', '/api/settlements/history/' + empId, null, token)
  r.body?.success
    ? ok('GET /api/settlements/history → ' + r.body.data.length + ' liquidación(es)')
    : fail('Historial liquidaciones falló: ' + r.body?.message)

  // Global contabilidad
  r = await request('GET', '/api/settlements/global', null, token)
  r.body?.success
    ? ok('GET /api/settlements/global → totalSalon: ' + r.body.data?.totalSalon)
    : fail('Global settlements falló: ' + r.body?.message)

  // Sin auth → 401
  r = await request('GET', '/api/settlements/global', null, null)
  r.status === 401
    ? ok('GET /api/settlements/global (sin token) → 401 correcto')
    : fail('Debería ser 401')

  // ─── FASE 6: BULK APPOINTMENTS ──────────────────────────
  sep('FASE 6 — Bulk Appointments')

  // Crear segundo servicio para el bulk test
  r = await request('POST', '/api/services', {
    nombre: 'Corte Test',
    descripcion: 'Servicio corte prueba',
    precio: 45000,
    duracion: 45,
    empleadas: empId ? [empId] : [],
  }, token)
  const svcId2 = r.body?.data?._id
  r.body?.success && svcId2
    ? ok('POST /api/services (2do servicio) → ID: ' + svcId2)
    : fail('Crear 2do servicio falló')

  // Obtener slots para el bulk
  r = await request('GET', '/api/appointments/availability/' + empId + '/' + dateStr + '?serviceId=' + svcId2)
  const slots2 = r.body?.data || []
  const slotBulk1 = slots[1] || '10:00'
  const slotBulk2 = slots2[3] || '12:00'

  // Crear bulk de 2 citas
  r = await request('POST', '/api/appointments/bulk', {
    clientName: 'Ana Bulk Test',
    clientPhone: '3007777777',
    appointments: [
      { employee: empId, service: svcId,  date: dateStr, timeSlot: slotBulk1 },
      { employee: empId, service: svcId2, date: dateStr, timeSlot: slotBulk2 },
    ]
  })
  const bulkId = r.body?.data?.bulkId
  r.body?.success && bulkId
    ? ok('POST /api/appointments/bulk → bulkId: ' + bulkId + ' citas: ' + r.body.data.appointments?.length)
    : fail('Bulk appointments falló: ' + r.body?.message)

  // Intentar duplicar mismo servicio en bulk → debe rechazar
  r = await request('POST', '/api/appointments/bulk', {
    clientName: 'Ana Bulk Test',
    clientPhone: '3007777777',
    appointments: [
      { employee: empId, service: svcId, date: dateStr, timeSlot: slotBulk1 },
      { employee: empId, service: svcId, date: dateStr, timeSlot: slotBulk2 },
    ]
  })
  r.status === 400 || r.status === 409
    ? ok('POST /api/appointments/bulk (servicio duplicado) → ' + r.status + ' correcto')
    : fail('Debería rechazar servicios duplicados en bulk, status: ' + r.status)

  // Cleanup 2do servicio
  r = await request('DELETE', '/api/services/' + svcId2, null, token)
  r.body?.success ? ok('DELETE /api/services (2do servicio) → OK') : fail('Cleanup 2do servicio falló')

  // ─── FASE 7: SITE CONFIG ────────────────────────────────
  sep('FASE 7 — SiteConfig CMS')

  // GET público
  r = await request('GET', '/api/config')
  r.body?.success
    ? ok('GET /api/config (público) → OK, campos: ' + Object.keys(r.body.data || {}).join(', '))
    : fail('GET config falló: ' + r.body?.message)

  // Verificar que no expone campos sensibles
  const configData = r.body?.data || {}
  const hasSensitive = ['updatedBy', 'password', '__v'].some(k => configData[k] !== undefined)
  !hasSensitive
    ? ok('GET /api/config → no expone campos sensibles')
    : fail('Config expone campos sensibles: ' + JSON.stringify(configData))

  // PUT config (con auth)
  r = await request('PUT', '/api/config', {
    nombreSalon: "L'Élixir Salon Test",
    mensajeConfirmacion: 'Hola {nombre}, tu cita de {servicio} está confirmada ✅',
  }, token)
  r.body?.success
    ? ok('PUT /api/config → nombreSalon: ' + r.body.data?.nombreSalon)
    : fail('PUT config falló: ' + r.body?.message)

  // PUT sin auth → 401
  r = await request('PUT', '/api/config', { nombreSalon: 'Hack' })
  r.status === 401
    ? ok('PUT /api/config (sin token) → 401 correcto')
    : fail('Debería ser 401')

  // PUT con horario inválido (apertura > cierre) → 400
  r = await request('PUT', '/api/config', { 
    horaAperturaAgendamiento: '19:00',
    horaCierreAgendamiento: '08:00'
  }, token)
  r.status === 400
    ? ok('PUT /api/config (horario inválido) → 400 correcto')
    : fail('Debería ser 400 al poner apertura > cierre')

  // ─── FASE 8: SEGURIDAD ──────────────────────────────────
  sep('FASE 8 — Seguridad')

  // Verificar que password no viene en respuesta de empleadas
  r = await request('GET', '/api/employees', null, token)
  const empData = r.body?.data?.[0] || {}
  const hasPassword = 'password' in empData || 'tokenVersion' in empData
  !hasPassword
    ? ok('GET /api/employees → no expone password ni tokenVersion ✅')
    : fail('GET /api/employees expone campos sensibles: ' + JSON.stringify(Object.keys(empData)))

  // Verificar headers de seguridad
  r = await request('GET', '/api/health')
  // El test no puede verificar headers HTTP fácilmente, solo registrar
  ok('Headers de seguridad — verificar manualmente en DevTools (helmet activo)')

  // Login con credenciales incorrectas múltiples veces
  let blocked = false
  for (let i = 0; i < 5; i++) {
    r = await request('POST', '/api/auth/login', { identifier: 'admin', password: 'wrong' + i })
  }
  r.status === 401
    ? ok('Múltiples logins fallidos → aún retorna 401 (rate limit no alcanzado en 5 intentos)')
    : fail('Login handling inesperado: ' + r.status)

  sep('RESUMEN FINAL')
  console.log('Fases completadas: Auth, CRUD, Disponibilidad, Citas, CRM, Liquidaciones, Bulk, CMS, Seguridad')
  console.log('Revisa los ❌ arriba para issues pendientes')

  // ─── CLEANUP (soft-delete) ──────────────────────────────
  sep('Cleanup — soft delete')
  r = await request('DELETE', '/api/employees/' + empId, null, token)
  r.body?.success ? ok('DELETE /api/employees (desactivar) → OK') : fail('Desactivar empleada falló')

  r = await request('DELETE', '/api/services/' + svcId, null, token)
  r.body?.success ? ok('DELETE /api/services (desactivar) → OK') : fail('Desactivar servicio falló')

  console.log('\n' + '='.repeat(50))
  // ─── FASE 8: Login Especialista (Angel) ──────────────────
  sep('FASE 8 — Login Especialista (Angel)')
  
  const r8 = await request('POST', '/api/auth/login', {
    identifier: 'angel',
    password: 'angel123',
    role: 'empleada'
  })
  
  let angelToken = '';
  if (r8.body?.success && r8.body?.data?.token) {
    angelToken = r8.body.data.token;
    ok('POST /api/auth/login (angel) → OK, Token capturado');
    r8.body.data.user?.role === 'empleada' ? ok('  -> Rol devuelto: empleada (Correcto)') : fail('  -> Rol devuelto: ' + r8.body.data.user?.role);
  } else {
    fail('POST /api/auth/login (angel) falló: ' + (r8.body?.message || r8.status));
  }
  
  if (angelToken) {
    const rMe = await request('GET', '/api/auth/me', {}, angelToken)
    rMe.body?.success && rMe.body?.data?.nombre === 'angel'
      ? ok('GET /api/auth/me (angel) → OK, Nombre verificado')
      : fail('GET /api/auth/me (angel) falló: ' + (JSON.stringify(rMe.body) || rMe.status));
  }

  console.log('\n==================================================');
  console.log('🎉 PRUEBA INTEGRAL COMPLETADA');
  console.log('==================================================');
  process.exit(0)
}

run().catch(e => {
  console.error('ERROR FATAL:', e)
  process.exit(1)
})
