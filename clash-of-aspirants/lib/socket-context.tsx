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
  const { user } = useAuth();

  useEffect(() => {
    // Create a socket connection using our server endpoint
    const socketInstance = io({
      path: '/api/socket',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join a quiz room
  const joinRoom = (roomId: string) => {
    if (socket && connected) {
      socket.emit('join-room', roomId);
    }
  };

  // Leave a quiz room
  const leaveRoom = (roomId: string) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId);
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