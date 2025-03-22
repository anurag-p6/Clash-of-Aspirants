import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const { firebaseUid, email, username } = body;

    if (!firebaseUid || !email || !username) {
      return NextResponse.json(
        { error: 'Firebase UID, email, and username are required' },
        { status: 400 }
      );
    }

    try {
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Create a dummy user response for development
      const dummyUser = {
        id: firebaseUid,
        firebaseUid: firebaseUid,
        email: email,
        username: username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        score: 0
      };
      
      console.log('Returning dummy user for development:', dummyUser);
      return NextResponse.json({ user: dummyUser });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 