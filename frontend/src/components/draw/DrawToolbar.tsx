import Button from '@/components/UI/Button';
import { Fullscreen, ZoomIn, ZoomOut } from 'lucide-react';

interface DrawToolbarProps {
  currentColor: string;
  currentWidth: number;
  currentZoom: number;
  changeColor: (color: string) => void;
  changeWidth: (width: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
}

export function DrawToolbar({
  currentColor,
  currentWidth,
  currentZoom,
  changeColor,
  changeWidth,
  zoomIn,
  zoomOut,
  zoomReset,
}: DrawToolbarProps) {
  return <div className="flex items-center justify-between p-2 flex-wrap">
    <div className="flex items-center gap-2">
      <label htmlFor="color" className="text-xs">
        Color:
      </label>
      <input
        id="color"
        type="color"
        value={currentColor}
        onChange={(e) => changeColor(e.target.value)}
        className="w-6"
      />

      <label htmlFor="line-width" className="text-xs">
        Width:
      </label>
      <span className="text-xs w-2">
        {currentWidth}
      </span>
      <input
        id="line-width"
        type="range"
        min="1"
        max="20"
        value={currentWidth}
        onChange={(e) => changeWidth(parseInt(e.target.value))}
        className="w-12"
      />

    </div>

    <div className="flex items-center gap-1">
      <div className="flex items-center bg-surface rounded-md shadow-sm border border-primary/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-8 text-center">
          {(currentZoom * 100).toFixed()}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomReset}
        >
          <Fullscreen className="h-4 w-4" />
        </Button>
      </div>


    </div>
  </div>;
}
