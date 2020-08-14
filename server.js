const http = require('http')
const path = require('path')
const please = require('pleasejs')
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('dotenv').config()

// Stores all in-use names
const names = new Set()
// Stores all sockets
const sockets = new Map()

app.use(express.static(path.join(__dirname, 'public')));

// Chooses a random color for each user to be displayed when chatting
const randomColorPicker = () => {
    return please.make_color({
        saturation: 1,
        value: 1,
        golden: false,
        format: 'hex'
    })
}

io.on('connection', socket => {
    sockets.set(socket, null)
    // TEST console.log(sockets.size)
    // send number of users data to newly connected socket
    io.emit('numberUsers', sockets.size)
    // send message to all sockets
    socket.on('message', message => {
        let socketProps = sockets.get(socket)
        if (socketProps != null && socketProps.name != null) {
            io.emit('message', {
                'name': socketProps.name,
                'color': socketProps.color,
                'content': message
            })
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
            sockets.set(socket, {
                'name': name,
                'color': randomColorPicker()
            })
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
        let s = sockets.get(socket)
        if (s != null) 
            names.delete(s.name)
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

/**
 * Plan:
 * 
 * Use store.js to store messages in each room
 * Each room will remain for 15 minutes since last active message
 * Each room will store 250 messages
 */