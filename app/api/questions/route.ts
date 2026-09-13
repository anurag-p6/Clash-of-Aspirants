import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { generateAndStoreQuizTemplate, TemplateQuestion } from '@/lib/templates';
import { formatQuestionForClient, normalizeOptions, stripQuestionNumberPrefix } from '@/lib/quiz-utils';

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
    
    const { topic, numQuestions = 5, roomId, difficulty } = body;

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

    // First check if the room exists
    const room = await prisma.quizRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    try {
      // Find or create a template for this topic
      const template = await generateAndStoreQuizTemplate(topic, numQuestions, difficulty);
      
      // Get the questions from the template
      const templateQuestions = template.questions;
      
      // If we need more questions than we have in the template, limit to what we have
      const questionsToUse = templateQuestions.slice(0, numQuestions);
      
      const createdQuestions = [];
      for (const q of questionsToUse) {
        const processedOptions = normalizeOptions(q.options);
        const created = await prisma.question.create({
          data: {
            roomId,
            content: stripQuestionNumberPrefix(q.content),
            options:
              processedOptions.length >= 2
                ? processedOptions
                : ["Option A", "Option B", "Option C", "Option D"],
            correctOption: q.correctOption,
            explanation: q.explanation,
          },
        });
        createdQuestions.push(created);
      }

      return NextResponse.json({
        questions: createdQuestions.map(formatQuestionForClient),
      });
    } catch (dbError) {
      console.error('Database error storing questions:', dbError);
      
      // Fall back to generating questions directly without storing in database
      const aiQuestions = await generateQuizQuestions(topic, numQuestions, difficulty);
      
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