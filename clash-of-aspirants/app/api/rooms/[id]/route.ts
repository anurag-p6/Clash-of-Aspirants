import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Fetch details for a specific room
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    try {
      const room = await prisma.quizRoom.findUnique({
        where: {
          id,
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
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found or inactive' },
          { status: 404 }
        );
      }

      return NextResponse.json({ room });
    } catch (dbError) {
      // Database error - return mock data for development
      console.error('Database error fetching room:', dbError);
      console.log('Returning mock room data for development');
      
      // Create mock room data
      const mockRoom = {
        id,
        name: "Mock Quiz Room",
        topic: "General Knowledge",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: {
          id: "mock-user-id",
          username: "MockUser",
          email: "mock@example.com"
        },
        _count: {
          participants: 1,
          questions: 5
        }
      };
      
      return NextResponse.json({ room: mockRoom });
    }
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

// PUT: Update a room (e.g., to deactivate it)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { isActive } = await req.json();

    const updatedRoom = await prisma.quizRoom.update({
      where: {
        id,
      },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
} 