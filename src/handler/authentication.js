import path from 'path'
import dotenv from 'dotenv'
import loggers from '../utils/logger.js'

const { logger } = loggers
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: path.resolve(envFile) })

const validateEnvVariables = () => {
  const envVariables = {
    MQTT_USERNAME: process.env.MQTT_USERNAME,
    MQTT_PASSWORD: process.env.MQTT_PASSWORD,
    TLS_AUTH_USER: process.env.TLS_AUTH_USER,
    TLS_AUTH_PASSWORD: process.env.TLS_AUTH_PASSWORD
  }

  for (const [key, value] of Object.entries(envVariables)) {
    if (!value || value.trim() === '') {
      logger.error(`${key} is not in defined environment variables`)
      return false
    }
  }
  return true
}

const setupAuthentication = () => {
  if (!validateEnvVariables()) {
    throw new Error(
      'Authentication setup failed due to missing environment variables'
    )
  }
  return {
    MQTT_USERNAME: process.env.MQTT_USERNAME,
    MQTT_PASSWORD: process.env.MQTT_PASSWORD,
    TLS_AUTH_USER: process.env.TLS_AUTH_USER,
    TLS_AUTH_PASSWORD: process.env.TLS_AUTH_PASSWORD
  }
}

const AUTHENTICATION = setupAuthentication()

export default AUTHENTICATION
