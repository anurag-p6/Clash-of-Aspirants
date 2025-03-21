import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    uid: string;
  };
}

// GET: Fetch rooms created by a user
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = params;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    try {
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

      // Format the rooms to match the expected structure in the client
      const formattedRooms = rooms.map((room) => ({
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
      return NextResponse.json(
        { error: 'Database error fetching user rooms' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rooms' },
      { status: 500 }
    );
  }
} 