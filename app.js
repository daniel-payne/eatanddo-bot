const express    = require('express')
const app        = express()
const bodyParser = require('body-parser')

const { connector } = require('./connector')

const portHTTP = process.env.port || 3854

const allowCrossDomain = function (req, res, next) {

  res.header('Access-Control-Allow-Origin',  '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')

  res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.header('Pragma',        'no-cache')
  res.header('Expires',       '0')

  next()
}

app.use(allowCrossDomain)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.text())

app.get('/test', function (req, res) {
  res.send('{"serverTime": "' + (new Date()).toISOString().slice(0, 19) + '"}')
})

app.post('/api/messages', connector.listen())

app.listen(portHTTP, function () {
  console.log('HTTP http://localhost:' + portHTTP) //eslint-disable-line no-console
})

 


