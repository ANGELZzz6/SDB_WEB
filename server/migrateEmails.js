const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');

async function migrate() {
  try {
    console.log('--- Iniciando migración de emails de Empleadas ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB...');

    const employees = await Employee.find({ email: { $exists: false } });
    console.log(`Encontradas ${employees.length} empleadas sin configuración de email.`);

    for (const emp of employees) {
      // Create a normalized temporary email based on their name
      const normalizedName = emp.nombre.toLowerCase().replace(/\s+/g, '.').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const newEmail = `${normalizedName}.${emp._id.toString().slice(-4)}@salon.local`;
      
      emp.email = newEmail;
      await emp.save();
      console.log(`Actualizada: ${emp.nombre} -> ${newEmail}`);
    }

    console.log('Migración completada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error migrando empleadas:', err);
    process.exit(1);
  }
}

migrate();
