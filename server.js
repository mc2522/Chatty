const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')

// DB storage
const { createModel, deleteCollection, randomColorPicker } = require('./util')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('dotenv').config()

// Stores all in-use names
const names = new Set()
// Stores all sockets
const sockets = new Map()
// Stores all rooms and their respective storages
const rooms = new Map()

// create storage for general because it is default room
rooms.set('general', { DB: createModel('general'), last_added: null } )

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    // upon connection, join general room at default
    socket.join('general')
    sockets.set(socket, null)
    // TEST console.log(sockets.size)
    // send number of users data to newly connected socket
    io.emit('numberUsers', sockets.size)
    // send message to all sockets
    socket.on('message', message => {
        let socketProps = sockets.get(socket)
        if (socketProps != null && socketProps.name != null) {
            // store message
            let selected_room = rooms.get(message.room_name)
            if (selected_room != undefined) {
                selected_room.last_added = Date.now()
                selected_room.DB({
                    name: socketProps.name,
                    message: message.content
                }).save((err, data) => {
                    if (err) throw err
                    console.log(data)
                })
                /**
                 * TODO: DECIDE IF DELETE WILL BE BASED ON LAST ADDED MESSAGE TIME ON MESSAGE BASE OR ROOM BASE
                 */
            } else {
                rooms.set(message.room_name, { DB: createModel(message.room_name), last_added: Date.now() })
                rooms.get(message.room_name).DB({
                    name: socketProps.name,
                    message: message.content
                }).save((err, data) => {
                    if (err) throw err
                    console.log(data)
                })
            }

            io.emit('message', {
                'name': socketProps.name,
                'color': socketProps.color,
                'content': message.content
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