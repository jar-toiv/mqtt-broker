import path from 'path'
import dotenv from 'dotenv'
import loggers from '../utils/logger.js'

const { logger } = loggers

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: path.resolve(envFile) })

const requiredEnvVariables = [
  'MQTT_USERNAME',
  'MQTT_PASSWORD',
  'MQTT_HOST',
  'MQTT_PORT',
  'NODE_ENV',
  'CERT_EMAIL_ADDRESS',
  'CERT_DOMAIN',
  'GREENLOCK_CONFIG_DIR',
  'PORT'
]

for (const envVariable of requiredEnvVariables) {
  if (!process.env[envVariable] || process.env[envVariable].trim() === '') {
    logger.error(`${envVariable} is not defined in environment variables.`)
    throw new Error(`${envVariable} is not defined in environment variables.`)
  }
}

const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  CERT_EMAIL_ADDRESS: process.env.CERT_EMAIL_ADDRESS,
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
  MQTT_HOST: process.env.MQTT_HOST,
  MQTT_PORT: process.env.MQTT_PORT,
  CERT_DOMAIN: process.env.CERT_DOMAIN,
  GREENLOCK_CONFIG_DIR: process.env.GREENLOCK_CONFIG_DIR,
  PORT: process.env.PORT
}

export default CONFIG
