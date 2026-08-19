import net from 'net'
import aedes from 'aedes'
import tls from 'tls'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import loggers from '../utils/logger.js'
import CONFIG from '../config/config.js'

const DOMAIN = CONFIG.CERT_DOMAIN
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isProd = CONFIG.NODE_ENV === 'production'

const { logger, loggerProcess } = loggers

const setupMqttBroker = () => {
  try {
    const PORT = CONFIG.MQTT_PORT
    const HOST = CONFIG.MQTT_HOST
    const broker = aedes()

    broker.authenticate = (client, username, password, callback) => {
      const validUsername = CONFIG.MQTT_USERNAME
      const validPassword = CONFIG.MQTT_PASSWORD

      if (username === validUsername && password.toString() === validPassword) {
        loggerProcess.initProcess('Authentication: OK')
        callback(null, true)
      } else {
        callback(null, false)
      }
    }

    let server

    if (isProd) {
      const keyPath = path.resolve(
        __dirname,
        `../../greenlock.d/live/${DOMAIN}/privkey.pem`
      )
      const chainPath = path.resolve(
        __dirname,
        `../../greenlock.d/live/${DOMAIN}/chain.pem`
      )
      const certPath = path.resolve(
        __dirname,
        `../../greenlock.d/live/${DOMAIN}/cert.pem`
      )

      const key = fs.readFileSync(keyPath, 'utf8')
      const chain = fs.readFileSync(chainPath, 'utf8')
      const cert = fs.readFileSync(certPath, 'utf8')

      server = tls.createServer({ key, cert, ca: chain }, broker.handle)
    } else {
      server = net.createServer(broker.handle)
    }
    server.listen(PORT, HOST, () => {
      loggerProcess.initProcess(
        `MQTT broker is up at ${HOST}:${PORT} (${
          isProd ? 'TLS' : 'plain, dev only'
        })`
      )
    })

    broker.on('client', client => {
      loggerProcess.process(`Client connected: ${client.id}`)
    })
    broker.on('clientDisconnect', client => {
      loggerProcess.process(`Client disconnected: ${client.id}`)
    })
    broker.on('publish', (packet, client) => {
      if (client) {
        loggerProcess.process(
          `Received MESSAGE from: ${client.id} TOPIC: ${
            packet.topic
          } PAYLOAD: ${packet.payload.toString()}`
        )
      }
    })

    return broker
  } catch (error) {
    logger.error(`MQTT Broker setup failed: ${error.message}`)
  }
}

export default setupMqttBroker
