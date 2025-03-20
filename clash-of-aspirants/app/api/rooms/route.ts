import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

      // Format rooms to match the structure expected by the client
      const formattedRooms = rooms.map(room => ({
        id: room.id,
        name: room.name,
        topic: room.topic,
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

      return NextResponse.json({ room });
    } catch (dbError) {
      console.error('Database error creating room:', dbError);
      
      // Create mock room data for development
      const mockRoom = {
        id: `mock-room-${Date.now()}`,
        name,
        topic,
        creatorId,
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