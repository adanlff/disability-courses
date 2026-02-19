// Central configuration exports
export { appConfig } from './app.config';
export type { AppConfig } from './app.config';

export { databaseConfig } from './database.config';
export type { DatabaseConfig } from './database.config';

export { emailConfig } from './email.config';
export type { EmailConfig } from './email.config';

export { paymentConfig } from './payment.config';
export type { PaymentConfig } from './payment.config';

export { storageConfig } from './storage.config';
export type { StorageConfig } from './storage.config';

export { videoConfig } from './video.config';
export type { VideoConfig } from './video.config';

// Unified config object
import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { emailConfig } from './email.config';
import { paymentConfig } from './payment.config';
import { storageConfig } from './storage.config';
import { videoConfig } from './video.config';

export const config = {
  app: appConfig,
  database: databaseConfig,
  email: emailConfig,
  payment: paymentConfig,
  storage: storageConfig,
  video: videoConfig,
};

export default config;
