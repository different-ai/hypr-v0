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

export interface ElectronAPI {
  // Vault management
  getVaultConfig: () => Promise<VaultConfig | null>
  saveVaultConfig: (config: VaultConfig) => Promise<boolean>
  selectVaultDirectory: () => Promise<{ success: boolean; path?: string; isObsidian?: boolean }>
  createNewVault: () => Promise<{ success: boolean; path?: string; isObsidian?: boolean }>

  // File operations
  readMarkdownFile: (path: string) => Promise<MarkdownContent>
  writeMarkdownFile: (path: string, content: string) => Promise<boolean>
  getFileStats: (filePath: string) => Promise<{ birthtime: string; mtime: string; atime: string }>
  listFiles: (directory: string) => Promise<FileInfo[]>
  listMarkdownFiles: (directory: string) => Promise<FileInfo[]>
  openExternal: (url: string) => Promise<void>
}