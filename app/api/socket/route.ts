import { NextResponse } from 'next/server';
import { getIO } from '@/lib/socket';

export async function GET() {
  try {
    const io = getIO();

    if (!io) {
      console.log('Socket.IO server not initialized yet');
      return NextResponse.json(
        { status: 'initializing', message: 'Socket.IO server not initialized yet' },
        { status: 200 }
      );
    }

    console.log('Socket.IO server is running');
    return NextResponse.json(
      { status: 'running', message: 'Socket.IO server is running' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Socket initialization error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
