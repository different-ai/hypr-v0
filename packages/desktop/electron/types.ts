export interface VaultConfig {
  path: string;
  isObsidian: boolean;
  lastOpened: string;
  vaultName?: string;
}

export interface FileInfo {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface MarkdownContent {
  frontMatter: any;
  content: string;
}

export interface ElectronAPI {
  // ... existing methods ...

  // Mercury API
  mercuryApi: {
    createPayment: (params: {
      accountId: string;
      amount: number;
      currency: string;
      recipientName: string;
      routingNumber?: string;
      accountNumber?: string;
      reference?: string;
    }) => Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    getApiKey: () => Promise<string | null>;
    setApiKey: (key: string) => Promise<void>;
    deleteApiKey: () => Promise<boolean>;
  };
} 