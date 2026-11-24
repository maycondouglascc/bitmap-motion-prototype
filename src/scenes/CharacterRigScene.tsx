import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { Eye, Headphones, Play, RefreshCw, Sparkles } from 'lucide-react';
import { GrokBotRig } from '../components/GrokBotRig';
import { ResponsiveStage } from '../components/ResponsiveStage';
import { EASE_EXPO_OUT, SPRING_PUNCH } from '../motion/tokens';

export const CharacterRigScene: React.FC<{ speed?: number }> = ({ speed = 1 }) => {
  const [botScope, animateBot] = useAnimate();
  const timersRef = useRef<number[]>([]);
  const runIdRef = useRef<number>(0);

  const [lookX, setLookX] = useState(0);
  const [lookY, setLookY] = useState(0);
  const [cameraScale, setCameraScale] = useState(1.48);
  const [showHeadset, setShowHeadset] = useState(true);
  const [headsetAnim, setHeadsetAnim] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
  });
  const [headsetTransition, setHeadsetTransition] = useState<Record<string, unknown>>({
    type: 'spring',
    stiffness: 420,
    damping: 25,
  });
  const [phaseLabel, setPhaseLabel] = useState(
    'Interactive gaze tracking — move cursor across stage',
  );
  const [liveRatio, setLiveRatio] = useState('1.00');
  const [isPlayingChoreo, setIsPlayingChoreo] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [xray, setXray] = useState(false);
  const [cursorMode, setCursorMode] = useState(true);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (ms: number, runId: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (runIdRef.current !== runId) return;
        fn();
      }, ms / speed);
      timersRef.current.push(id);
    },
    [speed],
  );

  /**
   * Full Panel 1 choreography driven by continuous Framer Motion multi-keyframe splines
   * with mathematically true volume-preserving squash & stretch:
   *  - Dive w/h 0.79  -> scaleX = sqrt(0.79) = 0.889, scaleY = 1.125
   *  - Squash w/h 1.35 -> scaleX = sqrt(1.35) = 1.162, scaleY = 0.861
   *  - Rebound w/h 0.89 -> scaleX = sqrt(0.89) = 0.943, scaleY = 1.060
   */
  const playFullEntrance = useCallback(() => {
    clearTimers();
    const runId = ++runIdRef.current;
    setIsPlayingChoreo(true);
    setCursorMode(false);
    setCameraScale(1);
    setShowHeadset(false);
    setHeadsetAnim({ x: 76, y: -74, scale: 0.14, rotate: -26, opacity: 0 });
    setLookX(-0.68);
    setLookY(0.42);
    setPhaseLabel('F01–F05 · Continuous J-curve dive smear & 1.35x squash');
    setLiveRatio('0.79');

    if (botScope.current) {
      // Single continuous 60fps spline from F01 entry through F40 damped sinusoidal float
      animateBot(
        botScope.current,
        {
          x: [-168, -118, -58, -10, 0, 0, 0, 0, 0, 0],
          y: [-112, 18, 82, -26, -56, -56, 16, -7, 4, 0],
          scaleX: [0.89, 0.96, 1.162, 0.943, 1.0, 1.0, 0.938, 1.03, 0.99, 1.0],
          scaleY: [1.125, 1.04, 0.861, 1.06, 1.0, 1.0, 1.066, 0.97, 1.01, 1.0],
          rotate: [30, 12, -8, 4, 0, 0, 0, 0, 0, 0],
        },
        {
          duration: 1.25 / speed,
          times: [0, 0.09, 0.18, 0.3, 0.42, 0.56, 0.68, 0.8, 0.91, 1],
          ease: 'easeInOut',
        },
      );
    }

    schedule(190, runId, () => {
      setLookX(0.42);
      setLookY(0.32);
      setLiveRatio('1.35');
    });

    schedule(340, runId, () => {
      setLookX(0.76);
      setLookY(-0.42);
      setPhaseLabel('F07–F18 · Rebound spherical eye wrap & apex hangtime');
      setLiveRatio('0.89');
    });

    schedule(530, runId, () => {
      setLookX(0.18);
      setLookY(-0.82);
      setLiveRatio('1.00');
    });

    schedule(740, runId, () => {
      setLookX(0);
      setLookY(0.22);
      setPhaseLabel('F20–F40 · Snappy drop & underdamped sinusoidal float');
      setLiveRatio('0.88');
    });

    schedule(920, runId, () => {
      setLookX(0);
      setLookY(0);
      setLiveRatio('1.00');
    });

    // F41: Headset smoothly arcs in from top-right & stays well inside frame (~66px above bot)
    schedule(1120, runId, () => {
      setShowHeadset(true);
      setHeadsetTransition({ duration: 0.38 / speed, ease: EASE_EXPO_OUT });
      setHeadsetAnim({ x: 8, y: -64, scale: 0.92, rotate: -10, opacity: 1 });
      setPhaseLabel('F41–F47 · Headset enters + 5-frame natural blink');
    });

    // F43: 5-frame natural blink
    schedule(1260, runId, () => setBlinkCount((c) => c + 1));

    // F48–F58: Bot glances UP in curiosity while headset lifts slightly for anticipation wind-up
    schedule(1460, runId, () => {
      setLookX(0.06);
      setLookY(-0.76);
      setHeadsetTransition({ duration: 0.28 / speed, ease: 'easeInOut' });
      setHeadsetAnim({ x: -10, y: -78, scale: 0.98, rotate: -18, opacity: 1 });
      setPhaseLabel('F55–F58 · Anticipation wind-up before slam');
      if (botScope.current) {
        animateBot(
          botScope.current,
          { x: -8, y: -14, rotate: -3 },
          { duration: 0.28 / speed, ease: 'easeOut' },
        );
      }
    });

    // F59–F62: 4-frame slam + 1.75x camera punch-in + volume-preserving contact squash!
    schedule(1780, runId, () => {
      setLookX(0.18);
      setLookY(-0.08);
      setCameraScale(1.75);
      setHeadsetTransition({ duration: 0.13 / speed, ease: [0.32, 0, 0.67, 0] });
      setHeadsetAnim({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 });
      setPhaseLabel('F61–F62 · 4-frame impact slam + 1.75x camera punch-in');
      setLiveRatio('1.16');
      if (botScope.current) {
        animateBot(
          botScope.current,
          {
            x: [10, 0],
            y: [14, -4, 0],
            scaleX: [1.08, 0.97, 1],
            scaleY: [0.926, 1.03, 1],
            rotate: [5, -1.5, 0],
          },
          { duration: 0.36 / speed, ease: EASE_EXPO_OUT },
        );
      }
    });

    // F68: Settle smoothly to interactive gaze mode
    schedule(2140, runId, () => {
      setCameraScale(1.48);
      setLookX(0.14);
      setLookY(-0.06);
      setLiveRatio('1.00');
      setPhaseLabel('Ready — move cursor to test 2.5D spherical gaze & headset parallax');
      setIsPlayingChoreo(false);
      setCursorMode(true);
    });
  }, [animateBot, botScope, clearTimers, schedule, speed]);

  // Isolated Headset Punch-In trigger
  const triggerHeadsetSnap = useCallback(() => {
    clearTimers();
    const runId = ++runIdRef.current;
    setIsPlayingChoreo(true);
    setCursorMode(false);
    setCameraScale(1.0);
    setShowHeadset(true);
    setLookX(0.05);
    setLookY(-0.76);
    setHeadsetTransition({ duration: 0.24 / speed, ease: 'easeOut' });
    setHeadsetAnim({ x: -10, y: -76, scale: 0.96, rotate: -18, opacity: 1 });
    setPhaseLabel('F55–F58 · Anticipation wind-up...');

    if (botScope.current) {
      animateBot(
        botScope.current,
        { x: -8, y: -12, scaleX: 1, scaleY: 1, rotate: -3 },
        { duration: 0.24 / speed, ease: 'easeOut' },
      );
    }

    schedule(240, runId, () => setBlinkCount((c) => c + 1));

    schedule(440, runId, () => {
      setLookX(0.18);
      setLookY(-0.06);
      setCameraScale(1.75);
      setHeadsetTransition({ duration: 0.13 / speed, ease: [0.32, 0, 0.67, 0] });
      setHeadsetAnim({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 });
      setPhaseLabel('F61–F62 · 1-frame impact 1.75x camera punch-in');
      setLiveRatio('1.16');
      if (botScope.current) {
        animateBot(
          botScope.current,
          {
            x: [10, 0],
            y: [14, -4, 0],
            scaleX: [1.08, 0.97, 1],
            scaleY: [0.926, 1.03, 1],
            rotate: [5, -1.5, 0],
          },
          { duration: 0.36 / speed, ease: EASE_EXPO_OUT },
        );
      }
    });

    schedule(800, runId, () => {
      setCameraScale(1.48);
      setLiveRatio('1.00');
      setPhaseLabel('Interactive gaze tracking — move cursor across stage');
      setIsPlayingChoreo(false);
      setCursorMode(true);
    });
  }, [animateBot, botScope, clearTimers, schedule, speed]);

  useEffect(() => {
    playFullEntrance();
    return clearTimers;
  }, [playFullEntrance, clearTimers]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cursorMode || isPlayingChoreo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2.2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2.2;
    const clampedX = Math.max(-1, Math.min(1, nx));
    const clampedY = Math.max(-1, Math.min(1, ny));
    setLookX(clampedX);
    setLookY(clampedY);
    if (botScope.current) {
      animateBot(
        botScope.current,
        { rotate: clampedX * 5.5 },
        { type: 'spring', stiffness: 320, damping: 24 },
      );
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 16:9 Proportional 960x540 Stage */}
      <ResponsiveStage
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          if (cursorMode && !isPlayingChoreo) {
            setLookX(0);
            setLookY(0);
            if (botScope.current) {
              animateBot(botScope.current, { rotate: 0 }, { type: 'spring', stiffness: 260, damping: 22 });
            }
          }
        }}
        className={`transition-colors duration-200 ${
          inverted ? 'emerald-bitmap-bg' : 'bg-[#f7f8fd]'
        }`}
        statusLeft={phaseLabel}
        statusRight={`scale ${cameraScale.toFixed(2)}x · w/h ${liveRatio}`}
      >
        {/* Camera container (handles the 1.75x impact punch-in) */}
        <motion.div
          className="flex h-full w-full items-center justify-center"
          animate={{ scale: cameraScale }}
          transition={SPRING_PUNCH}
        >
          <div ref={botScope} style={{ willChange: 'transform' }}>
            <GrokBotRig
              size={104}
              lookX={lookX}
              lookY={lookY}
              showHeadset={showHeadset}
              headsetAnim={headsetAnim}
              headsetTransition={headsetTransition}
              inverted={inverted}
              blinkTrigger={blinkCount}
              xray={xray}
            />
          </div>
        </motion.div>
      </ResponsiveStage>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6e8ef] pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={playFullEntrance}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0f1115] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:bg-[#232730] active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            Replay entrance
          </button>
          <button
            type="button"
            onClick={triggerHeadsetSnap}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d9dde8] bg-white px-3.5 py-2 text-sm font-medium text-[#0f1115] transition-colors duration-150 hover:bg-[#f4f6fb]"
          >
            <Headphones className="h-4 w-4 text-[#0b9f64]" />
            Headset punch-in
          </button>
          <button
            type="button"
            onClick={() => setBlinkCount((c) => c + 1)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d9dde8] bg-white px-3.5 py-2 text-sm font-medium text-[#0f1115] transition-colors duration-150 hover:bg-[#f4f6fb]"
          >
            <Sparkles className="h-4 w-4 text-[#0b9f64]" />
            5-frame blink
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-[#0f1115]">
          <label className="inline-flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={xray}
              onChange={(e) => setXray(e.target.checked)}
              className="h-4 w-4 accent-[#0b9f64]"
            />
            <Eye className="h-4 w-4 text-[#525866]" />
            Alpha matte X-ray
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={inverted}
              onChange={(e) => setInverted(e.target.checked)}
              className="h-4 w-4 accent-[#0b9f64]"
            />
            <RefreshCw className="h-4 w-4 text-[#525866]" />
            Invert polarity
          </label>
        </div>
      </div>
    </div>
  );
};
