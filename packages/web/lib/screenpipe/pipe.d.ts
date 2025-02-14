declare module '@screenpipe/js' {
  export interface NodePipe {
    capture(data: { type: string; data: any }): Promise<void>;
    query(params: { type: string; includeFrames?: boolean }): Promise<any>;
  }

  export const pipe: NodePipe;
}
