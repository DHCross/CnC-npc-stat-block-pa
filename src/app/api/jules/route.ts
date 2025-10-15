import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const julesApiKey = process.env.JULES_API_KEY;
    
    if (!julesApiKey) {
      return NextResponse.json(
        { error: 'Jules API key not configured' },
        { status: 500 }
      );
    }

    // Get the last user message as the prompt
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';

    // Note: The actual Jules API (https://jules.googleapis.com/v1alpha/) is session-based
    // and designed for GitHub repository automation, not real-time chat.
    // For a proper implementation, you would need to:
    // 1. List sources (GitHub repos) connected to Jules
    // 2. Create a session with a source context
    // 3. Send messages within that session
    // 4. Poll for activities/responses
    
    // For now, return a helpful explanation
    return NextResponse.json({
      message: `I received your message: "${prompt}"

Note: The Jules API is designed for GitHub repository automation (creating PRs, fixing bugs, etc.), not real-time chat. 

To use Jules properly, you would need to:
1. Connect your GitHub repository to Jules via the web app
2. Create a session with your repo as the source
3. Send development tasks (e.g., "Fix bug in authentication module")
4. Jules will create a plan, make code changes, and create PRs

For a simple chat interface, you might want to use a different AI API like:
- OpenAI's GPT API
- Anthropic's Claude API  
- Google's Gemini API

Would you like help setting up one of these alternatives instead?`,
      usage: null,
    });
  } catch (error) {
    console.error('Error calling Jules API:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with Jules API' },
      { status: 500 }
    );
  }
}
