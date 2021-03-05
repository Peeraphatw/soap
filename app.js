const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')

//config
const config = require('./config')

//routers
const userRoutes = require('./routes/v2/user')
const trainingRoutes = require('./routes/v2/training')
const filterRoutes = require('./routes/v2/filter')
const recordTimeRoutes = require('./routes/v2/recordsTime')
const callRoutes = require('./routes/v2/call')

const app = express()
const port = process.env.PORT || 7000

//Middleware
app.use(logger('common'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

//Routers
app.get('/', (req, res) => {
  res.json({ message: 'Wellcome To Training Register System' })
})
app.use('/api/v2/call', callRoutes)
app.use('/api/v2/users', userRoutes)
app.use('/api/v2/trainings', trainingRoutes)
app.use('/api/v2/filters', filterRoutes)
app.use('/api/v2/recordsTime', recordTimeRoutes)
app.use('*', (req, res) => res.status(404).json({ message: 'Not Found!' }))

app.listen(port, () => {
  console.log(`api is running on port ${port}`)
})
