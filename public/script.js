const socket = io()

const name_input = document.getElementById('name-input')
const submit_button = document.getElementById('submit-button')
const identifier = document.getElementById('identifier')
const name_message = document.getElementById('name-message')
const online_counter = document.getElementById('online-counter')
const message_box = document.getElementById('message-box') 
const text = document.getElementById('text')
const room_name = document.getElementById('room_name')
const rooms = document.getElementsByClassName('room_button')
const smalls = document.getElementsByTagName('small')
const loading = document.getElementById('loading')
const loader = document.getElementById('lds-ellipsis')

let name = ''
let selected_room = 'general'

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

// Receiving old messages from DB
socket.on('history', messages => {
    console.log(messages)
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

// Send name to server on enter
name_input.addEventListener('keypress', e => {
    if (e.keyCode == 13) {
        e.preventDefault()
        let username = name_input.value
        // check if name is too long (max 20 characters)
        if (username.length > 20) {
            name_message.innerText = 'Name exceeds max characters (20).'
        // check if only white space
        } else if (!(/\S/gm).test(username)) {
            name_message.innerText = 'Name needs to have at least one character.'
        } else {
            socket.emit('name', username.trim())
        }
    }
})

// send name to server on submit
submit_button.addEventListener('click', e => {
    e.preventDefault()
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

// Add event listener to room buttons
Array.from(rooms).forEach(button => {
    button.addEventListener('click', e => {
        e.preventDefault()
        socket.emit('change', button.id)
        selected_room = button.id
        // delete all children of text to delete messages since changing rooms
        while (text.lastElementChild)
            text.removeChild(text.lastElementChild)
        // transition start for text
        loading.style.visibility = 'visible'
        loading.classList.add('show')
        loader.childNodes.forEach(child => {
            child.style.animationPlayState = 'running'
        })
        setTimeout(() => {
            loading.classList.remove('show')
        }, 500)
        setTimeout(() => {
            loading.style.visibility = 'hidden'
            loader.childNodes.forEach(child => {
                child.style.animationPlayState = 'paused'
            })
        }, 1000)
        // transition end for text
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
})