import express from 'express'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename) // this is to get the current directory name

const PORT = process.env.PORT || 3500
const app = express()

app.use(express.static(path.join(__dirname, 'public'))) // bc we use modules we need to use __dirname to get the current directory name with the path.dirname method

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port http://localhost:${PORT}`)
})


const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500'] // this is to allow the connection from the client side, we can also use * to allow all connections
    }
})

//when we use on it means we are listening for an event

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`)

    // Upon connection - only to user that connected
    socket.emit('message', "Welcome to the chat")  //socket. is used to send the data to a specific user

    // Upon connection - to all others
    socket.broadcast.emit('message',`${socket.id.substring(0,5)} connected` ) //socket.broadcast. is used to send the data to all users except the user that connected


    // Listening for a message event
    socket.on('message', (data) => {
        console.log(data)
        io.emit('message', `${socket.id.substring(0, 5)} : ${data}`) //io. is used to send the data to all users
    })

    // When user dcs - to all users
    socket.on('disconnect',()=> {
        socket.broadcast.emit('message', `${socket.id.substring(0, 5)} disconnected`)
    })

    //Listen for activity
    socket.on('activity', (name) => {
        socket.broadcast.emit('activity', name)
    })
})
