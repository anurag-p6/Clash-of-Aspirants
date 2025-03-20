import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Parse JSON with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { topic, numQuestions = 5, roomId } = body;

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

    try {
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
    } catch (dbError) {
      console.error('Database error storing questions:', dbError);
      
      // Create mock question data with IDs
      const mockQuestions = aiQuestions.map((q, index) => ({
        id: `mock-question-${Date.now()}-${index}`,
        roomId,
        content: q.question,
        options: q.options,
        correctOption: q.correctOptionIndex, 
        explanation: q.explanation,
        createdAt: new Date().toISOString()
      }));
      
      console.log('Returning mock question data for development:', mockQuestions.length, 'questions');
      return NextResponse.json({ questions: mockQuestions });
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 