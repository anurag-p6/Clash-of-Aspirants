import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveDatabaseUserId } from '@/lib/users';

// POST: Submit an answer to a question
export async function POST(req: NextRequest) {
  try {
    // Parse JSON with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { userId: rawUserId, questionId, selectedOption } = requestData;

    if (!rawUserId || !questionId || selectedOption === undefined) {
      return NextResponse.json(
        { error: 'User ID, question ID, and selected option are required' },
        { status: 400 }
      );
    }

    const userId = await resolveDatabaseUserId(rawUserId);
    if (!userId) {
      return NextResponse.json(
        { error: 'User account not found. Please sign in again.' },
        { status: 400 }
      );
    }

    try {
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

      const existing = await prisma.answer.findUnique({
        where: {
          userId_questionId: { userId, questionId },
        },
      });

      if (existing) {
        return NextResponse.json({
          answer: existing,
          isCorrect: existing.isCorrect,
          correctOption: question.correctOption,
          explanation: question.explanation,
          alreadyAnswered: true,
        });
      }

      const isCorrect = selectedOption === question.correctOption;

      const answer = await prisma.answer.create({
        data: {
          userId,
          questionId,
          selectedOption,
          isCorrect,
        },
      });

      if (isCorrect) {
        await prisma.roomParticipant.updateMany({
          where: {
            userId,
            roomId: question.roomId,
          },
          data: {
            score: { increment: 1 },
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            score: { increment: 1 },
          },
        });
      }

      return NextResponse.json({
        answer,
        isCorrect,
        correctOption: question.correctOption,
        explanation: question.explanation,
        alreadyAnswered: false,
      });
    } catch (dbError) {
      console.error("Database error when submitting answer:", dbError);

      const prismaError = dbError as { code?: string };
      if (prismaError.code === "P2002") {
        const [existing, questionRow] = await Promise.all([
          prisma.answer.findUnique({
            where: { userId_questionId: { userId, questionId } },
          }),
          prisma.question.findUnique({ where: { id: questionId } }),
        ]);
        if (existing && questionRow) {
          return NextResponse.json({
            answer: existing,
            isCorrect: existing.isCorrect,
            correctOption: questionRow.correctOption,
            explanation: questionRow.explanation,
            alreadyAnswered: true,
          });
        }
      }

      return NextResponse.json(
        { error: "Failed to submit answer" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
} 