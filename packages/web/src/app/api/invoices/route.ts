import { NextRequest, NextResponse } from 'next/server';
import { getUserRequests, UserRequest } from '@/lib/request-network';
import { getAuth, currentUser } from '@clerk/nextjs/server';
import { userProfileService } from '@/lib/user-profile-service';
import { userRequestService } from '@/lib/user-request-service';
import { hasActiveSubscription } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
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

    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user email
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ invoices: [] });
    }

    // Get or create user profile if it doesn't exist yet
    let wallet = null;
    let paymentAddress = null;
    
    try {
      // Get or create user profile
      const userProfile = await userProfileService.getOrCreateProfile(userId, userEmail);
      
      // Get user wallet for fetching requests
      try {
        wallet = await userProfileService.getOrCreateWallet(userId);
        console.log('0xHypr', 'Using wallet address for request lookup:', wallet.address);
      } catch (error) {
        console.error('0xHypr', 'Error getting wallet:', error);
      }
      
      // Get payment address (might be different from wallet address)
      try {
        paymentAddress = await userProfileService.getPaymentAddress(userId);
      } catch (error) {
        console.error('0xHypr', 'Error getting payment address:', error);
      }
    } catch (error) {
      console.error('0xHypr', 'Error getting/creating user profile:', error);
      // Continue anyway - we can still get the invoices
    }
    
    // Use wallet address if available, otherwise fall back to email only
    const walletAddress = wallet?.address || '';
    
    console.log('0xHypr DEBUG - Wallet information:', {
      walletExists: !!wallet,
      walletAddress: walletAddress,
      hasEmptyAddress: walletAddress === '',
      userEmail: userEmail,
    });
    
    // Get user requests from our database instead of the Request Network API
    console.log('0xHypr', 'Fetching user requests from database for user:', userId);
    
    try {
      const dbRequests = await userRequestService.getUserRequests(userId);
      console.log('0xHypr DEBUG - Database requests fetch completed, found:', dbRequests.length);
      
      // Log some details of the requests if any were found
      if (dbRequests.length > 0) {
        console.log('0xHypr DEBUG - First few database requests:', dbRequests.slice(0, 3).map(req => ({
          id: req.id,
          requestId: req.requestId,
          description: req.description,
          createdAt: req.createdAt
        })));
      }
    } catch (error) {
      console.error('0xHypr DEBUG - Error fetching requests from database:', error);
    }
    
    // Attempt to fetch again for the actual assignment
    const dbRequests = await userRequestService.getUserRequests(userId);
    
    // If we found requests in the database, use those
    if (dbRequests.length > 0) {
      console.log('0xHypr', `Found ${dbRequests.length} requests in database for user ${userId}`);
      
      // Map the database requests to the format expected by the UI
      const validInvoices = dbRequests.map(request => ({
        requestId: request.requestId,
        creationDate: request.createdAt.toISOString(),
        description: request.description || 'Invoice',
        client: request.client || 'Unknown Client',
        amount: request.amount || '0',
        currency: request.currency || 'EURe',
        status: request.status as 'pending' | 'paid',
        url: `/invoice/${request.requestId}`,
        role: request.role as 'seller' | 'buyer'
      }));
      
      console.log('0xHypr', `Returning ${validInvoices.length} invoices from database for user ${userEmail}`);
      
      // Return the invoices along with the user's wallet info
      return NextResponse.json({ 
        invoices: validInvoices,
        walletAddress: wallet?.address || null,
        paymentAddress: paymentAddress,
        userEmail: userEmail 
      });
    }
    
    // If no requests found in database, fall back to the old method
    console.log('0xHypr', 'No requests found in database, falling back to Request Network API');
    
    // Get user requests using our dedicated service function with both wallet address and email
    const userRequests = await getUserRequests(walletAddress, userEmail);
    
    // The function already returns objects with the correct structure
    // We just need to map them to the final format our UI expects
    const validInvoices = userRequests.map((request: UserRequest) => ({
      requestId: request.requestId,
      creationDate: request.creationDate,
      description: request.description,
      client: request.client,
      amount: request.amount,
      currency: request.currency,
      status: request.status,
      url: request.url,
      role: request.role
    }));
    
    // Store the fetched requests in our database for future use
    if (validInvoices.length > 0) {
      console.log('0xHypr', `Storing ${validInvoices.length} requests from Request Network in database`);
      
      for (const invoice of validInvoices) {
        try {
          // Only add if it doesn't already exist
          const exists = await userRequestService.requestExists(invoice.requestId);
          if (!exists) {
            await userRequestService.addRequest({
              requestId: invoice.requestId,
              userId: userId,
              walletAddress: walletAddress,
              role: invoice.role,
              description: invoice.description,
              amount: invoice.amount,
              currency: invoice.currency,
              status: invoice.status,
              client: invoice.client,
            });
          }
        } catch (error) {
          console.error('0xHypr', 'Error storing request in database:', error);
          // Continue anyway, as we still want to return the invoices
        }
      }
    }
    
    console.log('0xHypr', `Returning ${validInvoices.length} invoices for user ${userEmail} from Request Network`);
    
    // Return the invoices along with the user's wallet info
    return NextResponse.json({ 
      invoices: validInvoices,
      walletAddress: wallet?.address || null,
      paymentAddress: paymentAddress,
      userEmail: userEmail 
    });
  } catch (error) {
    console.error('0xHypr', 'Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
