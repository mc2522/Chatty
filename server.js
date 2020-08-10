const path = require('path')
const express = require('express')
const app = express()
//const server = require('http').server(app)
//const io = require('socket.io')(server)

require('dotenv').config()

// static files
app.use(express.static(path.join(__dirname, 'public')))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`))