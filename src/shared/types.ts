export type ScreenshotItem = {
  id: string;
  image: string;
  pageUrl: string;
  createdAt: number;
  capturePosition: {
    scrollX: number;
    scrollY: number;
  };
  selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  devicePixelRatio: number;
};