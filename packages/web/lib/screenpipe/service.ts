import { screenPipe } from './client';
import { saveOCRData } from '../db/queries';
import type { OCRFrame } from './client';
import type { OCRData } from '../db/schema';

export class OCRProcessingService {
  private static instance: OCRProcessingService;

  private constructor() {}

  static getInstance(): OCRProcessingService {
    if (!this.instance) {
      this.instance = new OCRProcessingService();
    }
    return this.instance;
  }

  async processOCRFrame(frame: OCRFrame, userId: string) {
    try {
      const ocrData: OCRData = {
        id: crypto.randomUUID(),
        frameId: frame.id,
        appName: frame.app_name ?? null,
        windowName: frame.window_name ?? null,
        ocrText: frame.ocr_results
          .map(result => result.text)
          .join('\n'),
        tsv_content: new Array(1536).fill(0), // Initialize vector with zeros
        metadata: frame,
        userId,
        createdAt: new Date(),
      };

      await screenPipe.processBatch(ocrData);
    } catch (error) {
      console.error('Failed to process OCR frame:', error);
      throw error;
    }
  }
}

export const ocrProcessor = OCRProcessingService.getInstance();
