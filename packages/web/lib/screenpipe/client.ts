import { pipe } from '@screenpipe/js';
import { db } from '../db/index';
import type { NodePipe } from '@screenpipe/js';
import { ocrData } from '../db/schema';
import type { OCRData } from '../db/schema';

export interface OCRFrame {
  id: string;
  app_name?: string;
  window_name?: string;
  ocr_results: Array<{
    text: string;
    text_json: string;
    ocr_engine: string;
    focused: boolean;
  }>;
}

export class ScreenPipeClient {
  private static instance: ScreenPipeClient;
  private batchSize = 50;
  private batchTimeout = 10000; // 10 seconds
  private batch: Array<OCRData> = [];
  private batchTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ScreenPipeClient {
    if (!this.instance) {
      this.instance = new ScreenPipeClient();
    }
    return this.instance;
  }

  async addOCRData(data: OCRFrame) {
    try {
      return await (pipe as NodePipe).capture({ type: 'ocr', data });
    } catch (error) {
      console.error('Failed to add OCR data to screenpipe:', error);
      throw error;
    }
  }

  async queryOCRData(params: {
    q?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }) {
    try {
      return await (pipe as NodePipe).query({
        ...params,
        type: 'ocr',
        includeFrames: false,
      });
    } catch (error) {
      console.error('Failed to query OCR data from screenpipe:', error);
      throw error;
    }
  }

  private async flushBatch() {
    if (this.batch.length === 0) return;
    
    try {
      await db.insert(ocrData).values(this.batch);
      this.batch = [];
    } catch (error) {
      console.error('Failed to flush OCR batch to database:', error);
      throw error;
    }
  }

  async processBatch(data: OCRData) {
    this.batch.push(data);
    
    if (this.batch.length >= this.batchSize) {
      await this.flushBatch();
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, this.batchTimeout);
  }
}

export const screenPipe = ScreenPipeClient.getInstance();                                        