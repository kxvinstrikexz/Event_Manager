import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'campusevents_super_secure_jwt_secret_key_2026_un1v3rs1ty',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
