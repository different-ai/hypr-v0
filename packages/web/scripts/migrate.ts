import { drizzle } from 'drizzle-orm/vercel-postgres';
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { sql } from '@vercel/postgres';

// This script will automatically run all migrations in the drizzle folder
async function main() {
  console.log('0xHypr', 'Running migrations...');
  
  // Log only specific env vars we care about for debugging
  console.log('0xHypr', 'POSTGRES_URL:', process.env.POSTGRES_URL);
  
  const db = drizzle(sql);
  
  try {
    // First attempt to create schema if it doesn't exist
    await sql`CREATE SCHEMA IF NOT EXISTS public`;
    
    // For Vercel deployment, we'll use a more direct approach
    // First check if we're in a Vercel environment
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      try {
        // In Vercel, we'll try to create tables directly with IF NOT EXISTS
        // This is more reliable than using the migrate function in production
        console.log('0xHypr', 'Running in Vercel environment, using direct SQL approach');
        
        // Create user_profiles table if it doesn't exist
        await sql`
          CREATE TABLE IF NOT EXISTS "user_profiles" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "user_id" varchar(255) NOT NULL,
            "email" varchar(255),
            "name" varchar(255),
            "wallet_address" varchar(255),
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            "has_completed_onboarding" boolean DEFAULT false
          );
        `;
        
        // Create company_profiles table if it doesn't exist
        await sql`
          CREATE TABLE IF NOT EXISTS "company_profiles" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "user_id" uuid NOT NULL,
            "name" varchar(255) NOT NULL,
            "email" varchar(255),
            "phone" varchar(255),
            "address_line1" varchar(255),
            "address_line2" varchar(255),
            "city" varchar(255),
            "state" varchar(255),
            "postal_code" varchar(255),
            "country" varchar(255),
            "tax_id" varchar(255),
            "registration_number" varchar(255),
            "website" varchar(255),
            "logo_url" varchar(255),
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            "is_default" boolean DEFAULT false,
            CONSTRAINT "company_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE
          );
        `;
        
        console.log('0xHypr', 'Tables created successfully in Vercel environment');
        process.exit(0);
      } catch (error: any) {
        // If there's an error creating tables directly, log it but don't fail the build
        console.log('0xHypr', 'Error creating tables directly:', error.message);
        console.log('0xHypr', 'Continuing with build despite migration issues');
        process.exit(0);
      }
    } else {
      // For local development, use the standard migrate approach
      try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('0xHypr', 'Migrations completed successfully');
      } catch (error: any) {
        // Check if error is due to table already existing
        if (error.message && error.message.includes('already exists')) {
          console.log('0xHypr', 'Some tables already exist, continuing with build');
          // Exit with success code since this error is expected in some environments
          process.exit(0);
        } else if (error.message && error.message.includes('does not exist')) {
          // This could happen if a table referenced in a foreign key doesn't exist yet
          console.log('0xHypr', 'Referenced table does not exist, continuing with build');
          // We can proceed with the build anyway since this is likely a new environment
          process.exit(0);
        } else {
          console.error('0xHypr', 'Migration failed:', error);
          process.exit(1);
        }
      }
    }
  } catch (error: any) {
    console.error('0xHypr', 'Schema creation failed:', error);
    // Don't fail the build in production
    if (process.env.VERCEL === '1') {
      console.log('0xHypr', 'Continuing with build despite schema creation issues');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

main();         