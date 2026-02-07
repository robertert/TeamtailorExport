import pino from 'pino';
import { getRequestId } from './requestContext';

const env = process.env.NODE_ENV ?? 'development';

const level: Record<string, string> = {
  development: 'debug',
  production: 'info',
  test: 'silent',
};

export const logger = pino({
  level: level[env] ?? 'info',
  mixin() {
    const requestId = getRequestId();
    return requestId ? { requestId } : {};
  },
  ...(env === 'development' && {
    transport: {
      target: 'pino-pretty',
    },
  }),
});
