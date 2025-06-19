import { DrawState } from '@/hooks/useDraw';
import Button from '@/components/UI/Button';
import { ZoomIn, ZoomOut, ZoomIn as ZoomReset } from 'lucide-react';

interface DrawToolbarProps {
  drawState: DrawState;
  onColorChange: (color: string) => void;
  onLineWidthChange: (width: number) => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function DrawToolbar({
  drawState,
  onColorChange,
  onLineWidthChange,
  onClear,
  onZoomIn,
  onZoomOut,
  onResetView,
}: DrawToolbarProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-background/80 backdrop-blur-sm rounded-b-lg shadow-sm z-10">
      <div className="flex items-center gap-3">
        {/* Color Picker */}
        <div className="flex items-center gap-1">
          <label htmlFor="draw-color" className="sr-only">
            Color
          </label>
          <input
            id="draw-color"
            type="color"
            value={drawState.color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-7 h-7 cursor-pointer rounded border border-border"
            aria-label="Select drawing color"
            title="Select color"
          />
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-1">
          <label htmlFor="line-width" className="sr-only">
            Line width
          </label>
          <input
            id="line-width"
            type="range"
            min="1"
            max="20"
            value={drawState.lineWidth}
            onChange={(e) => onLineWidthChange(parseInt(e.target.value))}
            className="w-16 h-2 bg-foreground/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
            aria-label="Adjust line width"
            title="Adjust line width"
          />
          <span className="text-xs w-4 text-center text-foreground/70">
            {drawState.lineWidth}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center bg-background/50 rounded-md shadow-sm border border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-7 w-7 p-0 hover:bg-foreground/5"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          
          <span className="text-xs w-12 text-center text-foreground/80">
            {Math.round(drawState.zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="h-7 w-7 p-0 hover:bg-foreground/5"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetView}
            className="h-7 w-7 p-0 hover:bg-foreground/5"
            aria-label="Reset view"
            title="Reset zoom and position"
          >
            <ZoomReset className="h-3.5 w-3.5" />
          </Button>
        </div>
          
        <Button
          onClick={onClear}
          variant="primary"
          size="sm"
          className="h-7"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
