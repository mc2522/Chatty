const socket = io()

const container = document.getElementById('container')
const name_input = document.getElementById('name-input')
const submit_button = document.getElementById('submit-button')
const identifier = document.getElementById('identifier')
const name_message = document.getElementById('name-message')
const online_counter = document.getElementById('online-counter')
const message_box = document.getElementById('message-box') 
const text = document.getElementById('text')
const rooms_container = document.getElementById('rooms_container')
const room_name = document.getElementById('room_name')
const rooms = document.getElementsByClassName('room_button')
const smalls = document.getElementsByTagName('small')
const room_loading = document.getElementById('room_loading')
const room_loader = document.getElementById('room-lds-ellipsis')
const loading = document.getElementsByClassName('loading')
const add_room_button = document.getElementById('add-room')
const add_room_div = document.getElementById('add-room-div')
const room_input = document.getElementById('room-input')
const room_message = document.getElementById('room-message')
const room_submit_buttom = document.getElementById('room-submit-button')
const loader = document.getElementsByClassName('lds-ellipsis')
const cancel_room_button = document.getElementById('cancel-room-button')
const delete_room_div = document.getElementById('delete-room-div')
const delete_room_button = document.getElementById('delete_room')
const decline_delete = document.getElementById('decline-delete')
const confirm_delete = document.getElementById('confirm-delete')

let name = ''
let selected_room = 'General'

// Adds event listener to button argument which procs the loading screen and changes chat
const addButtonEventListener = button => {
    button.addEventListener('click', e => {
        e.preventDefault()
        socket.emit('change', button.innerText)
        selected_room = button.innerText
        // delete all children of text to delete messages since changing rooms
        setTimeout(() => {
            while (text.lastElementChild)
                text.removeChild(text.lastElementChild)
        }, 550)
        // transition start for text
        Array.from(loading).forEach(element => {
            element.style.visibility = 'visible'
            element.classList.add('show')
        })
        Array.from(loader).forEach(element => {
            element.childNodes.forEach(child => {
                child.style.animationPlayState = 'running'
            })
        })
        // transition start for room name
        room_name.classList.add('hide')
        setTimeout(() => {
            room_name.innerText = button.innerText
        }, 250)
        setTimeout(() => {
            room_name.classList.remove('hide')
        }, 250)
        // transition end for room name
    })
}

// Checks if the name is valid length-wise and emits name to server
const nameEvent = () => {
    let username = name_input.value
    // check if name is too long (max 20 characters)
    if (username.length > 20) {
        name_message.innerText = 'Name exceeds max characters (20).'
    // check if only white space
    } else if (!(/\S/gm).test(username)) {
        name_message.innerText = 'Name needs to have at least one character.'
    } else {
        // send name to server for verification
        socket.emit('name', username.trim())
    }
}

// Checks if the name is valid length-wise and emits name to server
const addRoomEvent = () => {
    let check = room_input.value.trim()
    if (check.length > 10) {
        room_message.innerText = 'Room name exceeds max characters (10).'
    // check if only white space
    } else if ((/\S/gm).test(check)) {
        socket.emit('create-room', check)
    } else {
        room_message.innerText = 'Room name needs to have at least one character.'
    }
}

// Stop loading in chat
const stopLoading = () => {
    setTimeout(() => {
        Array.from(loading).forEach(element => {
            element.classList.remove('show')
        })
    }, 500)
    setTimeout(() => {
        Array.from(loading).forEach(element => {
            element.style.visibility = 'hidden'
        })
        Array.from(loader).forEach(element => {
            element.childNodes.forEach(child => {
                child.style.animationPlayState = 'paused'
            })
        })
    }, 1000)
}

const removeDeleteRoomDiv = () => {
    delete_room_div.style.opacity = 0
    setTimeout(() => {
        delete_room_div.style.visibility = 'hidden'
    }, 500)
    container.classList.remove('background')
}

// When a message is received from server.js, display it in text 
socket.on('message', message => {
    let username = document.createElement('SMALL')
    username.classList.add('text-name')
    let content = document.createElement('SMALL')
    content.classList.add('text-message')
    let br = document.createElement('BR')
    // class added for transition effect
    username.classList.add('hide')
    content.classList.add('hide')
    // set text and styling
    username.innerText = message.name
    username.style.color = message.color
    content.innerText = message.content
    // add elements to text div
    text.appendChild(username)
    text.appendChild(content)
    text.appendChild(br)
    // transition to opacity: 1
    setTimeout(() => {
        username.classList.remove('hide')
        content.classList.remove('hide')
    }, 80)
    // auto scroll to bottom
    text.scrollTop = text.scrollHeight
})

socket.on('add-room', room_name => {
    // loading start
    room_loading.style.visibility = 'visible'
    room_loading.classList.add('show')
    room_loader.childNodes.forEach(child => {
        child.style.animationPlayState = 'running'
    })
    // add buttons
    setTimeout(() => {
        const btn = document.createElement('button')
        btn.innerText = room_name
        btn.classList.add('room_button')
        addButtonEventListener(btn)
        rooms_container.appendChild(btn)
        room_input.value = ""
    }, 550)
    // loading end
    setTimeout(() => {
        room_loading.classList.remove('show')
    }, 700)
    setTimeout(() => {
        room_loading.style.visibility = 'hidden'
        room_loader.childNodes.forEach(child => {
            child.style.animationPlayState = 'paused'
        })
    }, 1200)
})

// Receiving old messages from DB
socket.on('history', messages => {
    if (messages == null) {
        setTimeout(() => {
            stopLoading()
        }, 300)
    } else {
        setTimeout(() => {
            Array.from(messages).forEach(message => {
                let username = document.createElement('SMALL')
                username.classList.add('text-name')
                let content = document.createElement('SMALL')
                content.classList.add('text-message')
                let br = document.createElement('BR')
                // set text and styling
                username.innerText = message.name
                username.style.color = '#5c6778'
                content.innerText = message.message
                // add elements to text div
                text.appendChild(username)
                text.appendChild(content)
                text.appendChild(br)
                // auto scroll to bottom
                text.scrollTop = text.scrollHeight
            })
            // once messages are loaded, stop loading
            stopLoading()
        }, 555)
    }
})

// Update number of users online TO BE IMPLEMENTED
socket.on('numberUsers', number => {
    online_counter.innerText = `${number} online`
})

// Check if user has been taken, assign if false
socket.on('user', valid => {
    trimName = name_input.value.trim()
    if (valid) {
        // reveal chat
        identifier.style.opacity = "0";
        // set name and disable interactivity with the identifier div
        setTimeout(() => {
            name = trimName
            identifier.style.visibility = "hidden";
        }, 500)
    } else {
        name = trimName
        // message to user
        name_message.innerText = 'Name has been taken already, select another name.'
    }
})

// If reload, refresh the window because the user is somehow typing in a chat without id
socket.on('reload', reload => {
    if (reload) {
        window.location.replace('/')
    }
})

socket.on('create-room', valid => {
    if (valid) {
        room_message.innerText = ""
        add_room_div.classList.remove('reveal')
        container.classList.remove('background')
        setTimeout(() => {
            add_room_div.style.visibility = 'hidden';
        }, 500)
    } else {
        room_message.innerText = "Room name has been taken already, select another room name."
    }
})

// Send name to server on enter
name_input.addEventListener('keypress', e => {
    if (e.keyCode == 13) {
        e.preventDefault()
        nameEvent()
    }
})

// send name to server on submit
submit_button.addEventListener('click', e => {
    e.preventDefault()
    nameEvent()
})

// Press enter to send message and clear input 
message_box.addEventListener('keypress', e => {
    if (e.keyCode == 13) {  
        e.preventDefault()
        // check if only white space
        if ((/\S/gm).test(message_box.value)) {
            socket.emit('message', {
                room_name: selected_room, 
                content: message_box.value
            })
        }
        message_box.value = ""
    }
})

// Add event listener to add room button
add_room_button.addEventListener('click', e => {
    container.classList.add('background')
    add_room_div.style.visibility = 'visible';
    add_room_div.classList.add('reveal')
})

// Add event listener to input field for enter for adding room
room_input.addEventListener('keypress', e => {
    if (e.keyCode == 13) {
        e.preventDefault()
        addRoomEvent()
    }
})

// Add event listener to submit button for adding room
room_submit_buttom.addEventListener('click', e => {
    e.preventDefault()
    addRoomEvent()
})

// Add event listener to cancel room button
cancel_room_button.addEventListener('click', e => {
    add_room_div.classList.remove('reveal')
    container.classList.remove('background')
    setTimeout(() => {
        add_room_div.style.visibility = 'hidden';
    }, 500)
    room_message.innerText = ""
    room_input.value = ""
})

// Add event listener to delete room button to make confirmation div appear
delete_room_button.addEventListener('click', e => {
    e.preventDefault()
    delete_room_div.style.visibility = 'visible'
    delete_room_div.style.opacity = 1
    container.classList.add('background')
})

// Button to not delete room
decline_delete.addEventListener('click', e => {
    e.preventDefault()
    removeDeleteRoomDiv()
})

// Button to confirm delete room
confirm_delete.addEventListener('click', e => {
    e.preventDefault()
    // notify server to delete the room
    socket.emit('delete-room', selected_room)
    removeDeleteRoomDiv()
})

// Add event listener to room buttons
Array.from(rooms).forEach(button => {
    addButtonEventListener(button)
})