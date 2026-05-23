import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all participants for a room
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } =  await context.params;
    
    if (!id) { 
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const room = await prisma.quizRoom.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        isActive: true,
      },
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
export async function POST(_req: NextRequest,{ params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    
    if (!id) {
      console.error('Room ID is missing');
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    let requestBody;
    try {
      requestBody = await _req.json();
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { userId } = requestBody;

    if (!userId || typeof userId !== 'string') {
      console.error('Invalid User ID:', userId);
      return NextResponse.json(
        { error: 'Valid User ID is required' },
        { status: 400 }
      );
    }

    const room = await prisma.quizRoom.findUnique({
      where: { id, isActive: true },
    });

    if (!room) {
      console.error('Room not found or inactive:', id);
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
