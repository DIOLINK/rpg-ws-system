import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // URI local por defecto si no hay variable de entorno
    const localURI = 'mongodb://localhost:27017/rpg-ws-system';
    const uri = process.env.MONGODB_URI || localURI;

    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado localmente en:', uri);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};
