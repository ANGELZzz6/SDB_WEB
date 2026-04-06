const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Employee = require('../models/Employee')

// ─── Helper: generar JWT ────────────────────────────────────────────────────
const signToken = (id, role, tokenVersion = 0, type = 'normal') =>
  jwt.sign({ id, role, tokenVersion, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

// ─── POST /api/auth/login ───────────────────────────────────────────────────
// Body: { identifier: String, password: String, role: 'admin'|'empleada' }
const login = async (req, res, next) => {
  try {
    const { identifier, password, role } = req.body

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Credenciales incompletas — identificador y contraseña requeridos',
      })
    }

    // ── Login ADMIN ──────────────────────────────────────────────────────────
    if (role === 'admin' || !role) {
      const adminUser = process.env.ADMIN_USERNAME || 'admin'
      const adminPass = process.env.ADMIN_PASSWORD

      if (!adminPass) {
        return res.status(500).json({
          success: false,
          message: 'Admin no configurado — define ADMIN_PASSWORD en .env',
        })
      }

      // Permite login admin por username+password plano (o hasheado si se desea)
      const isAdminUser = identifier === adminUser
      const isValidPassword = adminPass.startsWith('$2')
        ? await bcrypt.compare(password, adminPass)
        : password === adminPass

      if (isAdminUser && isValidPassword) {
        // Marcamos el token como tipo 'virtual' para el admin
        const token = signToken('admin', 'admin', 0, 'virtual')
        return res.json({
          success: true,
          data: {
            token,
            user: { 
              id: 'virtual-admin', 
              role: 'admin', 
              nombre: process.env.ADMIN_NOMBRE || 'Administradora',
              email: process.env.ADMIN_EMAIL || '',
              isVirtual: true
            },
          },
        })
      }

      // Si el role explícito es admin y falló, rechazar aquí
      if (role === 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas',
        })
      }
    }

    // ── Login EMPLEADA ───────────────────────────────────────────────────────
    // identifier puede ser el nombre de la empleada o su email (buscamos por nombre o email)
    const employee = await Employee.findOne({
      $or: [
        { nombre: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { email: { $regex: new RegExp(`^${identifier}$`, 'i') } }
      ],
      isActive: true,
    }).select('+password +tokenVersion')

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      })
    }

    if (!employee.password) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      })
    }

    const isMatch = await bcrypt.compare(password, employee.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      })
    }

    const token = signToken(employee._id, 'empleada', employee.tokenVersion || 0)
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id:          employee._id,
          role:        'empleada',
          nombre:      employee.nombre,
          email:       employee.email,
          foto:        employee.foto,
          disponibleHoy: employee.disponibleHoy,
          permissions: employee.permissions || {},
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    // 1. Prioridad: Detectar admin virtual ANTES de cualquier consulta a la DB
    if (req.user.role === 'admin' || req.user.id === 'admin' || req.user.id === 'virtual-admin') {
      return res.status(200).json({
        success: true,
        data: {
          id: 'admin',
          role: 'admin',
          nombre: process.env.ADMIN_NOMBRE || 'Administradora',
          email: process.env.ADMIN_EMAIL || '',
          permissions: {},
          isActive: true,
          isVirtual: true
        }
      });
    }

    // 2. Flujo normal para empleadas (buscar en DB)
    const employee = await Employee.findById(req.user.id).select('nombre email foto disponibleHoy permissions isActive');

    if (!employee || !employee.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o inactivo',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id:          employee._id,
        role:        'empleada',
        nombre:      employee.nombre,
        email:       employee.email,
        foto:        employee.foto,
        disponibleHoy: employee.disponibleHoy,
        permissions: employee.permissions || {},
        isActive:    true,
        isVirtual:   false
      },
    });
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
// Bloquea el token actual incrementando la versión en la DB (solo para especialistas)
const logout = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'empleada') {
      await Employee.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } })
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente' })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/auth/create-employee-account ─────────────────────────────────
// Solo Admin. Crea credenciales (email + password) para una empleada existente.
const createEmployeeAccount = async (req, res, next) => {
  try {
    const { employeeId, email, password } = req.body;
    if (!employeeId || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos (employeeId, email, password)' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Empleada no encontrada' });

    const emailInUse = await Employee.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') }, _id: { $ne: employeeId } });
    if (emailInUse) return res.status(400).json({ success: false, message: 'Correo electrónico ya está en uso por otra empleada' });

    employee.email = email.toLowerCase();
    employee.password = await bcrypt.hash(password, 12);
    await employee.save();

    res.json({ success: true, message: 'Cuenta creada y credenciales asignadas', data: { email: employee.email } });
  } catch (error) {
    next(error);
  }
}

// ─── POST /api/auth/reset-employee-password ─────────────────────────────────
// Solo Admin. Sobrescribe la contraseña de una empleada.
const resetEmployeePassword = async (req, res, next) => {
  try {
    const { employeeId, newPassword } = req.body;
    if (!employeeId || !newPassword) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos (employeeId, newPassword)' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Empleada no encontrada' });

    employee.password = await bcrypt.hash(newPassword, 12);
    await employee.save();

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, me, logout, createEmployeeAccount, resetEmployeePassword }
