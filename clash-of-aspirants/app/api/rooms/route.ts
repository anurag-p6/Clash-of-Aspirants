import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all active quiz rooms
export async function GET(req: NextRequest) {
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

    return NextResponse.json({ rooms });
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
    const { name, topic, creatorId } = await req.json();

    if (!name || !topic || !creatorId) {
      return NextResponse.json(
        { error: 'Name, topic, and creatorId are required' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
} 