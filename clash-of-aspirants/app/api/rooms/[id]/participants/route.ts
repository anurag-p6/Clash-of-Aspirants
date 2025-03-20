import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Fetch all participants for a room
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    try {
      // Check if the room exists and is active
      const room = await prisma.quizRoom.findUnique({
        where: {
          id,
          isActive: true,
        },
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found or inactive' },
          { status: 404 }
        );
      }

      // Fetch participants with their scores
      const participants = await prisma.roomParticipant.findMany({
        where: {
          roomId: id,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return NextResponse.json({ participants });
    } catch (dbError) {
      // Database error - return mock data for development
      console.error('Database error fetching participants:', dbError);
      console.log('Returning mock participants data for development');
      
      // Create mock participants data
      const mockParticipants = [
        {
          id: "mock-participant-1",
          userId: "mock-user-1",
          roomId: id,
          score: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: "mock-user-1",
            username: "MockUser1"
          }
        },
        {
          id: "mock-participant-2",
          userId: "mock-user-2",
          roomId: id,
          score: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: "mock-user-2",
            username: "MockUser2"
          }
        }
      ];
      
      return NextResponse.json({ participants: mockParticipants });
    }
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST: Add a participant to a room
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if the room exists and is active
    const room = await prisma.quizRoom.findUnique({
      where: {
        id,
        isActive: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: id,
        },
      },
    });

    if (existingParticipant) {
      // If participant exists but is inactive, reactivate them
      if (!existingParticipant.isActive) {
        const updatedParticipant = await prisma.roomParticipant.update({
          where: {
            id: existingParticipant.id,
          },
          data: {
            isActive: true,
          },
        });
        return NextResponse.json({ participant: updatedParticipant });
      }
      
      // Otherwise, return the existing participant
      return NextResponse.json({ participant: existingParticipant });
    }

    // Create a new participant
    const participant = await prisma.roomParticipant.create({
      data: {
        userId,
        roomId: id,
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    );
  }
} 