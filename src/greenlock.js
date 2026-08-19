import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import greenlockExpress from 'greenlock-express'
import CONFIG from './config/config.js'
import loggers from './utils/logger.js'
import packageJson from '../package.json' with { type: 'json' }

const { logger, loggerProcess } = loggers
const packageAgent = `${packageJson.name}@${packageJson.version}`

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const configDir = resolve(__dirname,'..', CONFIG.GREENLOCK_CONFIG_DIR) || resolve(__dirname, '../greenlock.d')
async function createGreenlock() {
  try {
    const lex = greenlockExpress.init({
      staging: process.env.ACME_STAGING === 'true',
      port: CONFIG.PORT,
      packageRoot: resolve(__dirname, '..'),
      configDir: configDir,
      maintainerEmail: CONFIG.CERT_EMAIL_ADDRESS,
      cluster: false,
      packageAgent: packageAgent
    })

    logger.info('Greenlock has been initialized successfully.')
    return lex
  } catch (error) {
    logger.error(`Greenlock initialization failed: ${error.message}`)
    return null
  }
}

export default createGreenlock
