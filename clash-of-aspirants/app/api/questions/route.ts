import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { topic, numQuestions = 5, roomId } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Generate questions using OpenAI
    const aiQuestions = await generateQuizQuestions(topic, numQuestions);

    // Store questions in the database
    const questions = await Promise.all(
      aiQuestions.map(async (q) => {
        return prisma.question.create({
          data: {
            roomId,
            content: q.question,
            options: q.options as any,
            correctOption: q.correctOptionIndex,
            explanation: q.explanation,
          },
        });
      })
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 