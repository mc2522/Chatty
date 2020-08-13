const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('dotenv').config()

// stores all in-use names
const names = new Set()
// stores all sockets
const sockets = new Map()

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    sockets.set(socket, null)
    // TEST console.log(sockets.size)
    // send number of users data to newly connected socket
    io.emit('numberUsers', sockets.size)
    // send message to all sockets
    socket.on('message', message => {
        let name = sockets.get(socket)
        if (name != null) {
            io.emit('message', `${name}: ${message}`)
        } else {
            io.emit('reload', true)
        }
    })
    // check if name exists already, then add as appropriate
    socket.on('name', name => {
        if (names.has(name)) {
            // notify socket that username is unavailable
            socket.emit('user', false)
        } else {
            names.add(name)
            // replace pairs
            sockets.delete(socket)
            sockets.set(socket, name)
            // notify socket that username is available
            socket.emit('user', true)
            // if users' size increases, send new number of users to all sockets
            io.emit('numberUsers', sockets.size)
            // TEST console.log(sockets.size)
            // TEST console.log(names)
        }
    })
    // on disconnect, remove the socket and name
    socket.on('disconnect', () => {
        // remove name from in-use names
        let name = sockets.get(socket)
        if (name != null)
            names.delete(name)
        // remove socket pair
        sockets.delete(socket)
        // if users' size decreases, send new number of users to all sockets
        io.emit('numberUsers', sockets.size)
        // TEST console.log(sockets.size)
        // TEST console.log(names)
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`))