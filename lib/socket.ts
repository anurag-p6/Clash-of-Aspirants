import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Global variable to maintain socket instance across API requests
let io: SocketIOServer | null = null;

export const getIO = () => io;

export const initSocketServer = (server?: NetServer) => {
  if (!io && server) {
    // Create new Socket.IO server instance if it doesn't exist
    io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    // Set up socket event handlers
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle joining a room
      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
      });

      // Handle leaving a room
      socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room: ${roomId}`);
      });

      // Handle submitting an answer
      socket.on('submit-answer', ({ roomId, userId, questionId, isCorrect }) => {
        // Broadcast to the room that a user has submitted an answer
        io?.to(roomId).emit('user-answered', { userId, questionId, isCorrect });
      });

      // Handle next question
      socket.on('next-question', ({ roomId, question }) => {
        io?.to(roomId).emit('new-question', question);
      });

      // Handle quiz ended
      socket.on('end-quiz', (roomId) => {
        io?.to(roomId).emit('quiz-ended');
      });

      // Handle leaderboard update
      socket.on('update-leaderboard', ({ roomId, leaderboard }) => {
        io?.to(roomId).emit('leaderboard-updated', leaderboard);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  return io;
};

// For CommonJS compatibility in server.js
