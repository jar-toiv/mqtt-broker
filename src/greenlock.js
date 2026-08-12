import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import greenlockExpress from 'greenlock-express'
import CONFIG from './config/config.js'
import loggers from './utils/logger.js'

const { logger, loggerProcess } = loggers
import packageJson from '../package.json' with { type: 'json' }
const packageAgent = `${packageJson.name}@${packageJson.version}`

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')

async function createGreenlock() {
  try {
    const lex = greenlockExpress.init({
      port: process.env.PORT,
      packageRoot: packageRoot,
      configDir: resolve(packageRoot, 'greenlock.d'),
      maintainerEmail: CONFIG.CERT_EMAIL_ADDRESS || 'toivanen@protonmail.com',
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
