import { drizzle } from 'drizzle-orm/vercel-postgres';
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { sql } from '@vercel/postgres';

// This script will automatically run all migrations in the drizzle folder
async function main() {
  console.log('0xHypr', 'Running migrations...');
  
  const db = drizzle(sql);
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('0xHypr', 'Migrations completed successfully');
  } catch (error) {
    console.error('0xHypr', 'Migration failed:', error);
    process.exit(1);
  }
}

main(); 