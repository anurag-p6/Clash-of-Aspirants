import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  params: {
    uid: string;
  }
};

// GET: Fetch a user by Firebase UID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Always validate and get the userId from params first
    const firebaseUid = params.uid;
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching user with Firebase UID: ${firebaseUid}`);

    try {
      const user = await prisma.user.findUnique({
        where: {
          firebaseUid,
        },
      });

      if (!user) {
        console.log(`User not found with Firebase UID: ${firebaseUid}`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.log(`User found: ${user.id}, ${user.username}`);
      return NextResponse.json({ user });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Create a dummy user for development when DB isn't available
      const dummyUser = {
        id: firebaseUid,
        firebaseUid,
        email: `user-${firebaseUid.substring(0, 5)}@example.com`,
        username: `User-${firebaseUid.substring(0, 5)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        score: 0
      };
      
      console.log('Returning dummy user for development:', dummyUser);
      return NextResponse.json({ user: dummyUser });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 