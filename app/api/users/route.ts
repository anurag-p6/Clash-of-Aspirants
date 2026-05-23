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
        return NextResponse.json(
          { error: 'Database error finding user' },
          { status: 500 }
        );
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
      
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Database error fetching users' },
          { status: 500 }
        );
      }
      
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

// POST: Create or update user
export async function POST(req: NextRequest) {
  interface UserRequestBody {
    firebaseUid: string;
    email: string;
    username: string;
  }
  
  let body: UserRequestBody | null = null;
  
  try {
    // Parse JSON with error handling
    try {
      body = await req.json() as UserRequestBody;
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

    // Try to find an existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        firebaseUid: firebaseUid,
      },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          email,
          username,
        },
      });

      return NextResponse.json({ user: updatedUser });
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          username,
        },
      });

      return NextResponse.json({ user: newUser });
    }
  } catch (error: unknown) {
    console.error('Error creating/updating user:', error);
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      // Check which field caused the violation
      const prismaError = error as { meta?: { target?: string[] } };
      const field = prismaError.meta?.target?.[0] || 'unknown field';
      
      if (field === 'email' && body?.firebaseUid && body?.username) {
        // Try updating the user by firebaseUid instead
        try {
          const existingUserByFirebase = await prisma.user.findUnique({
            where: { firebaseUid: body.firebaseUid }
          });
          
          if (existingUserByFirebase) {
            // Update the user
            const updatedUser = await prisma.user.update({
              where: { id: existingUserByFirebase.id },
              data: { username: body.username }
            });
            
            return NextResponse.json({ user: updatedUser });
          }
        } catch (updateError) {
          console.error('Error updating user after constraint violation:', updateError);
        }
      }
      
      return NextResponse.json(
        { error: `A user with this ${field} already exists` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to create/update user: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 