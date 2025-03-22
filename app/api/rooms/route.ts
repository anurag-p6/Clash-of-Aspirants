import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAndStoreQuizTemplate, TemplateQuestion } from '@/lib/templates';

// GET: Fetch all active quiz rooms
export async function GET(_req: NextRequest) {
  try {
    try {
      const rooms = await prisma.quizRoom.findMany({
        where: {
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              participants: true,
              questions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(rooms);

      // Format rooms to match the structure expected by the client
      const formattedRooms = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        topic: room.topic || 'General Quiz',
        participantCount: room._count.participants,
        createdAt: room.createdAt.toISOString(),
        creatorName: room.creator.username,
      }));

      return NextResponse.json({ rooms: formattedRooms });
    } catch (dbError) {
      console.error('Database error fetching rooms:', dbError);
      
      console.log('Database error fetching rooms, returning mock data for development');
      
      // Mock rooms for development
      if (process.env.NODE_ENV === 'development') {
        const rooms = [
          {
            id: 'mock-room-1',
            name: 'General Knowledge Quiz',
            topic: 'General Knowledge',
            participantCount: 3,
            createdAt: new Date().toISOString(),
            creatorName: 'MockUser1'
          },
          {
            id: 'mock-room-2',
            name: 'Science Quiz',
            topic: 'Science',
            participantCount: 2,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            creatorName: 'MockUser2'
          },
          {
            id: 'mock-room-3',
            name: 'History Quiz',
            topic: 'History',
            participantCount: 5,
            createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            creatorName: 'MockUser3'
          }
        ];
        
        return NextResponse.json({ rooms });
      }
      
      // In production, return an error
      return NextResponse.json(
        { error: 'Database error fetching rooms' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST: Create a new quiz room
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
    
    const { name, topic, creatorId, numQuestions = 5 } = body;

    if (!name || !topic || !creatorId) {
      return NextResponse.json(
        { error: 'Name, topic, and creatorId are required' },
        { status: 400 }
      );
    }

    try {
      // Create a new quiz room
      const room = await prisma.quizRoom.create({
        data: {
          name,
          topic,
          creatorId,
        },
      });

      // Add the creator as a participant
      await prisma.roomParticipant.create({
        data: {
          userId: creatorId,
          roomId: room.id,
        },
      });

      console.log("Room and participant created successfully, attempting to create template...");
      
      // Find or generate a quiz template for this topic
      const template = await generateAndStoreQuizTemplate(topic, numQuestions);
      
      console.log("Template created/found:", template.id, "with", template.questions.length, "questions");
      
      console.log(`Creating room with ${numQuestions} questions from template`);
      
      // Get the questions from the template
      const templateQuestions = template.questions;
      
      // If we need more questions than we have in the template, limit to what we have
      const questionsToUse = templateQuestions.slice(0, numQuestions);
      
      console.log("Using", questionsToUse.length, "questions from template");
      
      // Create questions for the room based on template questions
      try {
        await Promise.all(
          questionsToUse.map(async (q: TemplateQuestion) => {
            console.log("Creating question:", q.id);
            
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
                roomId: room.id,
                content: q.content,
                options: processedOptions,
                correctOption: q.correctOption,
                explanation: q.explanation,
              },
            });
          })
        );
      } catch (questionError: Error) {
        console.error('Error generating questions:', questionError);
        return NextResponse.json(
          { error: 'Failed to generate questions' },
          { status: 500 }
        );
      }

      return NextResponse.json({ room });
    } catch (error: Error) {
      console.error('Error creating room:', error);
      return NextResponse.json(
        { error: `Failed to create room: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 