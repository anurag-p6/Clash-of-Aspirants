import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    uid: string;
  };
}

// GET: Fetch statistics for a specific user
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = params;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    try {
      // Get the user to verify they exist
      const user = await prisma.user.findUnique({
        where: {
          id: uid,
        },
        select: {
          id: true,
          score: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Get count of quizzes created by this user
      const quizzesCreated = await prisma.quizRoom.count({
        where: {
          creatorId: uid,
        },
      });

      // Get count of quizzes joined by this user
      const quizzesJoined = await prisma.roomParticipant.count({
        where: {
          userId: uid,
          // Exclude rooms created by the user
          room: {
            creatorId: {
              not: uid,
            },
          },
        },
      });

      // Get counts of correct and incorrect answers
      const correctAnswers = await prisma.answer.count({
        where: {
          userId: uid,
          isCorrect: true,
        },
      });

      const incorrectAnswers = await prisma.answer.count({
        where: {
          userId: uid,
          isCorrect: false,
        },
      });

      // Calculate total answered questions
      const totalAnswers = correctAnswers + incorrectAnswers;
      
      // Calculate accuracy percentage
      const accuracy = totalAnswers > 0 
        ? Math.round((correctAnswers / totalAnswers) * 100) 
        : 0;

      const stats = {
        totalScore: user.score,
        quizzesCreated,
        quizzesJoined,
        correctAnswers,
        incorrectAnswers,
        totalAnswers,
        accuracy
      };

      return NextResponse.json({ stats });
    } catch (dbError) {
      console.error('Database error fetching user stats:', dbError);
      return NextResponse.json(
        { error: 'Database error fetching user statistics' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
} 