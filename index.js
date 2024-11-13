import express from 'express'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const app = express()

app.use(express.static(path.join(__dirname, 'public')))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port http://localhost:${PORT}`)
})

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500']
    }
})

// Message handling function following TDD
const handleMessage = (socket, data) => {
    if (!data || typeof data !== 'string' || data.trim().length === 0) {
        return false;
    }
    socket.emit('message', `${socket.id.substring(0, 5)} : ${data}`);
    return true;
};

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`)

    // Upon connection - only to user that connected
    socket.emit('message', "Welcome to the chat")

    // Upon connection - to all others
    socket.broadcast.emit('message',`${socket.id.substring(0,5)} connected` )

    // Listening for a message event - now using handleMessage function
    socket.on('message', (data) => {
        if (handleMessage(socket, data)) {
            // If message is valid, broadcast to all users
            io.emit('message', `${socket.id.substring(0, 5)} : ${data}`)
        }
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

// Export for testing
export { handleMessage }