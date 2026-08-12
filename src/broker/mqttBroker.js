import net from 'net'
import aedes from 'aedes'
import tls from 'tls'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import loggers from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isProd = process.env.NODE_ENV === 'production'

const { logger, loggerProcess } = loggers

const setupMqttBroker = () => {
  try {
    const PORT = process.env.MQTT_PORT
    const HOST = process.env.MQTT_HOST
    const broker = aedes()

    broker.authenticate = (client, username, password, callback) => {
      const validUsername = process.env.MQTT_USERNAME
      const validPassword = process.env.MQTT_PASSWORD

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
        '../../greenlock.d/live/broker.jarmo.site/privkey.pem'
      )
      const chainPath = path.resolve(
        __dirname,
        '../../greenlock.d/live/broker.jarmo.site/chain.pem'
      )
      const certPath = path.resolve(
        __dirname,
        '../../greenlock.d/live/broker.jarmo.site/cert.pem'
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
