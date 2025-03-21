"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  submitAnswer: (data: {
    roomId: string;
    userId: string;
    questionId: string;
    answer: number;
    isCorrect: boolean;
  }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance: Socket | null = null;
    let reconnectionAttempts = 0; // Custom counter for reconnection attempts
    
    try {
      // Create a socket connection using our server endpoint
      socketInstance = io({
        path: '/api/socket',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance?.id);
        setConnected(true);
        setConnectionError(null);
        reconnectionAttempts = 0; // Reset counter on successful connection
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
        setConnectionError(err.message);
        reconnectionAttempts += 1;

        if (reconnectionAttempts >= 3) {
          console.log('Failed to connect to socket server after multiple attempts. Stopping reconnection.');
          socketInstance?.io.reconnection(false);
          
          // Inform user but proceed with app functionality
          console.log('The app will continue to function, but real-time features will be unavailable.');
        }
      });

      setSocket(socketInstance);
    } catch (error) {
      console.error('Error initializing socket:', error);
      setConnectionError('Failed to initialize socket');
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Join a quiz room
  const joinRoom = (roomId: string) => {
    if (socket && connected) {
      socket.emit('join-room', roomId);
    } else {
      console.log(`[Mock Socket] Joining room: ${roomId}`);
    }
  };

  // Leave a quiz room
  const leaveRoom = (roomId: string) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId);
    } else {
      console.log(`[Mock Socket] Leaving room: ${roomId}`);
    }
  };

  // Submit an answer
  const submitAnswer = ({
    roomId,
    userId,
    questionId,
    answer,
    isCorrect,
  }: {
    roomId: string;
    userId: string;
    questionId: string;
    answer: number;
    isCorrect: boolean;
  }) => {
    if (socket && connected) {
      socket.emit('submit-answer', {
        roomId,
        userId,
        questionId,
        answer,
        isCorrect,
      });
    } else {
      console.log(`[Mock Socket] Submitting answer: roomId=${roomId}, userId=${userId}, questionId=${questionId}, answer=${answer}, isCorrect=${isCorrect}`);
    }
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    submitAnswer,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
} 