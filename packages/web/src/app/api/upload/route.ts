import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { hasActiveSubscription } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request as HandleUploadBody
    const body = await request.json() as HandleUploadBody;
    const { userId } = getAuth(request);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user has an active subscription
    const isActive = await hasActiveSubscription(userId);
    if (!isActive) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Authenticate the user
        if (!userId) {
          throw new Error('Unauthorized: Please sign in to upload files');
        }
        
        return {
          allowedContentTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp'
          ],
          maxSize: 1024 * 1024 * 25, // 25MB max size
          tokenPayload: JSON.stringify({
            userId,
            timestamp: Date.now(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This will be called once the upload is completed
        try {
          // Here you could update a database with the file information
          console.log('Upload completed:', blob.url);
          
          if (tokenPayload) {
            const payload = JSON.parse(tokenPayload);
            console.log('Uploaded by:', payload.userId);
          }
          
          // Add to database if needed
          // const { userId } = JSON.parse(tokenPayload || '{}');
          // await db.insert({ fileUrl: blob.url, userId, createdAt: new Date() });
          
        } catch (error) {
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
