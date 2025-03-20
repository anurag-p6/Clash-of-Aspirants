import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Fetch all questions for a specific room
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if the room exists and is active
    const room = await prisma.quizRoom.findUnique({
      where: {
        id,
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
        roomId: id,
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
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 