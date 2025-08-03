import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser, updateUserName, getUserChatHistory } from '../../../../lib/user-utils';

export async function POST(request: NextRequest) {
  try {
    const { action, userId, name } = await request.json();

    switch (action) {
      case 'create':
        const user = await createOrGetUser(userId);
        return NextResponse.json({ user });

      case 'updateName':
        if (!userId || !name) {
          return NextResponse.json({ error: 'Missing userId or name' }, { status: 400 });
        }
        await updateUserName(userId, name);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (documentId) {
      const chatHistory = await getUserChatHistory(userId, parseInt(documentId));
      return NextResponse.json({ chatHistory });
    } else {
      const user = await createOrGetUser(userId);
      return NextResponse.json({ user });
    }
  } catch (error) {
    console.error('User GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}