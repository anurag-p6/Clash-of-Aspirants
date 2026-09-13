import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatQuestionForClient } from '@/lib/quiz-utils';

// GET: Fetch all questions for a specific room
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return NextResponse.json({
      questions: questions.map(formatQuestionForClient),
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
