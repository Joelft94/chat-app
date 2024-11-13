import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';

describe('Chat Application Integration Tests', () => {
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
                socket.emit('message', 'Welcome to the chat');
                socket.broadcast.emit('message', `${socket.id.substring(0, 5)} connected`);

                socket.on('message', (data) => {
                    if (data) {
                        io.emit('message', `${socket.id.substring(0, 5)} : ${data}`);
                    }
                });

                socket.on('activity', (name) => {
                    socket.broadcast.emit('activity', name);
                });

                socket.on('disconnect', () => {
                    socket.broadcast.emit('message', `${socket.id.substring(0, 5)} disconnected`);
                });
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach((done) => {
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

    // Multiple client connection tests
    test('should broadcast messages to all connected clients', (done) => {
        const testMessage = 'Test broadcast message';
        const clientSocket2 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            setTimeout(() => {
                clientSocket2.on('message', (data) => {
                    if (data.includes(testMessage)) {
                        expect(data).toContain(testMessage);
                        clientSocket2.disconnect();
                        done();
                    }
                });
                clientSocket.emit('message', testMessage);
            }, 1000);
        });
    }, 15000);

    test('should handle multiple rapid messages from different clients', (done) => {
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
            
            messages.forEach((msg, index) => {
                setTimeout(() => {
                    clientSocket.emit('message', msg);
                }, index * 100);
            });
        });
    }, 15000);

    // Disconnect handling tests
    test('should handle client disconnection gracefully', (done) => {
        const disconnectingClient = new Client(`http://localhost:${port}`);
        
        disconnectingClient.on('connect', () => {
            clientSocket.once('message', (message) => {
                expect(message).toContain('disconnected');
                done();
            });
            
            setTimeout(() => {
                disconnectingClient.disconnect();
            }, 500);
        });
    }, 15000);

    test('should maintain service for other clients when one disconnects', (done) => {
        const clientSocket2 = new Client(`http://localhost:${port}`);
        const clientSocket3 = new Client(`http://localhost:${port}`);
        
        clientSocket2.on('connect', () => {
            clientSocket3.on('connect', () => {
                clientSocket2.disconnect();
                
                setTimeout(() => {
                    const testMessage = 'Message after disconnect';
                    clientSocket3.on('message', (data) => {
                        if (data.includes(testMessage)) {
                            expect(data).toContain(testMessage);
                            clientSocket3.disconnect();
                            done();
                        }
                    });
                    
                    clientSocket.emit('message', testMessage);
                }, 1000);
            });
        });
    }, 15000);
});