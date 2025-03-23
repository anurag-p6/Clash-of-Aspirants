import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreQuizTemplate, listQuizTemplates, findQuizTemplateByTopic } from '@/lib/templates';

// GET: List all templates or find by topic
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic');
    
    if (topic) {
      // Get template by topic
      const template = await findQuizTemplateByTopic(topic);
      
      if (!template) {
        return NextResponse.json({ 
          error: 'No template found for this topic' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ template });
    } else {
      // List all templates
      const templates = await listQuizTemplates();
      return NextResponse.json({ templates });
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST: Create a new template
export async function POST(req: NextRequest) {
  try {
    // Parse JSON with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { topic, numQuestions = 5 } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate or fetch existing template
    const template = await generateAndStoreQuizTemplate(topic, numQuestions, "easy");
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
} 