import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for production compatibility
        methods: ['GET', 'POST'],
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

const userSocketMap = {}; // { userId: socketId }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'undefined') {
        userSocketMap[userId] = socket.id;
    }

    // Broadcast updated list of online user IDs to everyone
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // Handle typing events - just forward to receiver
    socket.on('typing', ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('typing', { senderId: userId });
        }
    });

    socket.on('stopTyping', ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('stopTyping', { senderId: userId });
        }
    });

    // --- WebRTC Signaling ---
    socket.on('callUser', ({ userToCall, signalData, from, name, isVideoCall, fromSocket }) => {
        const receiverSocketId = getReceiverSocketId(userToCall);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('callUser', { signal: signalData, from, name, isVideoCall, fromSocket });
        }
    });

    socket.on('answerCall', ({ to, signal }) => {
        // 'to' is now the precise socket.id string of the caller, not a userId
        io.to(to).emit('callAccepted', signal);
    });

    socket.on('endCall', ({ to }) => {
        const receiverSocketId = getReceiverSocketId(to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('callEnded');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (userId) {
            delete userSocketMap[userId];
        }
        // Broadcast updated list after disconnect
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

export { app, io, server };
