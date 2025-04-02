declare module 'react-resizable' {
  export interface ResizableDelta {
    width: number;
    height: number;
  }
  export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
} 