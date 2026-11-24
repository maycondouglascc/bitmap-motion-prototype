import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveStageProps {
  children: React.ReactNode;
  className?: string;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave?: () => void;
  /** Optional status caption rendered cleanly below the 16:9 canvas */
  statusLeft?: React.ReactNode;
  statusRight?: React.ReactNode;
  /** Full-bleed borderless mode for 1920x1080 MP4 export */
  frameless?: boolean;
}

/**
 * Fixed 960x540 logical 16:9 stage (matching Bitmap Studio's exact panel dimensions)
 * proportionally scaled via ResizeObserver + window resize so desktop, mobile, and
 * live viewport resizes keep top-left origin locked with zero drift or clipping.
 */
export const ResponsiveStage: React.FC<ResponsiveStageProps> = ({
  children,
  className = '',
  onPointerMove,
  onPointerLeave,
  statusLeft,
  statusRight,
  frameless = false,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(w / 960);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className={frameless ? 'h-full w-full' : 'flex flex-col gap-2'}>
      <div
        ref={outerRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className={
          frameless
            ? `relative aspect-video w-full overflow-hidden ${className}`
            : `relative aspect-video w-full overflow-hidden rounded-2xl border border-[#e6e8ef] ${className}`
        }
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 960,
            height: 540,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>

      {(statusLeft || statusRight) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-[#525866]">
          <span>{statusLeft}</span>
          {statusRight && <span className="tabular-nums">{statusRight}</span>}
        </div>
      )}
    </div>
  );
};
