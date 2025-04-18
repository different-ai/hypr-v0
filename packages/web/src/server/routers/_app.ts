import { router } from '../create-router';
import { invoiceRouter } from './invoice-router';
import { fundingSourceRouter } from './funding-source-router';
import { allocationsRouter } from './allocations-router';
import { userSafesRouter } from './settings/user-safes';
import { bankAccountsRouter } from './settings/bank-accounts-router';
import { safeRouter } from './safe-router';
import { onboardingRouter } from './onboarding-router';
import { companyProfileRouter } from './company-profile-router';
import { alignRouter } from './align-router';
import { adminRouter } from './admin-router';

// Test router for superjson functionality

export const appRouter = router({
  invoice: invoiceRouter,
  fundingSource: fundingSourceRouter,
  allocations: allocationsRouter,
  safe: safeRouter,
  onboarding: onboardingRouter,
  settings: router({
    userSafes: userSafesRouter,
    bankAccounts: bankAccountsRouter,
  }),
  companyProfile: companyProfileRouter,
  align: alignRouter,
  admin: adminRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
