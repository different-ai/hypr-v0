'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Explicitly define the type for a user object returned by listUsers query
// This should match the actual structure from userService.listUsers()
interface AdminUserDisplay {
  privyDid: string;
  email: string;
  businessName: string | null; // Assuming it can be null based on usage `user.businessName || 'N/A'`
  createdAt: string | Date | null; // Can be string or Date from DB/API
  hasCompletedOnboarding: boolean;
  alignCustomerId: string | null;
  kycStatus: string | null;
  kycFlowLink?: string | null; // Optional if not always present
  // Add other fields if they exist and are used, e.g., from your DB schema
  // loopsContactSynced?: boolean | null;
  // companyProfileId?: string | null;
  // etc.
}

// Type for the direct Align KYC details from getAlignCustomerDirectDetails
interface AlignDirectDetailsType {
  customer_id: string;
  email: string;
  kycs: {
    status: 'pending' | 'approved' | 'rejected' | null;
    kyc_flow_link: string | null;
  } | null;
}

export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ privyDid: string, email: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<{ privyDid: string, email: string } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const [userForBankAccount, setUserForBankAccount] = useState<{ privyDid: string, email: string } | null>(null);
  const [isBankAccountDialogOpen, setIsBankAccountDialogOpen] = useState(false);
  const [accountType, setAccountType] = useState<'us_ach' | 'iban'>('us_ach');
  const [sourceCurrency, setSourceCurrency] = useState<'usd' | 'eur'>('usd');

  const [userForAlignDirectDetails, setUserForAlignDirectDetails] = useState<AdminUserDisplay | null>(null);
  const [isAlignDirectDetailsDialogOpen, setIsAlignDirectDetailsDialogOpen] = useState(false);
  
  const { data: usersData, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = api.admin.listUsers.useQuery(
    { adminToken },
    {
      enabled: isTokenValid,
      retry: false,
    }
  );
  // Explicitly cast here after fetching. `usersData` type is inferred from the query.
  const users: AdminUserDisplay[] | undefined = usersData as AdminUserDisplay[] | undefined;

  const {
    data: alignDirectDetailsData, 
    isLoading: isLoadingAlignDirectDetails,
    isError: isAlignDirectDetailsError, // Using isError for boolean check
    error: alignDirectDetailsErrorData, // Actual error object
    refetch: fetchAlignDirectDetailsQuery,
  } = api.admin.getAlignCustomerDirectDetails.useQuery(
    {
      adminToken,
      privyDid: userForAlignDirectDetails?.privyDid ?? '', 
    },
    {
      enabled: !!userForAlignDirectDetails?.privyDid && isAlignDirectDetailsDialogOpen, 
      retry: false,
      // onSuccess and onError are not standard options here for side-effects like toasts
      // These are handled by useEffect below or globally in QueryClient
    }
  );
  // Use the data from the query directly in the dialog
  const alignDirectDetails: AlignDirectDetailsType | null | undefined = alignDirectDetailsData;

  // Effect for handling users query errors
  useEffect(() => {
    if (usersError) {
      console.error('Error fetching users:', usersError);
      toast.error(`Error fetching users: ${usersError.message}`);
      setIsTokenValid(false);
    }
  }, [usersError]);

  // Effect for handling Align direct details query side-effects (toasts)
  useEffect(() => {
    if (userForAlignDirectDetails) { // Only show toasts if a fetch was attempted for a user
        if (alignDirectDetailsData && !isLoadingAlignDirectDetails && !isAlignDirectDetailsError) {
            // Check if it's not the initial undefined state and not loading
            if (alignDirectDetailsData !== undefined) { // Avoid toast on initial mount before fetch attempt
                 // toast.success('Align details fetched successfully.'); // Can be noisy, enable if desired
            }
        } else if (isAlignDirectDetailsError && alignDirectDetailsErrorData) {
            toast.error(`Failed to fetch Align details: ${alignDirectDetailsErrorData.message}`);
        }
    }
  }, [alignDirectDetailsData, isLoadingAlignDirectDetails, isAlignDirectDetailsError, alignDirectDetailsErrorData, userForAlignDirectDetails]);
  
  const deleteMutation = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      refetchUsers();
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  });
  
  const resetAlignMutation = api.admin.resetUserAlignData.useMutation({
    onSuccess: (data) => {
      setIsResetDialogOpen(false);
      setUserToReset(null);
      toast.success(data.message);
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to reset Align data: ${error.message}`);
    }
  });
  
  const simulateBankAccountMutation = api.admin.simulateVirtualBankAccount.useMutation({
    onSuccess: (data) => {
      setIsBankAccountDialogOpen(false);
      setUserForBankAccount(null);
      toast.success(data.message);
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to simulate bank account: ${error.message}`);
    }
  });
  
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminToken.trim() === '') {
      toast.error('Please enter an admin token');
      return;
    }
    setIsTokenValid(true); // This will trigger the users query via `enabled` flag
  };
  
  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteMutation.mutate({ adminToken, privyDid: userToDelete.privyDid });
  };
  
  const handleResetAlignData = () => {
    if (!userToReset) return;
    resetAlignMutation.mutate({ adminToken, privyDid: userToReset.privyDid });
  };
  
  const handleSimulateVirtualBankAccount = () => {
    if (!userForBankAccount) return;
    simulateBankAccountMutation.mutate({
      adminToken,
      privyDid: userForBankAccount.privyDid,
      accountType,
      sourceCurrency,
    });
  };
  
  const openAlignDirectDetailsDialog = (user: AdminUserDisplay) => {
    setUserForAlignDirectDetails(user); 
    setIsAlignDirectDetailsDialogOpen(true);
    // The query will be enabled by the state change. 
    // If an explicit re-fetch is needed (e.g. user clicks button again for same user):
    if (user.privyDid === userForAlignDirectDetails?.privyDid) {
        fetchAlignDirectDetailsQuery();
    } // Otherwise, the change in userForAlignDirectDetails (and thus privyDid in query key) will trigger it if dialog is open.
  };
  
  const formatDate = (dateInput: string | null | undefined | Date) => {
    if (!dateInput) return 'N/A';
    try {
      return format(new Date(dateInput), 'MMM d, yyyy HH:mm');
    } catch (e) {
      console.error('Error formatting date:', dateInput, e);
      return 'Invalid Date';
    }
  };
  
  return (
    <div className="space-y-8">
      {!isTokenValid ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin Authentication</CardTitle>
            <CardDescription>Please enter your admin token to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="adminToken" className="text-sm font-medium">Admin Token</label>
                <Input
                  id="adminToken"
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="Enter admin token"
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full">
                Authenticate
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="text-center py-4">Loading users...</div>
              ) : usersError ? (
                <div className="text-center py-4 text-red-500">
                  Error loading users: {usersError.message}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Onboarding</TableHead>
                      <TableHead>DB KYC Status</TableHead>
                      <TableHead>Align Customer ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.length > 0 ? (
                      users.map((user: AdminUserDisplay) => ( 
                        <TableRow key={user.privyDid}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.businessName || 'N/A'}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>{user.hasCompletedOnboarding ? 'Complete' : 'Incomplete'}</TableCell>
                          <TableCell>{user.kycStatus || 'N/A'}</TableCell>
                          <TableCell>{user.alignCustomerId || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <AlertDialog open={isDeleteDialogOpen && userToDelete?.privyDid === user.privyDid} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setUserToDelete({ privyDid: user.privyDid, email: user.email });
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user
                                      <strong> {userToDelete?.email}</strong> and all associated data including invoices, wallets, and company profiles.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteUser}
                                      disabled={deleteMutation.isPending}
                                    >
                                      {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog open={isResetDialogOpen && userToReset?.privyDid === user.privyDid} onOpenChange={setIsResetDialogOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setUserToReset({ privyDid: user.privyDid, email: user.email });
                                      setIsResetDialogOpen(true);
                                    }}
                                  >
                                    Reset Align
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Align Data?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will reset the Align KYC status and remove any associated virtual account details for user
                                      <strong> {userToReset?.email}</strong>. The user will need to redo the KYC process.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setUserToReset(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleResetAlignData}
                                      disabled={resetAlignMutation.isPending}
                                      className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                      {resetAlignMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog 
                                open={isBankAccountDialogOpen && userForBankAccount?.privyDid === user.privyDid} 
                                onOpenChange={setIsBankAccountDialogOpen}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-600 text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      setUserForBankAccount({ privyDid: user.privyDid, email: user.email });
                                      setIsBankAccountDialogOpen(true);
                                    }}
                                  >
                                    Simulate Bank
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Simulate Virtual Bank Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will create a simulated virtual bank account for user <strong>{userForBankAccount?.email}</strong>.
                                      This is for testing purposes only.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  
                                  <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">Account Type</h4>
                                      <RadioGroup 
                                        value={accountType} 
                                        onValueChange={(value) => setAccountType(value as 'us_ach' | 'iban')}
                                        className="flex gap-4"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="us_ach" id="us_ach" />
                                          <Label htmlFor="us_ach">US ACH</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="iban" id="iban" />
                                          <Label htmlFor="iban">IBAN (Europe)</Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="currency" className="text-sm font-medium">
                                        Currency
                                      </Label>
                                      <Select 
                                        value={sourceCurrency} 
                                        onValueChange={(value) => setSourceCurrency(value as 'usd' | 'eur')}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="usd">USD (US Dollar)</SelectItem>
                                          <SelectItem value="eur">EUR (Euro)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="text-sm text-muted-foreground">
                                      This will auto-approve the user&apos;s KYC status if not already approved.
                                    </div>
                                  </div>
                                  
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setUserForBankAccount(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleSimulateVirtualBankAccount}
                                      disabled={simulateBankAccountMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {simulateBankAccountMutation.isPending ? 'Creating...' : 'Create Bank Account'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog 
                                open={isAlignDirectDetailsDialogOpen && userForAlignDirectDetails?.privyDid === user.privyDid} 
                                onOpenChange={(isOpen) => {
                                  setIsAlignDirectDetailsDialogOpen(isOpen);
                                  if (!isOpen) setUserForAlignDirectDetails(null); 
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                                    onClick={() => openAlignDirectDetailsDialog(user)}
                                  >
                                    Align Data
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Align Customer Details (Direct)</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Directly fetched KYC and customer information from Align for <strong>{userForAlignDirectDetails?.email}</strong>.
                                      <br/>DB Record - Align Customer ID: {userForAlignDirectDetails?.alignCustomerId || 'N/A'}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  
                                  <div className="py-4 space-y-3 text-sm">
                                    {isLoadingAlignDirectDetails ? (
                                      <p>Loading Align details...</p>
                                    ) : isAlignDirectDetailsError ? (
                                      <p className="text-red-500">Error: {alignDirectDetailsErrorData?.message || 'Failed to load Align details.'}</p>
                                    ) : alignDirectDetails === null && userForAlignDirectDetails ? ( // Check userForAlignDirectDetails to ensure a fetch was attempted
                                      <p className="text-gray-500">No Align customer ID found for this user, or no details returned from Align.</p>
                                    ) : alignDirectDetails ? (
                                      <>
                                        <p><strong>Align Customer ID:</strong> {alignDirectDetails.customer_id}</p>
                                        <p><strong>Align Email:</strong> {alignDirectDetails.email}</p>
                                        {alignDirectDetails.kycs ? (
                                          <>
                                            <p><strong>KYC Status (Align):</strong> <span className={`font-semibold ${alignDirectDetails.kycs.status === 'approved' ? 'text-green-600' : alignDirectDetails.kycs.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>{alignDirectDetails.kycs.status || 'N/A'}</span></p>
                                            <p><strong>KYC Flow Link (Align):</strong> {alignDirectDetails.kycs.kyc_flow_link ? <a href={alignDirectDetails.kycs.kyc_flow_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open Link</a> : 'N/A'}</p>
                                          </>
                                        ) : (
                                          <p className="text-orange-500">No KYC details returned from Align for this customer.</p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-gray-500">Select a user and open dialog to fetch details.</p> 
                                    )}
                                  </div>
                                  
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => {
                                        setIsAlignDirectDetailsDialogOpen(false);
                                        setUserForAlignDirectDetails(null);
                                    }}>
                                      Close
                                    </AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No users found or token invalid.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTokenValid(false);
                  setAdminToken('');
                  setUserForAlignDirectDetails(null); 
                }}
              >
                Log Out
              </Button>
              <Button
                onClick={() => refetchUsers()} 
                disabled={isLoadingUsers} 
              >
                Refresh Users
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
} 