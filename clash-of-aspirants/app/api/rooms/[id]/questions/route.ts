import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  params: {
    id: string;
  };
}

// GET: Fetch all questions for a specific room
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Always validate and get the roomId from params first
    const roomId = params.id;
    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    try {
      // Check if the room exists and is active
      const room = await prisma.quizRoom.findUnique({
        where: {
          id: roomId,
          isActive: true,
        },
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found or inactive' },
          { status: 404 }
        );
      }

      // Fetch questions for the room but without revealing the correct answers
      // This prevents cheating by inspecting the API response
      const questions = await prisma.question.findMany({
        where: {
          roomId,
        },
        select: {
          id: true,
          content: true,
          options: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return NextResponse.json({ questions });
    } catch (dbError) {
      // Database error - return mock data for development
      console.error('Database error fetching questions:', dbError);
      console.log('Returning mock questions data for development');
      
      // Create mock questions data
      const mockQuestions = [
        {
          id: "mock-question-1",
          content: "What is the capital of France?",
          options: ["Berlin", "Madrid", "Paris", "Rome"],
          createdAt: new Date().toISOString()
        },
        {
          id: "mock-question-2",
          content: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          createdAt: new Date(Date.now() + 1000).toISOString()
        },
        {
          id: "mock-question-3",
          content: "Who wrote 'Romeo and Juliet'?",
          options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
          createdAt: new Date(Date.now() + 2000).toISOString()
        },
        {
          id: "mock-question-4",
          content: "What is the chemical symbol for water?",
          options: ["O2", "CO2", "H2O", "NaCl"],
          createdAt: new Date(Date.now() + 3000).toISOString()
        },
        {
          id: "mock-question-5",
          content: "Which year did World War II end?",
          options: ["1943", "1945", "1947", "1950"],
          createdAt: new Date(Date.now() + 4000).toISOString()
        }
      ];
      
      return NextResponse.json({ questions: mockQuestions });
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 