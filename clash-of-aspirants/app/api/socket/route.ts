import { NextRequest, NextResponse } from 'next/server';
import { getIO } from '@/lib/socket';

export async function GET(req: NextRequest) {
  try {
    // Check if socket.io server is initialized
    const io = getIO();
    
    if (!io) {
      console.log('Socket.IO server not initialized yet');
    } else {
      console.log('Socket.IO server is running');
    }
    
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Socket initialization error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Need to disable the default body size limit for Socket.IO
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}; 