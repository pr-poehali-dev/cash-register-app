interface BarcodeDetector {
  detect(image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{ rawValue: string; format: string }>>;
}

// eslint-disable-next-line no-var
declare var BarcodeDetector: {
  prototype: BarcodeDetector;
  new(options?: { formats?: string[] }): BarcodeDetector;
};