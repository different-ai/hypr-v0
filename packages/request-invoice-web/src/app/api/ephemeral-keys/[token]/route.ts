import { NextResponse } from 'next/server';
import { ephemeralKeyService } from '@/lib/ephemeral-key-service';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const privateKey = await ephemeralKeyService.getPrivateKey(token);
    return NextResponse.json({ privateKey });
  } catch (error) {
    console.error('Error retrieving ephemeral key:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ephemeral key' },
      { status: 500 }
    );
  }
} 