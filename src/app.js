import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import basicAuth from 'express-basic-auth'
import express from 'express'
import AUTH from './handler/authentication.js'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: 'https:broker.jarmo.site',
    methods: 'GET, POST',
    credentials: true
  })
)

app.use(
  basicAuth({
    users: { [AUTH.TLS_AUTH_USER]: AUTH.TLS_AUTH_PASSWORD },
    challenge: true
  })
)

app.get('/', loginLimiter, (req, res) => {
  res.json({ message: 'Broker says hello' })
})

app.use((err, req, res, next) => {
  console.error(`Internal Server Error: ${err.message}`)
  res.status(500).json('Internal Server Error')
})

export default app
