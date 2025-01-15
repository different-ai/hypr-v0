import { Types } from '@requestnetwork/request-client.js';

export interface VaultConfig {
  path: string
  isObsidian?: boolean
}

export interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
}

export interface MarkdownContent {
  content: string
  frontMatter: any
  stats: {
    birthtime: string
    mtime: string
    atime: string
  }
}

export interface ICreateRequestParameters {
  requestInfo: Types.IRequestInfo;
  paymentNetwork: {
    id: Types.Extension.PAYMENT_NETWORK_ID;
    parameters: Types.IPaymentNetworkParameters;
  };
  contentData: any;
}

export interface ElectronAPI {
  // Vault management
  getVaultConfig: () => Promise<VaultConfig | null>
  saveVaultConfig: (config: VaultConfig) => Promise<boolean>
  selectVaultDirectory: () => Promise<{ success: boolean; path?: string; isObsidian?: boolean }>
  createNewVault: () => Promise<{ success: boolean; path?: string; isObsidian?: boolean }>

  // File operations
  createFolder: (folderPath: string) => Promise<boolean>
  readMarkdownFile: (path: string) => Promise<MarkdownContent>
  writeMarkdownFile: (path: string, content: string) => Promise<boolean>
  getFileStats: (filePath: string) => Promise<{ birthtime: string; mtime: string; atime: string }>
  listFiles: (directory: string) => Promise<FileInfo[]>
  listMarkdownFiles: (directory: string) => Promise<FileInfo[]>
  openExternal: (url: string) => Promise<void>
  writeMarkdownToVault: (name: string, content: string) => Promise<boolean>
  listFolderContents: (folderPath: string) => Promise<FileInfo[]>
  revealInFileSystem: (path: string) => Promise<void>

  // File watching
  watchFiles: (path: string, callback: (path: string) => void) => Promise<void>
  unwatchFiles: (path: string) => Promise<void>
  watchFolder: (folderPath: string, callback: (event: any, files: FileInfo[]) => void) => Promise<void>
  unwatchFolder: (folderPath: string) => Promise<void>

  // Task management
  createTask: (taskData: { name: string; description: string }) => Promise<any>
  getAllTasks: (vaultPath: string) => Promise<any>
  analyzeMarkdownForTasks: (filePath: string) => Promise<Array<{ completed: boolean; title: string; tags: string[] }>>
  updateTaskInFile: (filePath: string, task: any) => Promise<boolean>
  openFile: (filePath: string) => Promise<void>
  openInObsidian: (filePath: string) => Promise<void>

  // Note operations
  findLinkedNotes: (filePath: string) => Promise<string[]>

  // Calendar operations
  addToCalendar: (params: { 
    icsPath: string, 
    content: string,
    event: {
      title: string
      startTime: string
      endTime: string
      location?: string
      description?: string
      attendees?: string[]
    }
  }) => Promise<any>
  openCalendar: (calendarUrl: string) => Promise<any>

  // Invoice operations
  processInvoice: (invoice: {
    recipient: {
      name: string
      address?: string
      email?: string
    }
    amount: number
    currency: string
    description: string
    dueDate?: string
  }) => Promise<any>

  // Request Network methods
  createInvoiceRequest: (data: Partial<ICreateRequestParameters>) => Promise<{ success: boolean; requestId: string; token: string; error?: string }>;
  getPayeeAddress: () => Promise<string>;
  generateInvoiceUrl: (requestId: string, token: string) => Promise<string>;
  getUserRequests: () => Promise<Array<{
    requestId: string;
    amount: string;
    currency: Types.ICurrency;
    status: string;
    timestamp: number;
    description: string;
    payer?: {
      type: Types.Identity.TYPE;
      value: string;
    };
    payee: {
      type: Types.Identity.TYPE;
      value: string;
    };
  }>>;
  searchMarkdownFiles: (params: {
    query?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    metadata?: Record<string, any>;
    fuzzyMatch?: boolean;
  }) => Promise<MarkdownSearchResult[]>;
  getMarkdownMetadata: (filePath: string) => Promise<Record<string, any>>;  
  getMarkdownContent: (filePath: string) => Promise<string>;
  

  // Hyperscroll Directory Management
  ensureHyperscrollDir: () => Promise<string>;

  // Ephemeral key methods
  generateEphemeralKey: () => Promise<{ token: string; publicKey: string }>;
  getEphemeralKey: (token: string) => Promise<string | null>;
  storeEphemeralKey: (requestId: string, privateKey: string) => Promise<string>;

  // Business Profile Methods
  getBusinessProfile: () => Promise<any>;
  saveBusinessProfile: (profile: any) => Promise<boolean>;
  hasBusinessProfile: () => Promise<boolean>;
  deleteBusinessProfile: () => Promise<boolean>;

  // Wallet Methods
  getWalletAddress: () => Promise<string>;
  setWalletAddress: (address: string) => Promise<boolean>;
  getWalletAddresses: () => Promise<Array<{ address: string; isDefault: boolean }>>;
  setDefaultWalletAddress: (address: string) => Promise<boolean>;
  addWalletAddress: (address: string) => Promise<boolean>;
  removeWalletAddress: (address: string) => Promise<boolean>;
  getWalletPrivateKey: () => Promise<string>;

  // Request Network Methods
  getUserRequests: () => Promise<any[]>;
  generateInvoiceUrl: (requestId: string, token: string) => Promise<string>;
  createInvoiceRequest: (data: any) => Promise<{ requestId: string; token: string; success: boolean }>;
}