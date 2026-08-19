import winston from 'winston'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve('.env') })
const { combine, timestamp, label, printf, colorize } = winston.format

const logLevels = {
  error: 0,
  warn: 1,
  initProcess: 2,
  process: 3,
  info: 4,
  debug: 5
}

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  process: 'magenta',
  initProcess: 'cyan'
}

winston.addColors(logColors)

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(
    label({ label: 'MQTT-Listener-Warning/Error' }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    customFormat
  ),
  defaultMeta: { service: 'mqtt-listener' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxLevel: 'error',
      format: combine(timestamp(), customFormat),
      handleExceptions: false
    }),
    new winston.transports.File({
      filename: 'logs/warnings.log',
      level: 'warn',
      maxLevel: 'warn',
      format: combine(timestamp(), customFormat),
      handleExceptions: false
    })
  ]
})
const loggerProcess = winston.createLogger({
  levels: logLevels,
  level: 'process',
  format: combine(
    label({ label: 'MQTT-Listener-Process' }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    customFormat
  ),
  defaultMeta: { service: 'mqtt-listener-process' },
  transports: [
    new winston.transports.File({
      filename: 'logs/process.log',
      level: 'process',
      maxLevel: 'process',
      format: combine(timestamp(), customFormat),
      handleExceptions: false
    }),
    new winston.transports.File({
      filename: 'logs/initProcess.log',
      level: 'initProcess',
      maxLevel: 'initProcess',
      format: combine(timestamp(), customFormat),
      handleExceptions: false
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      level: 'error',
      format: combine(colorize({ all: true }), timestamp(), customFormat),
      handleExceptions: false
    })
  )
  loggerProcess.add(
    new winston.transports.Console({
      level: 'process',
      format: combine(colorize({ all: true }), timestamp(), customFormat),
      handleExceptions: false
    })
  )
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at promise: ${promise}. Reason: ${reason}.`)
})

logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' }),
  new winston.transports.Console({
    format: combine(colorize(), timestamp(), customFormat)
  })
)

export default { logger, loggerProcess }
