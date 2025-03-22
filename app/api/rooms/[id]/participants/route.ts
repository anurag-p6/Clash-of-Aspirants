import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string }; // Fix RouteContext type
}

// GET: Fetch all participants for a room
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const room = await prisma.quizRoom.findUnique({
      where: { id, isActive: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or inactive' },
        { status: 404 }
      );
    }

    const participants = await prisma.roomParticipant.findMany({
      where: { roomId: id },
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
  } catch (error: unknown) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST: Add a participant to a room
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const { userId } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Valid User ID is required' },
        { status: 400 }
      );
    }

    const room = await prisma.quizRoom.findUnique({
      where: { id, isActive: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or inactive' },
        { status: 404 }
      );
    }

    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: { userId, roomId: id },
      },
    });

    if (existingParticipant) {
      if (!existingParticipant.isActive) {
        const updatedParticipant = await prisma.roomParticipant.update({
          where: { id: existingParticipant.id },
          data: { isActive: true },
        });
        return NextResponse.json({ participant: updatedParticipant });
      }
      return NextResponse.json({ participant: existingParticipant });
    }

    const participant = await prisma.roomParticipant.create({
      data: { userId, roomId: id },
    });

    return NextResponse.json({ participant });
  } catch (error: unknown) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
