import winston from 'winston';
import path from 'path';
import appRoot from 'app-root-path';

const { format, createLogger, transports } = winston;
const { timestamp, combine, printf, errors } = format;

const filePathInfo = path.join(`${appRoot}`, 'logger', 'info.log');
const filePathRunning = path.join(`${appRoot}`, 'logger', 'running.log');
const filePathError = path.join(`${appRoot}`, 'logger', 'error.log');

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level === 'info' ? `: ${level} :` : ':'} ${
    stack || message
  }`;
});

const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
});

logger.add(
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  })
);

logger.add(
  new transports.File({ filename: `${filePathError}`, level: 'error' })
);

logger.add(new transports.File({ filename: `${filePathInfo}`, level: 'info' }));

logger.add(
  new transports.File({ filename: `${filePathRunning}`, level: 'silly' })
);

export { logger };
