import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuizQuestions } from '@/lib/openai';

// Generate a random join code (6 alphanumeric characters)
function generateJoinCode(length = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters like 0/O, 1/I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Check if a join code already exists
async function isJoinCodeUnique(code: string): Promise<boolean> {
  const existingRoom = await prisma.quizRoom.findUnique({
    where: { joinCode: code },
  });
  return !existingRoom;
}

// Generate a unique join code
async function generateUniqueJoinCode(): Promise<string> {
  let joinCode = generateJoinCode();
  let isUnique = await isJoinCodeUnique(joinCode);
  
  // In the unlikely event of a collision, try again
  let attempts = 0;
  while (!isUnique && attempts < 5) {
    joinCode = generateJoinCode();
    isUnique = await isJoinCodeUnique(joinCode);
    attempts++;
  }
  
  return joinCode;
}

// GET: Fetch all active quiz rooms
export async function GET(req: NextRequest) {
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
      const formattedRooms = rooms.map((room:any) => ({
        id: room.id,
        name: room.name,
        topic: room.topic,
        joinCode: room.joinCode,
        participantCount: room._count.participants,
        createdAt: room.createdAt.toISOString(),
        creatorName: room.creator.username,
      }));

      return NextResponse.json({ rooms: formattedRooms });
    } catch (dbError) {
      console.error('Database error fetching rooms:', dbError);
      
      // Return mock data for development
      const mockRooms = [
        {
          id: 'mock-room-1',
          name: 'General Knowledge Quiz',
          topic: 'General Knowledge',
          joinCode: 'ABC123',
          participantCount: 3,
          createdAt: new Date().toISOString(),
          creatorName: 'MockUser1'
        },
        {
          id: 'mock-room-2',
          name: 'Science Quiz',
          topic: 'Science',
          joinCode: 'DEF456',
          participantCount: 2,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          creatorName: 'MockUser2'
        },
        {
          id: 'mock-room-3',
          name: 'History Quiz',
          topic: 'History',
          joinCode: 'GHI789',
          participantCount: 5,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          creatorName: 'MockUser3'
        }
      ];
      
      console.log('Returning mock rooms data for development');
      return NextResponse.json({ rooms: mockRooms });
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
    
    const { name, topic, creatorId } = body;

    if (!name || !topic || !creatorId) {
      return NextResponse.json(
        { error: 'Name, topic, and creatorId are required' },
        { status: 400 }
      );
    }

    try {
      // Generate a unique join code
      const joinCode = await generateUniqueJoinCode();
      console.log(`Generated unique join code: ${joinCode} for room: ${name}`);
      
      // Create a new quiz room
      const room = await prisma.quizRoom.create({
        data: {
          name,
          topic,
          creatorId,
          joinCode, // Add the join code
        },
      });

      // Add the creator as a participant
      await prisma.roomParticipant.create({
        data: {
          userId: creatorId,
          roomId: room.id,
        },
      });

      // Generate questions using OpenAI
      const aiQuestions = await generateQuizQuestions(topic, 5); // Assuming 5 questions for simplicity

      // Store generated questions in the database
      for (const question of aiQuestions) {
        await prisma.question.create({
          data: {
            roomId: room.id,
            content: question.question,
            options: question.options,
            correctOption: question.correctOptionIndex,
            explanation: question.explanation,
          },
        });
      }

      return NextResponse.json({ room });
    } catch (dbError) {
      console.error('Database error creating room:', dbError);
      
      // Create mock room data for development
      const mockRoom = {
        id: `mock-room-${Date.now()}`,
        name,
        topic,
        creatorId,
        joinCode: generateJoinCode(), // Generate a mock join code
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Returning mock room data for development:', mockRoom);
      return NextResponse.json({ room: mockRoom });
    }
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
} 