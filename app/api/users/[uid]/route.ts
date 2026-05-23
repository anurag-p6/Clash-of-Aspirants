import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET: Fetch a user by Firebase UID
export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await context.params;

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
      return NextResponse.json(
        { error: 'Database error fetching user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 