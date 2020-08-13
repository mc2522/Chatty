const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('dotenv').config()

const users = new Set()

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    socket.emit('numberUsers', users.size)
    socket.on('message', message => {
        io.emit('message', message)
    })
    socket.on('name', name => {
        console.log(users.has(name))
        if (users.has(name)) {
            socket.emit('user', false)
        } else {
            users.add(name)
            socket.emit('user', true)
            io.emit('numberUsers', users.size)
        }
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`))