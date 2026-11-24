import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff, Play, RotateCcw, User } from 'lucide-react';
import { GrokBotRig } from '../components/GrokBotRig';
import { ResponsiveStage } from '../components/ResponsiveStage';
import { EASE_EXPO_OUT, SPRING_LAYOUT } from '../motion/tokens';

type CallStage = 'incoming' | 'diving' | 'landed' | 'answered';

/**
 * Reproduces Bitmap Studio's left-to-right staggered character wipe
 * seen in Panel 3 F033-F039 ("Gonzalo Rascon" -> "Forwarding Call").
 */
const WipeSwapText: React.FC<{
  fromText: string;
  toText: string;
  swapped: boolean;
  className?: string;
  speed?: number;
}> = ({ fromText, toText, swapped, className = '', speed = 1 }) => {
  const maxLen = Math.max(fromText.length, toText.length);
  const chars = Array.from({ length: maxLen });

  return (
    <span className={`relative inline-flex ${className}`}>
      {chars.map((_, idx) => {
        const ch = swapped ? toText[idx] ?? '' : fromText[idx] ?? '';
        return (
          <motion.span
            key={`${swapped ? 'to' : 'from'}-${idx}`}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.08 / speed,
              delay: (idx * 0.015) / speed,
              ease: 'easeOut',
            }}
            className="inline-block whitespace-pre"
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        );
      })}
    </span>
  );
};

/** Live green & white equalizer waveform matching Panel 3 F033-F090 */
const AudioWaveform: React.FC = () => {
  const bars = [
    { h: [6, 16, 9, 20, 7], color: '#30d158', d: 0.65 },
    { h: [10, 24, 12, 18, 10], color: '#ffffff', d: 0.52 },
    { h: [14, 8, 26, 11, 14], color: '#30d158', d: 0.58 },
    { h: [8, 22, 10, 24, 8], color: '#ffffff', d: 0.48 },
    { h: [16, 10, 20, 8, 16], color: '#30d158', d: 0.62 },
    { h: [7, 18, 8, 15, 7], color: '#ffffff', d: 0.55 },
    { h: [11, 15, 22, 9, 11], color: '#30d158', d: 0.6 },
  ];

  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{ scaleX: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE_EXPO_OUT }}
      className="flex h-7 items-center gap-[3px] px-1"
    >
      {bars.map((b, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: b.color }}
          animate={{ height: b.h }}
          transition={{
            duration: b.d,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: i * 0.05,
          }}
        />
      ))}
    </motion.div>
  );
};

export const DynamicIslandScene: React.FC<{ speed?: number }> = ({ speed = 1 }) => {
  const [stage, setStage] = useState<CallStage>('incoming');
  const [headlineWords, setHeadlineWords] = useState<number>(0);
  const [slowMo, setSlowMo] = useState<boolean>(false);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const timersRef = useRef<number[]>([]);

  const effectiveSpeed = slowMo ? speed * 0.35 : speed;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms / effectiveSpeed);
      timersRef.current.push(id);
    },
    [effectiveSpeed],
  );

  const playChoreography = useCallback(() => {
    clearTimers();
    setStage('incoming');
    setHeadlineWords(0);

    // Bot arcs over the bezel straight to (0, 0) center of the Dynamic Island avatar slot
    schedule(460, () => setStage('diving'));

    // Exact arrival at (0, 0) after 380ms dive -> 1-frame polarity flip with zero teleport!
    schedule(840, () => {
      setStage('landed');
      setBlinkCount((c) => c + 1);
    });

    // Call answered: Accept shrinks, Decline slides right, Waveform grows, L->R character wipe
    schedule(1140, () => setStage('answered'));

    // Speech-cadence headline: "Answers" -> "your" -> "calls"
    schedule(1460, () => setHeadlineWords(1));
    schedule(1580, () => setHeadlineWords(2));
    schedule(1700, () => setHeadlineWords(3));
  }, [clearTimers, schedule]);

  useEffect(() => {
    playChoreography();
    return clearTimers;
  }, [playChoreography, clearTimers]);

  const phoneY = stage === 'incoming' ? 72 : 0;
  const botLanded = stage === 'landed' || stage === 'answered';

  const stageCaption =
    stage === 'incoming'
      ? 'Waiting on incoming call — counter-motion ready'
      : stage === 'diving'
        ? 'Parabolic dive straight to Dynamic Island avatar center (0, 0)'
        : stage === 'landed'
          ? 'Exact-frame black -> white polarity flip with zero spatial snap'
          : 'Accept shrinks -> Decline glides -> Waveform & L->R text wipe';

  return (
    <div className="flex flex-col gap-5">
      {/* 16:9 Proportional 960x540 Stage */}
      <ResponsiveStage
        className="bg-[#f7f8fd]"
        statusLeft={stageCaption}
        statusRight={slowMo ? '0.35x slow-mo' : '1.0x realtime'}
      >
        <div className="relative flex h-full w-full flex-col items-center justify-end pt-6">
          {/* Top speech-cadence headline ("Answers your calls") */}
          <div className="absolute top-12 flex h-12 items-center justify-center gap-3 text-[40px] font-semibold tracking-[-0.03em] text-[#08090c]">
            {headlineWords >= 1 && (
              <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.08 }}>
                Answers
              </motion.span>
            )}
            {headlineWords >= 2 && (
              <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.08 }}>
                your
              </motion.span>
            )}
            {headlineWords >= 3 && (
              <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.08 }}>
                calls
              </motion.span>
            )}
          </div>

          {/* iPhone Bezel Mockup sliding UP in counter-motion */}
          <motion.div
            animate={{ y: phoneY }}
            transition={{ duration: 0.44 / effectiveSpeed, ease: EASE_EXPO_OUT }}
            className="relative z-20 -mb-12 w-[480px] rounded-t-[54px] border-[10px] border-b-0 border-[#141618] bg-[#0c8a56] px-5 pt-4 pb-20 shadow-[0_24px_60px_rgba(8,14,12,0.18)] ring-2 ring-[#2a2d31]"
          >
            {/* Rich green wallpaper radial highlight */}
            <div
              className="pointer-events-none absolute inset-0 rounded-t-[44px]"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, #19ad6f 0%, #0b8c57 52%, #086e44 100%)',
              }}
            />

            {/* Dynamic Island Pill */}
            <motion.div
              layout
              transition={SPRING_LAYOUT}
              className="relative z-10 mx-auto flex h-[68px] w-full items-center justify-between rounded-[36px] bg-[#050607] px-3.5 text-white shadow-[0_12px_28px_rgba(0,0,0,0.34)]"
            >
              {/* Left Avatar Slot: Single persistent GrokBotRig anchored at exact (0,0) center of avatar! */}
              <div className="flex items-center gap-3">
                <div
                  className={`relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition-colors duration-75 ${
                    botLanded ? 'bg-[#0b9f64]/24' : 'bg-[#24272c]'
                  }`}
                >
                  {/* Placeholder silhouette fades out right as bot lands */}
                  <motion.div
                    animate={{ opacity: botLanded ? 0 : 1, scale: botLanded ? 0.6 : 1 }}
                    transition={{ duration: 0.06 }}
                  >
                    <User className="h-6 w-6 text-[#9ea4b0]" />
                  </motion.div>

                  {/*
                    Single Persistent Bot anchored directly at avatar (0,0)!
                    - incoming: hovers above-right of bezel at (x: 205, y: -158, scale: 2.35)
                    - diving: smooth parabolic arc directly to (x: 0, y: 0, scale: 1.0)
                    - landed/answered: sits dead-center (0, 0) and flips inverted={true} in 1 crisp frame!
                  */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                    initial={false}
                    animate={
                      stage === 'incoming'
                        ? { x: 205, y: -158, scale: 2.35, rotate: -4 }
                        : stage === 'diving'
                          ? {
                              x: [205, 92, 0],
                              y: [-158, -196, 0],
                              scale: [2.35, 1.72, 1.0],
                              rotate: [-4, -15, 0],
                            }
                          : { x: 0, y: 0, scale: [1.08, 1.0], rotate: 0 }
                    }
                    transition={
                      stage === 'diving'
                        ? {
                            duration: 0.38 / effectiveSpeed,
                            times: [0, 0.42, 1],
                            ease: ['easeOut', 'easeIn'],
                          }
                        : stage === 'incoming'
                          ? { duration: 0.3 / effectiveSpeed, ease: EASE_EXPO_OUT }
                          : { duration: 0.18 / effectiveSpeed, ease: EASE_EXPO_OUT }
                    }
                  >
                    <GrokBotRig
                      size={32}
                      inverted={botLanded}
                      lookX={stage === 'incoming' ? -0.34 : stage === 'diving' ? -0.45 : 0.22}
                      lookY={stage === 'incoming' ? 0.48 : stage === 'diving' ? 0.62 : 0.04}
                      scaleX={stage === 'diving' ? 0.92 : 1}
                      scaleY={stage === 'diving' ? 1.09 : 1}
                      blinkTrigger={blinkCount}
                    />
                  </motion.div>
                </div>

                {/* Caller / Forwarding Status with L->R staggered character wipe */}
                <div className="flex flex-col leading-tight">
                  <WipeSwapText
                    fromText="mobile"
                    toText="Grok Bot"
                    swapped={stage === 'answered'}
                    speed={effectiveSpeed}
                    className="text-[13px] font-medium text-white/55"
                  />
                  <WipeSwapText
                    fromText="Gonzalo Rascon"
                    toText="Forwarding Call"
                    swapped={stage === 'answered'}
                    speed={effectiveSpeed}
                    className="text-[15px] font-semibold tracking-[-0.01em] text-white"
                  />
                </div>
              </div>

              {/* Right Call Actions: Accept shrinks -> Decline slides right -> Waveform expands */}
              <div className="flex items-center gap-2.5">
                <AnimatePresence initial={false}>
                  {stage === 'answered' && <AudioWaveform key="waveform" />}
                </AnimatePresence>

                <motion.button
                  type="button"
                  layout
                  transition={SPRING_LAYOUT}
                  onClick={playChoreography}
                  aria-label="Replay call animation"
                  className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#ff3b30] text-white"
                >
                  <PhoneOff className="h-4 w-4" />
                </motion.button>

                <AnimatePresence initial={false}>
                  {stage !== 'answered' && (
                    <motion.button
                      key="accept-btn"
                      type="button"
                      layout
                      initial={{ scale: 1, width: 40, opacity: 1 }}
                      exit={{ scale: 0, width: 0, opacity: 0, marginLeft: -10 }}
                      transition={{ duration: 0.16 / effectiveSpeed, ease: EASE_EXPO_OUT }}
                      onClick={() => setStage('answered')}
                      aria-label="Answer call"
                      className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#30d158] text-white"
                    >
                      <Phone className="h-4 w-4 fill-current" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Clean iOS Home Screen Icon Row */}
            <div className="relative z-10 mt-5 grid grid-cols-4 gap-4 px-2">
              <div className="flex aspect-square items-center justify-center rounded-[18px] bg-gradient-to-b from-[#4ce26a] to-[#24c64b] shadow-sm">
                <div className="flex items-center gap-0.5">
                  <div className="h-6 w-7 rounded-md bg-white" />
                  <div className="h-0 w-0 border-y-[7px] border-r-[8px] border-y-transparent border-r-white" />
                </div>
              </div>

              <div className="flex aspect-square flex-col items-center justify-center rounded-[18px] bg-white shadow-sm">
                <span className="text-[12px] font-semibold leading-none text-[#ff3b30]">Tue</span>
                <span className="mt-0.5 text-[30px] font-light leading-none text-[#111315]">1</span>
              </div>

              <div className="flex aspect-square items-center justify-center rounded-[18px] bg-white shadow-sm">
                <svg viewBox="0 0 40 40" className="h-11 w-11">
                  {[
                    { rot: 0, fill: '#ff9500' },
                    { rot: 45, fill: '#ffcc00' },
                    { rot: 90, fill: '#34c759' },
                    { rot: 135, fill: '#30b0c7' },
                    { rot: 180, fill: '#007aff' },
                    { rot: 225, fill: '#5856d6' },
                    { rot: 270, fill: '#af52de' },
                    { rot: 315, fill: '#ff2d55' },
                  ].map((p) => (
                    <rect
                      key={p.rot}
                      x="17"
                      y="5"
                      width="6"
                      height="12"
                      rx="3"
                      fill={p.fill}
                      fillOpacity="0.82"
                      transform={`rotate(${p.rot} 20 20)`}
                    />
                  ))}
                </svg>
              </div>

              <div className="flex aspect-square items-center justify-center rounded-[18px] bg-gradient-to-b from-[#e4e6eb] to-[#b8bdc6] shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1d21] ring-2 ring-[#8a9099]">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#0f2438] via-[#1c4b6e] to-[#6cb6e8]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </ResponsiveStage>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6e8ef] pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={playChoreography}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0f1115] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:bg-[#232730] active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            Replay call dive
          </button>

          <button
            type="button"
            onClick={() => {
              clearTimers();
              setStage('incoming');
              setHeadlineWords(0);
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d9dde8] bg-white px-3.5 py-2 text-sm font-medium text-[#0f1115] transition-colors duration-150 hover:bg-[#f4f6fb]"
          >
            <RotateCcw className="h-4 w-4 text-[#525866]" />
            Reset incoming
          </button>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#0f1115] select-none">
          <input
            type="checkbox"
            checked={slowMo}
            onChange={(e) => setSlowMo(e.target.checked)}
            className="h-4 w-4 accent-[#0b9f64]"
          />
          Inspect at 0.35x slow motion
        </label>
      </div>
    </div>
  );
};
