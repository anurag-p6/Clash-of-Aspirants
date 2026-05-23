import { NextRequest, NextResponse } from 'next/server';
import { getQuizTemplate } from '@/lib/templates';

// GET: Fetch a specific template by ID
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;

    const template = await getQuizTemplate(id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
} 