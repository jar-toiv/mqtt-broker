import app from './app.js'
import createGreenlock from './greenlock.js'
import setupMqttBroker from './broker/mqttBroker.js'
import loggers from './utils/logger.js'

const { logger } = loggers

const isProd = process.env.NODE_ENV === 'production'

async function startServer() {
  try {
    if (isProd) {
      const { default: createGreenlock } = await import('./greenlock.js')
      const lex = await createGreenlock()
      
      if (lex && typeof lex.serve === 'function') {
        logger.info('Starting server with Greenlock...')
        lex.serve(app)
      } else {
        logger.error('Greenlock initialization failed.')
        process.exit(1)
      }
    } else {
      const PORT = process.env.PORT || 8080
      app.listen(PORT, () => {
        logger.info(`Server is running on locally ${PORT}`)
      })
    }

    setupMqttBroker()
  } catch (error) {
    logger.error('Failed to start server', error)
  }
}

startServer()
