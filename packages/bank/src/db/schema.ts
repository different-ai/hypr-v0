import { pgTable, text, varchar, timestamp, bigint, primaryKey, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - Storing basic user info, identified by Privy DID
export const users = pgTable('users', {
  privyDid: text('privy_did').primaryKey(), // Privy Decentralized ID
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// UserSafes table - Linking users to their various Safe addresses
export const userSafes = pgTable('user_safes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), // Unique ID for the safe record
  userDid: text('user_did').notNull().references(() => users.privyDid), // Foreign key to users table
  safeAddress: varchar('safe_address', { length: 42 }).notNull(), // Ethereum address (42 chars)
  safeType: text('safe_type', { enum: ['primary', 'tax', 'liquidity', 'yield'] }).notNull(), // Type of Safe
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure a user can only have one Safe of each type
    userTypeUniqueIdx: uniqueIndex('user_safe_type_unique_idx').on(table.userDid, table.safeType),
  };
});

// AllocationStates table - Storing allocation data per primary Safe
export const allocationStates = pgTable('allocation_states', {
  userSafeId: text('user_safe_id').notNull().references(() => userSafes.id), // Foreign key to the specific primary user safe
  lastCheckedUSDCBalance: text('last_checked_usdc_balance').default('0').notNull(), // Storing as text to handle large numbers (wei)
  totalDeposited: text('total_deposited').default('0').notNull(),        // Storing as text
  allocatedTax: text('allocated_tax').default('0').notNull(),          // Storing as text
  allocatedLiquidity: text('allocated_liquidity').default('0').notNull(),    // Storing as text
  allocatedYield: text('allocated_yield').default('0').notNull(),        // Storing as text
  pendingDepositAmount: text('pending_deposit_amount').default('0').notNull(), // Storing as text
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    // Make userSafeId the primary key, as each primary safe has one state
    pk: primaryKey({ columns: [table.userSafeId] }),
  };
});

// UserFundingSources table - Storing linked bank accounts and crypto destinations
export const userFundingSources = pgTable('user_funding_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userPrivyDid: text('user_privy_did').notNull().references(() => users.privyDid, { onDelete: 'cascade' }),
  sourceCurrency: text('source_currency'),
  sourceBankName: text('source_bank_name'),
  sourceBankAddress: text('source_bank_address'),
  sourceBankRoutingNumber: text('source_bank_routing_number'),
  sourceBankAccountNumber: text('source_bank_account_number'), // TODO: Consider encryption for sensitive data
  sourceBankBeneficiaryName: text('source_bank_beneficiary_name'),
  sourceBankBeneficiaryAddress: text('source_bank_beneficiary_address'),
  sourcePaymentRail: text('source_payment_rail'),
  sourcePaymentRails: text('source_payment_rails').array(), // Array of supported rails
  destinationCurrency: text('destination_currency'),
  destinationPaymentRail: text('destination_payment_rail'),
  destinationAddress: varchar('destination_address', { length: 42 }), // Ethereum style address
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  safes: many(userSafes),
  fundingSources: many(userFundingSources),
}));

export const userSafesRelations = relations(userSafes, ({ one }) => ({
  user: one(users, {
    fields: [userSafes.userDid],
    references: [users.privyDid],
  }),
  allocationState: one(allocationStates, {
    fields: [userSafes.id],
    references: [allocationStates.userSafeId],
  }),
}));

export const allocationStatesRelations = relations(allocationStates, ({ one }) => ({
  userSafe: one(userSafes, {
    fields: [allocationStates.userSafeId],
    references: [userSafes.id],
  }),
}));

export const userFundingSourcesRelations = relations(userFundingSources, ({ one }) => ({
  user: one(users, {
    fields: [userFundingSources.userPrivyDid],
    references: [users.privyDid],
  }),
})); 