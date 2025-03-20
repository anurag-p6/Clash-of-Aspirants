import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch global leaderboard
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50'); // Default to 50 users
    
    // Get users with highest scores
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        score: true,
        createdAt: true,
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' }, // Break ties by who registered first
      ],
      take: limit,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 