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
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 