const socket = io('ws://localhost:3500')

const activity = document.querySelector('.activity')
const msgInput = document.querySelector('input')

const sendMessage = (event) => {
    event.preventDefault()  //this is so it submits the form without reloading the page
    if (msgInput.value) {
        socket.emit('message', msgInput.value)
        msgInput.value = '' // after sending we want to clear the input for the next message
    }
    msgInput.focus()
}


document.querySelector('form').addEventListener('submit', sendMessage)


// Listen for messages

socket.on('message', (data) =>{
    activity.textContent = ''
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
})


msgInput.addEventListener('keypress', () => {
    socket.emit('activity', socket.id.substring(0, 5))
})


let activityTimer

socket.on('activity', (name) => {
    activity.textContent = `${name} is typing...`
    // Clear after 2 secs
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ''
    }, 2000)

})


