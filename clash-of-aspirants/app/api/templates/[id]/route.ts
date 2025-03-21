import { NextRequest, NextResponse } from 'next/server';
import { getQuizTemplate } from '@/lib/templates';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Fetch a specific template by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const template = await getQuizTemplate(id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
} 