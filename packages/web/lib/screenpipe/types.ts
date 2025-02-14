export interface ScreenPipeClient {
  addFrame(data: { type: string; data: any }): Promise<void>;
  getFrames(params: { type: string; includeFrames?: boolean }): Promise<any>;
}
