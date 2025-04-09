import { initTRPC, TRPCError } from '@trpc/server';
import { ContextType } from './context';
import { getUser } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Initialize tRPC
const t = initTRPC.context<ContextType>().create();

// Export middlewares and procedures
export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

// Create protected procedure (requires authentication)
const isAuthed = middleware(async ({ ctx, next }) => {
  // The getUser function already handles token verification
  const user = await getUser();

  if (!user || !user.id) {
    // If getUser returns null or no id, authentication failed
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  const privyDid = user.id;

  try {
    // Check if user exists in the database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.privyDid, privyDid),
      columns: { privyDid: true }, // Only need to check for existence
    });

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log(`User with DID ${privyDid} not found in DB. Creating...`);
      await db.insert(users).values({ privyDid: privyDid });
      console.log(`User with DID ${privyDid} created successfully.`);
    }
  } catch (dbError) {
    console.error(`Database error during user check/creation for DID ${privyDid}:`, dbError);
    // Handle potential DB errors, e.g., connection issues
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database operation failed during authentication.',
      cause: dbError,
    });
  }

  // Pass the authenticated user ID to the context
  return next({
    ctx: {
      ...ctx,
      // Add the authenticated user ID to the context
      user: { id: user.id }, 
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Create a context function for the API route
export const createContext = async ({ req }: { req: Request }) => {
  // use privy to get user did
  const user = await getUser();
  // You can add session handling or other context here
  return {
    req,
    user: { id: user?.id }, // Replace with actual session management
  };
};
