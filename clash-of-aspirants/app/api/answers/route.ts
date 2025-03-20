import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Submit an answer to a question
export async function POST(req: NextRequest) {
  try {
    const { userId, questionId, selectedOption } = await req.json();

    if (!userId || !questionId || selectedOption === undefined) {
      return NextResponse.json(
        { error: 'User ID, question ID, and selected option are required' },
        { status: 400 }
      );
    }

    // Get the question to check if the answer is correct
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = selectedOption === question.correctOption;

    // Create a new answer record
    const answer = await prisma.answer.create({
      data: {
        userId,
        questionId,
        selectedOption,
        isCorrect,
      },
    });

    // If the answer is correct, update the participant's score
    if (isCorrect) {
      await prisma.roomParticipant.updateMany({
        where: {
          userId,
          roomId: question.roomId,
        },
        data: {
          score: {
            increment: 1,
          },
        },
      });

      // Also update the user's overall score
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          score: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ 
      answer,
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
} 