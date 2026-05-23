import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET: Fetch rooms created by a user
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await context.params;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    try {
      console.log(`Fetching rooms for user ID: ${uid}`);
      
      // Get the rooms created by this user
      const rooms = await prisma.quizRoom.findMany({
        where: {
          creatorId: uid,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`Found ${rooms.length} rooms for user ID: ${uid}`);
      
      // Format the rooms to match the expected structure in the client
      const formattedRooms = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        topic: room.topic,
        participantCount: room._count.participants,
        createdAt: room.createdAt.toISOString(),
        creatorName: room.creator?.username || 'Unknown User',
      }));

      return NextResponse.json({ rooms: formattedRooms });
    } catch (dbError) {
      console.error('Database error fetching user rooms:', dbError);
      console.error('Error details:', JSON.stringify(dbError, null, 2));
      
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Database error fetching user rooms' },
          { status: 500 }
        );
      }
      
      // Return mock data only in development
      const mockRooms = [
        {
          id: `mock-room-${uid}-1`,
          name: 'Astronomy Quiz',
          topic: 'Astronomy',
          participantCount: 3,
          createdAt: new Date().toISOString(),
          creatorName: `User-${uid.substring(0, 5)}`
        },
        {
          id: `mock-room-${uid}-2`,
          name: 'Geography Quiz',
          topic: 'Geography',
          participantCount: 2,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          creatorName: `User-${uid.substring(0, 5)}`
        }
      ];
      
      console.log('Returning mock user rooms data for development');
      return NextResponse.json({ rooms: mockRooms });
    }
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch user rooms' },
      { status: 500 }
    );
  }
} 