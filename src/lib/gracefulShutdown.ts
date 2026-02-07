import type { Server } from 'http';
import { logger } from './logger';

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Rejestruje obsługę CTRL+C (SIGINT) oraz SIGTERM i zamyka serwer HTTP przed zakończeniem procesu.
 */
export function registerGracefulShutdown(
  server: Server,
  timeoutMs: number = DEFAULT_SHUTDOWN_TIMEOUT_MS,
): void {
  function shutdown(signal: string) {
    logger.info({ signal }, 'shutdown signal received, closing server');

    const forceExit = setTimeout(() => {
      logger.error('shutdown timed out, forcing exit');
      process.exit(1);
    }, timeoutMs);
    forceExit.unref();

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
