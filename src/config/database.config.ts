// Database Configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL || '',
  
  // Connection pool settings
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
  },
  
  // Query logging
  logging: process.env.DB_LOGGING === 'true',
  
  // Prisma specific
  prisma: {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
  },
};

export type DatabaseConfig = typeof databaseConfig;
export default databaseConfig;
