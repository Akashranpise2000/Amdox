const mongoose = require('mongoose');

let connectionState = {
  isConnected: false,
  lastConnected: null,
  lastError: null,
  connectionAttempts: 0
};

const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  family: 4,
};

const connectToDatabase = async () => {
  try {
    connectionState.connectionAttempts++;
    
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string is not defined. Please set MONGODB_URI in your environment variables.');
    }
    
    const sanitizedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`Attempting to connect to MongoDB: ${sanitizedURI}`);
    
    const conn = await mongoose.connect(mongoURI, connectionOptions);
    
    connectionState.isConnected = true;
    connectionState.lastConnected = new Date();
    connectionState.lastError = null;
    
    console.log(`MongoDB Connected Successfully`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    return conn;
    
  } catch (error) {
    connectionState.isConnected = false;
    connectionState.lastError = error.message;
    
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }
};

const testConnection = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    console.log('Database connection test passed');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    connectionState.lastError = error.message;
    throw error;
  }
};

const getHealthCheckData = () => {
  const readyState = mongoose.connection.readyState;
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: readyState === 1 ? 'healthy' : 'unhealthy',
    readyState: readyStateMap[readyState] || 'unknown',
    isConnected: connectionState.isConnected,
    lastConnected: connectionState.lastConnected,
    lastError: connectionState.lastError,
    connectionAttempts: connectionState.connectionAttempts,
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    port: mongoose.connection.port || null
  };
};

const disconnectFromDatabase = async () => {
  try {
    await mongoose.connection.close();
    connectionState.isConnected = false;
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  }
};

mongoose.connection.on('connected', () => {
  connectionState.isConnected = true;
  connectionState.lastConnected = new Date();
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  connectionState.lastError = err.message;
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  connectionState.isConnected = false;
  console.warn('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  connectionState.isConnected = true;
  connectionState.lastConnected = new Date();
  console.log('Mongoose reconnected to MongoDB');
});

module.exports = {
  connectToDatabase,
  testConnection,
  getHealthCheckData,
  disconnectFromDatabase
};
