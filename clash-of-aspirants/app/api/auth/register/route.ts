import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { firebaseUid, email, username } = await req.json();

    if (!firebaseUid || !email || !username) {
      return NextResponse.json(
        { error: 'Firebase UID, email, and username are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or Firebase UID already exists' },
        { status: 409 }
      );
    }

    // Create a new user
    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        username,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 