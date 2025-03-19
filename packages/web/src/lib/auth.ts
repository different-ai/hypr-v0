import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { userProfilesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Returns the current user's ID or redirects to sign-in if not authenticated
 */
export async function getUserIdOrRedirect() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

/**
 * Returns the current user object or redirects to sign-in if not authenticated
 */
export async function getUserOrRedirect() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return user;
}

/**
 * Returns the user ID from auth() without redirecting
 * Useful for components that need to conditionally render based on auth state
 */
export async function getUserId() {
  const { userId } = await auth();
  return userId;
}

/**
 * Checks if the user is authenticated
 */
export async function isAuthenticated() {
  const { userId } = await auth();
  return !!userId;
}

/**
 * Checks if the user has an active subscription
 * Returns true if active, false if canceled or not found
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.clerkId, userId))
      .limit(1);
    
    if (profiles.length === 0) {
      return false;
    }
    
    return profiles[0].subscriptionStatus === 'active';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}
