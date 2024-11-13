/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import { handleMessage } from '../../index.js';

describe('Chat Application Unit Tests', () => {
    // Message validation tests TDD
    test('should validate message handling', () => {
        // Red
        const mockSocket = {
            id: 'test-socket-id',
            emit: jest.fn(),
            broadcast: {
                emit: jest.fn()
            }
        };

        // Green
        
        // We tested and we just import from the production code

        // const handleMessage = (socket, data) => {
        //     if (!data || typeof data !== 'string' || data.trim().length === 0) {
        //         return false;
        //     }
        //     socket.emit('message', `${socket.id.substring(0, 5)} : ${data}`);
        //     return true;
        // };

        // Test cases
        expect(handleMessage(mockSocket, '')).toBe(false);
        expect(handleMessage(mockSocket, null)).toBe(false);
        expect(handleMessage(mockSocket, undefined)).toBe(false);
        expect(handleMessage(mockSocket, 'valid message')).toBe(true);
        expect(mockSocket.emit).toHaveBeenCalledWith(
            'message', 
            'test- : valid message'
        );
    });

    // User ID formatting test
    test('should format user IDs correctly', () => {
        const mockSocket = {
            id: 'test-socket-id-12345'
        };

        const formatUserId = (socket) => socket.id.substring(0, 5);
        
        const result = formatUserId(mockSocket);
        expect(result).toBe('test-');
        expect(result.length).toBe(5);
    });

    // Activity status test
    test('should handle typing activity', async () => {
        const mockSocket = {
            id: 'test-socket-id',
            broadcast: {
                emit: jest.fn()
            }
        };

        const handleTypingActivity = (socket, username) => {
            if (!username || typeof username !== 'string') return false;
            socket.broadcast.emit('activity', username);
            return true;
        };

        expect(handleTypingActivity(mockSocket, 'testUser')).toBe(true);
        expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('activity', 'testUser');
        expect(handleTypingActivity(mockSocket, '')).toBe(false);
        expect(handleTypingActivity(mockSocket, null)).toBe(false);
    });

    // Message format validation
    test('should validate message format', () => {
        const validateMessageFormat = (message) => {
            if (typeof message !== 'string') return false;
            if (message.trim().length === 0) return false;
            if (message.length > 500) return false;
            return true;
        };

        expect(validateMessageFormat('')).toBe(false);
        expect(validateMessageFormat('   ')).toBe(false);
        expect(validateMessageFormat('Hello')).toBe(true);
        expect(validateMessageFormat('a'.repeat(501))).toBe(false);
        expect(validateMessageFormat(123)).toBe(false);
    });

    // Special characters handling
    test('should handle special characters in messages', () => {
        const sanitizeMessage = (message) => {
            if (typeof message !== 'string') return '';
            return message
                .replace(/[<>]/g, '')
                .trim();
        };

        expect(sanitizeMessage('Hello <script>')).toBe('Hello script');
        expect(sanitizeMessage('Normal message')).toBe('Normal message');
        expect(sanitizeMessage('<>test<>')).toBe('test');
        expect(sanitizeMessage('   <test>   ')).toBe('test');
        expect(sanitizeMessage(null)).toBe('');
        expect(sanitizeMessage(undefined)).toBe('');
    });

    // Connection handler test
    test('should handle new connections correctly', () => {
        const mockSocket = {
            id: 'test-socket-id',
            emit: jest.fn(),
            broadcast: {
                emit: jest.fn()
            }
        };

        const handleNewConnection = (socket) => {
            socket.emit('message', 'Welcome to the chat');
            socket.broadcast.emit('message', `${socket.id.substring(0, 5)} connected`);
            return true;
        };

        expect(handleNewConnection(mockSocket)).toBe(true);
        expect(mockSocket.emit).toHaveBeenCalledWith('message', 'Welcome to the chat');
        expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('message', 'test- connected');
    });

    // Message broadcasting test
    test('should broadcast messages correctly', () => {
        const mockSocket = {
            id: 'test-socket-id',
            broadcast: {
                emit: jest.fn()
            }
        };
        const mockIo = {
            emit: jest.fn()
        };

        const broadcastMessage = (io, socket, message) => {
            if (!message || typeof message !== 'string') return false;
            io.emit('message', `${socket.id.substring(0, 5)} : ${message}`);
            return true;
        };

        expect(broadcastMessage(mockIo, mockSocket, 'Hello everyone!')).toBe(true);
        expect(mockIo.emit).toHaveBeenCalledWith(
            'message',
            'test- : Hello everyone!'
        );
        expect(broadcastMessage(mockIo, mockSocket, '')).toBe(false);
        expect(broadcastMessage(mockIo, mockSocket, null)).toBe(false);
    });
});