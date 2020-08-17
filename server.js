const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')

// DB storage
const { createModel, randomColorPicker, saveMessage, getMessages } = require('./util')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('dotenv').config()

app.use(express.static(path.join(__dirname, 'public')));

// Stores all in-use names
const names = new Set()
// Stores all sockets
const sockets = new Map()

// create storage for general because it is default room
createModel('general')

io.on('connection', socket => {
    // upon connection, join general room at default
    socket.join('general')
    sockets.set(socket, {
        'name': null,
        'color': null,
        'room': 'general'
    })
    // send number of users data to newly connected socket
    io.emit('numberUsers', sockets.size)
    // send message to all appropriate sockets through rooms
    socket.on('message', message => {
        let socketProps = sockets.get(socket)
        if (socketProps != null && socketProps.name != null) {
            saveMessage(message.room_name, socketProps.name, message.content)
            // send message to all sockets TODO rooms
            io.to(message.room_name).emit('message', {
                'name': socketProps.name,
                'color': socketProps.color,
                'content': message.content
            })
        } else {
            socket.emit('reload', true)
        }
    })
    // On change to another room, send backlog of messages
    socket.on('change', room_name => {
        let val = sockets.get(socket)
        // check if this user is already identified before proceeding
        if (val != null && val.name != null && val.color != null && val.room != null) {
            let prev_room = val.room
            let name = val.name
            let color = val.color
            sockets.delete(socket)
            sockets.set(socket, {
                'name': name,
                'color': color,
                'room': room_name
            })
            // if the room is different then change
            if (room_name != prev_room) {
                socket.leave(prev_room)
                socket.join(room_name)
            }
            // send a backlog of messages
            getMessages(room_name, socket)
            //socket.emit('history', getMessages(room_name))
        // something is wrong, reload
        } else {
            socket.emit('reload', true)
        }
    }) 
    // Check if name exists already, then add as appropriate
    socket.on('name', name => {
        if (names.has(name)) {
            // notify socket that username is unavailable
            socket.emit('user', false)
        } else {
            names.add(name)
            // replace value
            sockets.delete(socket)
            sockets.set(socket, {
                'name': name,
                'color': randomColorPicker(),
                'room': 'general'
            })
            // notify socket that username is available
            socket.emit('user', true)
            // if users' size increases, send new number of users to all sockets
            io.emit('numberUsers', sockets.size)
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
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`))