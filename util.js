const mongoose = require('mongoose')
const please = require('pleasejs')

require('dotenv').config()

// Stores all rooms and their respective storages
const rooms = new Map()

// Create new mongoose model
const createModel = room_name => {
    const schema = new mongoose.Schema({
        name: String,
        message: String,
        time: Number
    }, { collection: room_name, size: 5000 }) 
    rooms.set(room_name, new mongoose.model(room_name, schema))
}

// Delete collection with name of room_name
const deleteCollection = room_name => {
    mongoose.connection.db.dropCollection(room_name, err => {
        if (err) console.error(err)
        console.log(`${room_name} was dropped.`)
    })
}

// Clears all content in a collection or clear old messages depending on everything boolean
const clearCollection = model => {
    model.deleteMany({}, err => {
        if (err) console.error(err)
    })
}

// Gets all messages in the room
const getMessages = room_name => {
    let selected_room = rooms.get(room_name)
    if (selected_room != undefined) {
        selected_room.find({}).then(results => {
            return results
        }).catch(err => {
            console.error(err)
        })
    }
    return []
}

// Save message in the correct collection
const saveMessage = (room_name, name, message) => {
    let selected_room = rooms.get(room_name)
    if (selected_room != undefined) {
        selected_room({
            name: name,
            message: message,
            time: Date.now()
        }).save(err => {
            if (err) console.error(err)
        })
    } else {
        // create room storage and save message
        createModel(room_name)
        rooms.get(room_name)({
            name: name,
            message: message,
            time: Date.now()
        }).save(err => {
            if (err) console.error(err)
        })
    }
}

// Choose a random color for name display
const randomColorPicker = () => {
    return please.make_color({
        saturation: 1,
        value: 1,
        golden: false,
        format: 'hex'
    })
}

// MongoDB setup
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@data-stno8.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// Upon connecting, delete all unused collections
mongoose.connection.on('open', () => {
    console.log('Connected to Mongo.')
    // get collection names
    mongoose.connection.db.listCollections().toArray(async (err, names) => {
        if (err) console.error(err)
        for (let i = 0; i < names.length; i++) {
            let collection_name = names[i].name
            // check if collection should be deleted
            if (collection_name != 'general') {
                deleteCollection(collection_name)
            } else {
                clearCollection(rooms.get('general'))
            }
        }
    })
    // Every minute, delete old messages in DB for every model/room
    setInterval(() => {
        for (let model of rooms.values()) {
            model.deleteMany({ time: { $lte: (Date.now() - 1200000) } }, err => {
                if (err) console.error(err)
            })
        }
    }, 60000)
})

module.exports = {
    createModel,
    getMessages,
    randomColorPicker,
    saveMessage
}