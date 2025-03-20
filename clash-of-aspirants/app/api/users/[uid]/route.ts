import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    uid: string;
  };
}

// GET: Fetch a user by Firebase UID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = params;

    try {
      const user = await prisma.user.findUnique({
        where: {
          firebaseUid: uid,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ user });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Create a dummy user for development when DB isn't available
      const dummyUser = {
        id: uid,
        firebaseUid: uid,
        email: `user-${uid.substring(0, 5)}@example.com`,
        username: `User-${uid.substring(0, 5)}`,
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