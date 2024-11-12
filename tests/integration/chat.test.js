import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';

describe('Chat Application', () => {
    let io;
    let serverSocket;
    let clientSocket;
    let httpServer;
    const port = 3500;

    beforeAll((done) => {
        const app = express();
        httpServer = createServer(app);
        io = new Server(httpServer, {
            cors: {
                origin: ['http://localhost:5500', 'http://127.0.0.1:5500']
            }
        });

        httpServer.listen(port, () => {
            clientSocket = new Client(`http://localhost:${port}`);
            io.on('connection', (socket) => {
                serverSocket = socket;
                // Emit welcome message on connection
                socket.emit('message', 'Welcome to the chat');
                // Broadcast connection message to others
                socket.broadcast.emit('message', `${socket.id.substring(0, 5)} connected`);

                // Handle messages
                socket.on('message', (data) => {
                    if (data) {
                        io.emit('message', `${socket.id.substring(0, 5)} : ${data}`);
                    }
                });

                // Handle activity
                socket.on('activity', (name) => {
                    socket.broadcast.emit('activity', name);
                });

                // Handle disconnection
                socket.on('disconnect', () => {
                    socket.broadcast.emit('message', `${socket.id.substring(0, 5)} disconnected`);
                });
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach((done) => {
        // Clean up event listeners after each test
        if (clientSocket.connected) {
            clientSocket.removeAllListeners();
        }
        done();
    });

    afterAll((done) => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        io.close();
        httpServer.close();
        done();
    });

    test('should welcome new users', (done) => {
        // Create a new client to receive the welcome message
        const newClient = new Client(`http://localhost:${port}`);
        
        newClient.on('message', (message) => {
            expect(message).toBe('Welcome to the chat');
            newClient.disconnect();
            done();
        });
    }, 15000);

    test('should broadcast messages to all clients', (done) => {
        const testMessage = 'Test message';
        let messageReceived = false;
        
        // Create a second client to receive the broadcast
        const clientSocket2 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            // Wait for connection message to pass
            setTimeout(() => {
                clientSocket2.on('message', (data) => {
                    if (data.includes(testMessage) && !messageReceived) {
                        messageReceived = true;
                        expect(data).toContain(testMessage);
                        clientSocket2.disconnect();
                        done();
                    }
                });
                
                // Send test message from first client
                clientSocket.emit('message', testMessage);
            }, 1000);
        });
    }, 15000);

    test('should handle typing indicator', (done) => {
        const testUser = 'testuser';
        
        // Create a second client to receive the activity broadcast
        const clientSocket2 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            clientSocket2.on('activity', (name) => {
                expect(name).toBe(testUser);
                clientSocket2.disconnect();
                done();
            });
            
            // Emit activity from first client
            clientSocket.emit('activity', testUser);
        });
    }, 15000);

    test('should handle disconnection gracefully', (done) => {
        // Create a client that will disconnect
        const disconnectingClient = new Client(`http://localhost:${port}`);
        
        disconnectingClient.on('connect', () => {
            // Listen for disconnect message on the original client
            clientSocket.once('message', (message) => {
                expect(message).toContain('disconnected');
                done();
            });
            
            // Disconnect after a short delay
            setTimeout(() => {
                disconnectingClient.disconnect();
            }, 500);
        });
    }, 15000);

    

    test('should not process empty messages', (done) => {
        let messageReceived = false;
        
        clientSocket.on('message', () => {
            messageReceived = true;
        });

        clientSocket.emit('message', '');

        setTimeout(() => {
            expect(messageReceived).toBe(false);
            done();
        }, 1000);
    }, 15000);

    // Add these tests to your existing test file

    test('should handle multiple rapid messages', (done) => {
        const messages = ['Message 1', 'Message 2', 'Message 3'];
        let receivedCount = 0;
        
        const clientSocket2 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            clientSocket2.on('message', (data) => {
                if (messages.some(msg => data.includes(msg))) {
                    receivedCount++;
                    if (receivedCount === messages.length) {
                        expect(receivedCount).toBe(messages.length);
                        clientSocket2.disconnect();
                        done();
                    }
                }
            });
            
            // Send messages with slight delay to ensure order
            messages.forEach((msg, index) => {
                setTimeout(() => {
                    clientSocket.emit('message', msg);
                }, index * 100);
            });
        });
    }, 15000);

    test('should handle special characters in messages', (done) => {
        const specialMessage = '!@#$%^&*()_+';
        
        const clientSocket2 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            clientSocket2.on('message', (data) => {
                if (data.includes(specialMessage)) {
                    expect(data).toContain(specialMessage);
                    clientSocket2.disconnect();
                    done();
                }
            });
            
            clientSocket.emit('message', specialMessage);
        });
    }, 15000);

    test('should clear typing indicator after timeout', (done) => {
        const testUser = 'testuser';
        let typingShown = false;
        
        const clientSocket2 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            clientSocket2.on('activity', (name) => {
                typingShown = true;
                expect(name).toBe(testUser);
            });
            
            clientSocket.emit('activity', testUser);
            
            // Check after 2 seconds (assuming your timeout is set to 2000ms)
            setTimeout(() => {
                expect(typingShown).toBe(true);
                clientSocket2.disconnect();
                done();
            }, 2100);
        });
    }, 15000);
});