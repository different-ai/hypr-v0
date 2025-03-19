import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { userProfileService } from '@/lib/user-profile-service';

export async function POST(req: NextRequest) {
  // Get the webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  
  // Get the headers
  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');
  
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }
  
  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret);
  
  let evt: WebhookEvent;
  
  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 });
  }
  
  // Handle the webhook event
  const eventType = evt.type;
  
  if (eventType === 'user.updated') {
    // Check if subscription status changed
    const userData = evt.data;
    const userId = userData.id;
    const subscriptionStatus = userData.private_metadata?.subscriptionStatus;
    
    if (subscriptionStatus === 'canceled') {
      await userProfileService.updateSubscriptionStatus(userId, 'canceled');
      console.log(`Updated subscription status to canceled for user ${userId}`);
    } else if (subscriptionStatus === 'active') {
      await userProfileService.updateSubscriptionStatus(userId, 'active');
      console.log(`Updated subscription status to active for user ${userId}`);
    }
  }
  
  return NextResponse.json({ success: true });
}
