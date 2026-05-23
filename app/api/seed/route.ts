import { NextResponse } from 'next/server';
import { generateAndStoreQuizTemplate } from '@/lib/templates';

// POST: Seed the database with common quiz templates
export async function POST() {
  try {
    // Define common topics
    const topics = [
      "World History",
      "Science",
      "Geography",
      "Literature",
      "Mathematics",
      "Computer Science",
      "Music",
      "Art",
      "Sports",
      "General Knowledge"
    ];
    
    // Create templates for each topic
    const results = await Promise.all(
      topics.map(async (topic) => {
        try {
          const template = await generateAndStoreQuizTemplate(topic, 10, "easy");
          return {
            topic,
            id: template.id,
            questionCount: template.questions.length
          };
        } catch (error) {
          console.error(`Error creating template for ${topic}:`, error);
          return {
            topic,
            error: 'Failed to create template'
          };
        }
      })
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Database seeded with quiz templates',
      results 
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
} 