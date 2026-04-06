const bcrypt = require('bcryptjs')
const Employee = require('../models/Employee')

// ─── GET /api/employees ──────────────────────────────────────────────────────
// Query: ?includeInactive=true (solo admin)
const getAll = async (req, res, next) => {
  try {
    const showInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin'
    const filter = showInactive ? {} : { isActive: true }

    let employeesQuery = Employee.find(filter)
      .populate('servicios', 'nombre precio duracion imagen isActive')
      .sort({ nombre: 1 })

    // Si no es admin, filtramos campos sensibles adicionales
    if (req.user?.role !== 'admin') {
      employeesQuery = employeesQuery.select('nombre foto descripcion especialidades servicios disponibleHoy isActive');
    } else {
      employeesQuery = employeesQuery.select('-password -tokenVersion');
    }

    const employees = await employeesQuery;
    res.json({ success: true, data: employees })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/employees/:id ──────────────────────────────────────────────────
const getOne = async (req, res, next) => {
  try {
    let employeeQuery = Employee.findById(req.params.id)
      .populate('servicios', 'nombre precio duracion imagen isActive');

    // Restringir campos si no es admin o si es la propia empleada viendo a otra
    if (req.user?.role !== 'admin' && req.user?.id !== req.params.id) {
      employeeQuery = employeeQuery.select('nombre foto descripcion especialidades servicios disponibleHoy isActive');
    } else {
      employeeQuery = employeeQuery.select('-password -tokenVersion');
    }

    const employee = await employeeQuery;

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    // Empleada solo puede ver su propio perfil
    if (req.user?.role === 'empleada' && req.user.id !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' })
    }

    res.json({ success: true, data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/employees ─────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const {
      nombre, email, foto, descripcion, especialidades,
      servicios, horarioPersonalizado, password,
    } = req.body

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' })
    }

    const data = { nombre, foto, descripcion, especialidades, servicios, horarioPersonalizado };
    if (email) data.email = email;

    if (password) {
      data.password = await bcrypt.hash(password, 12)
    }

    const employee = await Employee.create(data)
    await employee.populate('servicios', 'nombre precio duracion imagen')

    // No devolver campos sensibles en la creación
    const result = employee.toObject();
    delete result.password;
    delete result.tokenVersion;

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/employees/:id ──────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { password, ...fields } = req.body

    if (password) {
      fields.password = await bcrypt.hash(password, 12)
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      { new: true, runValidators: true }
    ).populate('servicios', 'nombre precio duracion imagen').select('-password -tokenVersion')

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    res.json({ success: true, data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE /api/employees/:id (soft-delete) ─────────────────────────────────
const deactivate = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -tokenVersion')

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    res.json({ success: true, message: 'Empleada desactivada correctamente', data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── PATCH /api/employees/:id/reactivate ─────────────────────────────────────
const reactivate = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password -tokenVersion')

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    res.json({ success: true, message: 'Empleada reactivada correctamente', data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/employees/profile (edición propia) ─────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Solo permitimos campos que el usuario puede autogestionar
    const { nombre, foto, password, email, currentPassword } = req.body;

    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (foto) updates.foto = foto;
    if (email) updates.email = email;
    
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Debes ingresar tu contraseña actual para establecer una nueva.' });
      }

      // Obtener el hash actual (el middleware signToken no lo incluye por defecto)
      const employee = await Employee.findById(userId).select('+password');
      if (!employee || !employee.password) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado o sin contraseña configurada' });
      }

      const isMatch = await bcrypt.compare(currentPassword, employee.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
      }

      updates.password = await bcrypt.hash(password, 12);
    }

    // El filtro findById + userId garantiza que solo edite su propio perfil
    const employee = await Employee.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password'); // no devolver password

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, message: 'Perfil actualizado correctamente', data: employee });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/employees/:id/disponibilidad ──────────────────────────────────
const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { disponibleHoy } = req.body;

    // Solo admin puede cambiar disponibilidad de otros; empleada solo la suya
    if (req.user.role === 'empleada' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: { disponibleHoy } },
      { new: true, runValidators: true }
    ).select('nombre disponibleHoy');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    res.json({ 
      success: true, 
      message: `Disponibilidad actualizada para ${employee.nombre}`, 
      data: employee 
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getOne, create, update, deactivate, reactivate, updateProfile, updateAvailability }
