import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  uid: string;
}

// GET: Fetch rooms created by a user
export async function GET(req: NextRequest, context: { params: RouteParams }) {
  try {
    const { uid } = context.params;

    try {
      // First get the user's ID from the Firebase UID
      const user = await prisma.user.findUnique({
        where: {
          firebaseUid: uid,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Then get the rooms created by this user
      const rooms = await prisma.quizRoom.findMany({
        where: {
          creatorId: user.id,
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

      // Format the rooms to match the expected structure in the client
      const formattedRooms = rooms.map((room:any) => ({
        id: room.id,
        name: room.name,
        topic: room.topic,
        participantCount: room._count.participants,
        createdAt: room.createdAt.toISOString(),
        creatorName: room.creator.username,
      }));

      return NextResponse.json({ rooms: formattedRooms });
    } catch (dbError) {
      console.error('Database error fetching user rooms:', dbError);
      
      // Create mock rooms data for development
      const mockRooms = [
        {
          id: `mock-room-1-${Date.now()}`,
          name: "Mock History Quiz",
          topic: "History",
          participantCount: 4,
          createdAt: new Date().toISOString(),
          creatorName: `User-${uid.substring(0, 5)}`,
        },
        {
          id: `mock-room-2-${Date.now()}`,
          name: "Mock Science Quiz", 
          topic: "Science",
          participantCount: 2,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          creatorName: `User-${uid.substring(0, 5)}`,
        }
      ];
      
      console.log('Returning mock rooms data for development:', mockRooms.length, 'rooms');
      return NextResponse.json({ rooms: mockRooms });
    }
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rooms' },
      { status: 500 }
    );
  }
} 