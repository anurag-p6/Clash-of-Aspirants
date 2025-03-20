import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all users
export async function GET(req: NextRequest) {
  try {
    // Try to get a specific user by Firebase UID if provided
    const firebaseUid = req.nextUrl.searchParams.get('firebaseUid');
    
    if (firebaseUid) {
      try {
        const user = await prisma.user.findUnique({
          where: {
            firebaseUid,
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
        console.error('Database error finding user by Firebase UID:', dbError);
        
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
    }

    // If no firebaseUid is provided, return all users (for admin purposes)
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ users });
    } catch (dbError) {
      console.error('Database error fetching all users:', dbError);
      
      // Create dummy users for development
      const dummyUsers = [
        {
          id: 'dummy-1',
          firebaseUid: 'firebase-dummy-1',
          email: 'user1@example.com',
          username: 'User1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          score: 120
        },
        {
          id: 'dummy-2', 
          firebaseUid: 'firebase-dummy-2',
          email: 'user2@example.com',
          username: 'User2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          score: 90
        }
      ];
      
      console.log('Returning dummy users for development:', dummyUsers.length, 'users');
      return NextResponse.json({ users: dummyUsers });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 