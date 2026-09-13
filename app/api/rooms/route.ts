import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuestionsForRoom } from '@/lib/templates';
import { resolveDatabaseUserId } from '@/lib/users';
import { normalizeOptions, stripQuestionNumberPrefix } from '@/lib/quiz-utils';

// GET: Fetch all active quiz rooms
export async function GET() {
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
    
    const { name, topic, creatorId, numQuestions = 5, difficulty } = body;

    if (!name || !topic || !creatorId) {
      return NextResponse.json(
        { error: 'Name, topic, and creatorId are required' },
        { status: 400 }
      );
    }

    if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
      return NextResponse.json(
        { error: 'Invalid difficulty value' },
        { status: 400 }
      );
    }
    try {
      const databaseUserId = await resolveDatabaseUserId(creatorId);
      if (!databaseUserId) {
        return NextResponse.json(
          {
            error:
              "User account not found. Please sign out, sign in again, and try creating the room.",
          },
          { status: 400 }
        );
      }

      console.log("Generating fresh questions for room, topic:", topic);
      const aiQuestions = await generateQuestionsForRoom(topic, numQuestions, difficulty);

      if (aiQuestions.length === 0) {
        return NextResponse.json(
          { error: "No quiz questions were generated. Please try again." },
          { status: 500 }
        );
      }

      console.log("Generated", aiQuestions.length, "unique questions for this room");

      const room = await prisma.quizRoom.create({
        data: {
          name,
          topic,
          difficulty,
          creatorId: databaseUserId,
        },
      });

      await prisma.roomParticipant.create({
        data: {
          userId: databaseUserId,
          roomId: room.id,
        },
      });

      for (const q of aiQuestions) {
        const processedOptions = normalizeOptions(q.options);
        await prisma.question.create({
          data: {
            roomId: room.id,
            content: stripQuestionNumberPrefix(q.question),
            options:
              processedOptions.length >= 2
                ? processedOptions
                : ["Option A", "Option B", "Option C", "Option D"],
            correctOption: q.correctOptionIndex,
            explanation: q.explanation || "This is the correct answer.",
          },
        });
      }

      return NextResponse.json({ room });
    } catch (error) {
      console.error('Error creating room:', error);
      return NextResponse.json(
        { error: `Failed to create room: ${(error as Error).message}` },
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