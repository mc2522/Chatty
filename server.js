const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('dotenv').config()

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    socket.on('message', message => {
        io.emit('message', message)
    })
    socket.on('name', name => {
        socket.emit(name)
        console.log(name)
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`))