const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI

    if (!uri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno')
    }

    const conn = await mongoose.connect(uri, {
      // Opciones recomendadas para MongoDB Atlas
      serverSelectionTimeoutMS: 5000,
    })

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message)
    console.log('⚠️ El servidor continuará ejecutándose sin conexión a base de datos (modo scaffold).')
  }
}

module.exports = connectDB
