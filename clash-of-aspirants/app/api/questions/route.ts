import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Questions API: Request received");
    
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
    console.log(`📝 Questions API: Generating ${numQuestions} questions on "${topic}" for room ${roomId}`);

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

    // Generate questions using Gemini API
    console.log("🤖 Questions API: Calling Gemini API to generate questions");
    const aiQuestions = await generateQuizQuestions(topic, numQuestions);
    console.log(`✅ Questions API: Generated ${aiQuestions.length} questions successfully`);
    
    if (aiQuestions.length === 0) {
      console.log("⚠️ No questions generated, falling back to mock data");
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }

    try {
      // Store questions in the database
      console.log("💾 Questions API: Saving questions to database");
      const questions = await Promise.all(
        aiQuestions.map(async (q, index) => {
          console.log(`Saving question ${index + 1}:`, q.question.substring(0, 30) + '...');
          
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
      console.log(`✅ Questions API: Saved ${questions.length} questions to database`);

      return NextResponse.json({ questions });
    } catch (dbError) {
      console.error('Database error storing questions:', dbError);
      
      // Create question data with IDs but don't save to DB
      const questionsWithIds = aiQuestions.map((q, index) => ({
        id: `generated-question-${Date.now()}-${index}`,
        roomId,
        content: q.question,
        options: q.options,
        correctOption: q.correctOptionIndex, 
        explanation: q.explanation,
        createdAt: new Date().toISOString()
      }));
      
      console.log('⚠️ Database error, returning generated questions with temp IDs:', questionsWithIds.length, 'questions');
      return NextResponse.json({ questions: questionsWithIds });
    }
  } catch (error) {
    console.error('❌ Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 