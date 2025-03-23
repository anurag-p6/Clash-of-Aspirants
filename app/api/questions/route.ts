import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { generateAndStoreQuizTemplate, TemplateQuestion } from '@/lib/templates';

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
      
      // Create questions in the room based on template questions
      const questions = await Promise.all(
        questionsToUse.map(async (q: TemplateQuestion) => {
          // Ensure options is properly formatted for database
          let processedOptions;
          try {
            // Make sure options is properly serialized
            processedOptions = typeof q.options === 'string' 
              ? JSON.parse(q.options) 
              : q.options;
          } catch (e) {
            console.error("Error processing options:", e);
            processedOptions = ["Option A", "Option B", "Option C", "Option D"];
          }
          
          return prisma.question.create({
            data: {
              roomId,
              content: q.content,
              options: processedOptions,
              correctOption: q.correctOption,
              explanation: q.explanation,
            },
          });
        })
      );

      return NextResponse.json({ questions });
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