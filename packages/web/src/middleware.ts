
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server';
import { hasActiveSubscription } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Skip subscription check for non-API routes and authentication routes
  if (!request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/api/ephemeral-keys')) {
    return NextResponse.next();
  }

  // Get the user ID from the request
  const authObject = getAuth(request);
  const userId = authObject.userId;
  
  // If no user ID, return unauthorized
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Check if the user has an active subscription
  const isActive = await hasActiveSubscription(userId);
  if (!isActive) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
  }
  
  // User is authenticated and has an active subscription, proceed
  return NextResponse.next();
}

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

