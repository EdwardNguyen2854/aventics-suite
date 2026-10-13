export {};
declare global {
  interface Window {
    aventics: {
      request<T = unknown>(path: string, method?: string, body?: unknown): Promise<T>;
      openDocs(componentId: string): Promise<boolean>;
      readSuiteDoc(relativePath: string): Promise<string>;
      version(): Promise<string>;
      mode(): Promise<"user" | "developer">;
      checkUpdates(): Promise<{ enabled: boolean; status: string; currentVersion?: string; availableVersion?: string | null }>;
    };
  }
}
