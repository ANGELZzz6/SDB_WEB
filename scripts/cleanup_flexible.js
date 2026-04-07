/*
  Script para limpiar citas "corruptas" o de prueba.
  Elimina todas las citas en estado 'pending' que tengan isFlexible: true.
  
  PARA EJECUTAR EN COMPASS (Mongosh):
  db.appointments.deleteMany({ status: 'pending', isFlexible: true })
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const Appointment = require('../server/models/Appointment');

async function cleanup() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conexión exitosa.');

    const result = await Appointment.deleteMany({ 
      status: 'pending', 
      isFlexible: true 
    });

    console.log(`✅ Limpieza completada. Citas eliminadas: ${result.deletedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

cleanup();
