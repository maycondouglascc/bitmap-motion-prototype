import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Pause, Phone, PhoneOff, Play, RotateCcw, Sparkles, User } from 'lucide-react';
import { GrokBotRig } from '../components/GrokBotRig';
import { ResponsiveStage } from '../components/ResponsiveStage';
import { EASE_EXPO_OUT, SPRING_LAYOUT, SPRING_PUNCH } from '../motion/tokens';

const BEATS = [
  { id: 0, label: 'Character punch-in', durationMs: 2450 },
  { id: 1, label: 'Inline pill reflow', durationMs: 3150 },
  { id: 2, label: 'Dynamic Island dive', durationMs: 2800 },
  { id: 3, label: 'Dark emerald outro', durationMs: 2900 },
] as const;

const TOTAL_DURATION = BEATS.reduce((acc, b) => acc + b.durationMs, 0);

const MiniWaveform: React.FC = () => (
  <div className="flex h-6 items-center gap-[3px] px-1">
    {[14, 22, 10, 20, 12, 18, 9].map((maxH, i) => (
      <motion.span
        key={i}
        className="w-[3px] rounded-full"
        style={{ backgroundColor: i % 2 === 0 ? '#30d158' : '#ffffff' }}
        animate={{ height: [6, maxH, 8, Math.max(8, maxH - 6)] }}
        transition={{ duration: 0.55, repeat: Infinity, repeatType: 'mirror', delay: i * 0.05 }}
      />
    ))}
  </div>
);

export const FullSequenceScene: React.FC<{ exportMode?: boolean }> = ({ exportMode = false }) => {
  const [beat, setBeat] = useState<number>(0);
  const [subStep, setSubStep] = useState<number>(0);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(!exportMode);
  const [speed, setSpeed] = useState<number>(1);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [runKey, setRunKey] = useState<number>(0);

  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startFromBeat = useCallback(
    (startBeatIdx: number, playSpeed: number) => {
      clearAll();
      setPlaying(true);
      setBeat(startBeatIdx);
      setSubStep(0);

      const beatStartOffsets = [0, 2450, 5600, 8400];
      const baseOffset = beatStartOffsets[startBeatIdx];
      const startWall = performance.now();

      const tick = (now: number) => {
        const dt = (now - startWall) * playSpeed;
        const cur = Math.min(TOTAL_DURATION, baseOffset + dt);
        setElapsedMs(cur);
        if (cur < TOTAL_DURATION) {
          rafRef.current = window.requestAnimationFrame(tick);
        }
      };
      rafRef.current = window.requestAnimationFrame(tick);

      const at = (globalMs: number, fn: () => void) => {
        if (globalMs < baseOffset) return;
        const id = window.setTimeout(fn, (globalMs - baseOffset) / playSpeed);
        timersRef.current.push(id);
      };

      // BEAT 0: Continuous J-curve spline + headset anticipation & 1.75x punch-in (0 .. 2450ms)
      at(0, () => {
        setBeat(0);
        setSubStep(0); // continuous J-curve spline plays immediately
      });
      at(980, () => {
        setSubStep(1); // headset glides in (~64px above bot) + blink
        setBlinkCount((c) => c + 1);
      });
      at(1340, () => setSubStep(2)); // curiosity look-up + wind-up
      at(1680, () => setSubStep(3)); // 4-frame slam + 1.75x camera punch-in!

      // BEAT 1: Persistent bot "Give your [bot] a phone" -> "Its own [pill] number" (2450 .. 5600ms)
      at(2450, () => {
        setBeat(1);
        setSubStep(0); // Give your [bot] a phone
      });
      at(3300, () => setSubStep(1)); // Persistent bot glides smoothly down + "Its own number"
      at(3850, () => {
        setBlinkCount((c) => c + 1);
        setSubStep(2); // Green pill expands + 10 dots type
      });

      // BEAT 2: Exact avatar-anchored Dynamic Island Dive & Call Answer (5600 .. 8400ms)
      at(5600, () => {
        setBeat(2);
        setSubStep(0); // Incoming call + bot hovering above right
      });
      at(6020, () => setSubStep(1)); // Parabolic dive to exact avatar (0, 0) + iPhone counter-slide
      at(6400, () => {
        setSubStep(2); // Exact arrival -> 1-frame white polarity flip with zero snap
        setBlinkCount((c) => c + 1);
      });
      at(6760, () => setSubStep(3)); // Answered: Accept shrinks, Waveform grows, text swaps, "Answers your calls"

      // BEAT 3: Hard cut to Dark Emerald Allo + Connect Allo to [bot] Grok Bot (8400 .. 11300ms)
      at(8400, () => {
        setBeat(3);
        setSubStep(0); // Yellow Allo icon center
      });
      at(8780, () => setSubStep(1)); // Icon slides left + "allo" kerning compression
      at(9550, () => setSubStep(2)); // "Connect Allo to Grok Bot"
      at(10020, () => {
        setSubStep(3); // Inline white bot expands between "to" and "Grok Bot"
        setBlinkCount((c) => c + 1);
      });

      at(TOTAL_DURATION, () => {
        if (exportMode) {
          (window as unknown as { __EXPORT_DONE__?: boolean }).__EXPORT_DONE__ = true;
          clearAll();
          setPlaying(false);
        } else {
          startFromBeat(0, playSpeed);
        }
      });
    },
    [clearAll, exportMode],
  );

  useEffect(() => {
    if (!exportMode) return;
    const win = window as unknown as {
      __EXPORT_START__?: (exportSpeed?: number) => void;
      __EXPORT_READY__?: boolean;
      __EXPORT_DONE__?: boolean;
    };
    win.__EXPORT_DONE__ = false;
    win.__EXPORT_START__ = (exportSpeed = 1) => {
      setSpeed(exportSpeed);
      setRunKey((k) => k + 1);
      startFromBeat(0, exportSpeed);
    };
    win.__EXPORT_READY__ = true;
    return clearAll;
  }, [exportMode, startFromBeat, clearAll]);

  useEffect(() => {
    if (exportMode) return;
    startFromBeat(0, speed);
    return clearAll;
  }, [exportMode, startFromBeat, speed, clearAll]);

  const togglePlay = () => {
    if (playing) {
      clearAll();
      setPlaying(false);
    } else {
      startFromBeat(beat, speed);
    }
  };

  const botDroppedB1 = subStep >= 1;
  const botLandedB2 = subStep >= 2;

  return (
    <div className={exportMode ? 'h-full w-full' : 'flex flex-col gap-5'}>
      {/* 16:9 Proportional 960x540 Master Stage */}
      <ResponsiveStage
        frameless={exportMode}
        className={beat === 3 ? 'emerald-bitmap-bg text-white' : 'bg-[#f7f8fd] text-[#08090c]'}
      >
        {/* BEAT 0: Continuous J-Curve Spline & Headset Punch-In */}
        {beat === 0 && (
          <motion.div
            className="flex h-full w-full items-center justify-center"
            animate={{ scale: subStep >= 3 ? 1.65 : 1 }}
            transition={SPRING_PUNCH}
          >
            <motion.div
              key={`beat0-bot-${runKey}`}
              initial={{ x: -168, y: -112, scaleX: 0.89, scaleY: 1.125, rotate: 30 }}
              animate={
                !playing && exportMode
                  ? { x: -168, y: -112, scaleX: 0.89, scaleY: 1.125, rotate: 30 }
                  : subStep === 0
                  ? {
                      x: [-168, -118, -58, -10, 0, 0, 0, 0],
                      y: [-112, 18, 82, -26, -54, 14, -6, 0],
                      scaleX: [0.89, 0.96, 1.162, 0.943, 1, 0.94, 1.02, 1],
                      scaleY: [1.125, 1.04, 0.861, 1.06, 1, 1.065, 0.98, 1],
                      rotate: [30, 12, -8, 4, 0, 0, 0, 0],
                    }
                  : subStep === 1
                    ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
                    : subStep === 2
                      ? { x: -8, y: -14, scaleX: 1, scaleY: 1, rotate: -3 }
                      : {
                          x: [10, 0],
                          y: [14, -4, 0],
                          scaleX: [1.08, 0.97, 1],
                          scaleY: [0.926, 1.03, 1],
                          rotate: [5, -1.5, 0],
                        }
              }
              transition={
                subStep === 0
                  ? { duration: 0.96 / speed, times: [0, 0.12, 0.24, 0.38, 0.54, 0.72, 0.86, 1], ease: 'easeInOut' }
                  : { duration: 0.34 / speed, ease: EASE_EXPO_OUT }
              }
            >
              <GrokBotRig
                size={98}
                lookX={subStep === 0 ? 0.25 : subStep === 2 ? 0.06 : 0.2}
                lookY={subStep === 2 ? -0.76 : -0.06}
                showHeadset={subStep >= 1}
                headsetAnim={
                  subStep === 1
                    ? { x: 8, y: -64, scale: 0.92, rotate: -10, opacity: 1 }
                    : subStep === 2
                      ? { x: -10, y: -78, scale: 0.98, rotate: -18, opacity: 1 }
                      : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
                }
                headsetTransition={
                  subStep >= 3
                    ? { duration: 0.13 / speed, ease: [0.32, 0, 0.67, 0] }
                    : { duration: 0.32 / speed, ease: EASE_EXPO_OUT }
                }
                blinkTrigger={blinkCount}
              />
            </motion.div>
          </motion.div>
        )}

        {/* BEAT 1: Persistent Bot + Inline Pill Expansion (Zero blank gap, zero earcup overlap) */}
        {beat === 1 && (
          <LayoutGroup>
            <div className="relative flex h-full w-full items-center justify-center px-12">
              <motion.div
                animate={{ y: botDroppedB1 ? -58 : 0 }}
                transition={SPRING_LAYOUT}
                className="relative flex h-[76px] w-full items-center justify-center"
              >
                {subStep === 0 ? (
                  <div className="flex items-center justify-center text-[40px] font-semibold tracking-[-0.03em]">
                    <div className="flex w-[220px] justify-end pr-3">
                      <motion.span initial={{ y: 5 }} animate={{ y: 0 }} transition={{ duration: 0.08 }}>
                        Give your
                      </motion.span>
                    </div>
                    <div className="w-[132px] shrink-0" aria-hidden="true" />
                    <div className="flex w-[220px] justify-start pl-3">
                      <motion.span initial={{ y: 5 }} animate={{ y: 0 }} transition={{ duration: 0.08, delay: 0.14 / speed }}>
                        a phone
                      </motion.span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-[40px] font-semibold tracking-[-0.03em]">
                    <span className="shrink-0 whitespace-nowrap">Its own</span>
                    <motion.div
                      initial={false}
                      animate={{
                        width: subStep >= 2 ? 196 : 12,
                        marginLeft: subStep >= 2 ? 14 : 0,
                        marginRight: subStep >= 2 ? 14 : 0,
                      }}
                      transition={SPRING_LAYOUT}
                      className="flex h-[50px] shrink-0 items-center justify-center overflow-hidden"
                    >
                      <AnimatePresence initial={false}>
                        {subStep >= 2 && (
                          <motion.div
                            key="seq-pill"
                            initial={{ scale: 0.35, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.35, opacity: 0 }}
                            transition={SPRING_LAYOUT}
                            className="flex h-[48px] w-[192px] items-center justify-center gap-2.5 rounded-full bg-[#0b9f64] px-4 text-white shadow-[0_6px_18px_rgba(11,159,100,0.22)]"
                          >
                            <span className="relative inline-flex shrink-0">
                              <Phone className="h-4 w-4 fill-white text-white" />
                              <Sparkles className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 text-[#f9e125]" />
                            </span>
                            <span className="flex items-center gap-[5px]">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <motion.span
                                  key={i}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: (0.08 + i * 0.034) / speed, duration: 0.07 }}
                                  className="h-[6px] w-[6px] rounded-full bg-white"
                                />
                              ))}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <span className="shrink-0 whitespace-nowrap">number</span>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="pointer-events-none absolute"
                animate={{ y: botDroppedB1 ? 82 : 0, scale: botDroppedB1 ? 1.04 : 0.94 }}
                transition={SPRING_LAYOUT}
              >
                <GrokBotRig
                  size={94}
                  lookX={botDroppedB1 ? 0 : 0.25}
                  lookY={subStep >= 2 ? -0.45 : -0.1}
                  blinkTrigger={blinkCount}
                />
              </motion.div>
            </div>
          </LayoutGroup>
        )}

        {/* BEAT 2: Exact Avatar-Anchored Dynamic Island Dive & Call Answer */}
        {beat === 2 && (
          <div className="relative flex h-full w-full flex-col items-center justify-end pt-6">
            <div className="absolute top-12 flex h-12 items-center gap-3 text-[40px] font-semibold tracking-[-0.03em]">
              {subStep >= 3 && (
                <>
                  <motion.span initial={{ y: 5 }} animate={{ y: 0 }} transition={{ duration: 0.08 }}>
                    Answers
                  </motion.span>
                  <motion.span initial={{ y: 5 }} animate={{ y: 0 }} transition={{ duration: 0.08, delay: 0.1 / speed }}>
                    your
                  </motion.span>
                  <motion.span initial={{ y: 5 }} animate={{ y: 0 }} transition={{ duration: 0.08, delay: 0.2 / speed }}>
                    calls
                  </motion.span>
                </>
              )}
            </div>

            <motion.div
              animate={{ y: subStep === 0 ? 72 : 0 }}
              transition={{ duration: 0.44 / speed, ease: EASE_EXPO_OUT }}
              className="relative z-20 -mb-12 w-[480px] rounded-t-[54px] border-[10px] border-b-0 border-[#141618] bg-[#0c8a56] px-5 pt-4 pb-20 shadow-[0_24px_60px_rgba(8,14,12,0.18)] ring-2 ring-[#2a2d31]"
            >
              <div className="mx-auto flex h-[68px] w-full items-center justify-between rounded-[36px] bg-[#050607] px-3.5 text-white">
                <div className="flex items-center gap-3">
                  <div
                    className={`relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition-colors duration-75 ${
                      botLandedB2 ? 'bg-[#0b9f64]/24' : 'bg-[#24272c]'
                    }`}
                  >
                    <motion.div
                      animate={{ opacity: botLandedB2 ? 0 : 1, scale: botLandedB2 ? 0.6 : 1 }}
                      transition={{ duration: 0.06 }}
                    >
                      <User className="h-6 w-6 text-[#9ea4b0]" />
                    </motion.div>

                    <motion.div
                      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                      initial={false}
                      animate={
                        subStep === 0
                          ? { x: 205, y: -158, scale: 2.35, rotate: -4 }
                          : subStep === 1
                            ? {
                                x: [205, 92, 0],
                                y: [-158, -196, 0],
                                scale: [2.35, 1.72, 1.0],
                                rotate: [-4, -15, 0],
                              }
                            : { x: 0, y: 0, scale: [1.08, 1.0], rotate: 0 }
                      }
                      transition={
                        subStep === 1
                          ? { duration: 0.38 / speed, times: [0, 0.42, 1], ease: ['easeOut', 'easeIn'] }
                          : { duration: 0.22 / speed, ease: EASE_EXPO_OUT }
                      }
                    >
                      <GrokBotRig
                        size={32}
                        inverted={botLandedB2}
                        lookX={subStep < 2 ? -0.38 : 0.2}
                        lookY={subStep < 2 ? 0.54 : 0}
                        blinkTrigger={blinkCount}
                      />
                    </motion.div>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-medium text-white/55">
                      {subStep >= 3 ? 'Grok Bot' : 'mobile'}
                    </span>
                    <span className="text-[15px] font-semibold text-white">
                      {subStep >= 3 ? 'Forwarding Call' : 'Gonzalo Rascon'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {subStep >= 3 && <MiniWaveform />}
                  <motion.div
                    layout
                    transition={SPRING_LAYOUT}
                    className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#ff3b30] text-white"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </motion.div>
                  <AnimatePresence initial={false}>
                    {subStep < 3 && (
                      <motion.div
                        layout
                        exit={{ scale: 0, width: 0, opacity: 0, marginLeft: -10 }}
                        transition={{ duration: 0.16 / speed, ease: EASE_EXPO_OUT }}
                        className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full bg-[#30d158] text-white"
                      >
                        <Phone className="h-4 w-4 fill-current" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-4 px-2">
                <div className="flex aspect-square items-center justify-center rounded-[18px] bg-gradient-to-b from-[#4ce26a] to-[#24c64b]">
                  <div className="h-5 w-7 rounded-sm bg-white" />
                </div>
                <div className="flex aspect-square flex-col items-center justify-center rounded-[18px] bg-white">
                  <span className="text-[12px] font-semibold text-[#ff3b30]">Tue</span>
                  <span className="text-[28px] font-light leading-none text-[#111315]">1</span>
                </div>
                <div className="flex aspect-square items-center justify-center rounded-[18px] bg-white">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#ff9500] via-[#34c759] to-[#007aff] opacity-85" />
                </div>
                <div className="flex aspect-square items-center justify-center rounded-[18px] bg-gradient-to-b from-[#e4e6eb] to-[#b8bdc6]">
                  <div className="h-10 w-10 rounded-full bg-[#1a1d21] ring-2 ring-[#8a9099]" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* BEAT 3: Hard cut to Dark Emerald Allo + Connect Allo to [bot] Grok Bot */}
        {beat === 3 && (
          <LayoutGroup>
            <div className="flex h-full w-full items-center justify-center px-8">
              {subStep < 2 ? (
                <div className="flex items-center justify-center">
                  <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[20px] bg-[#f9e125] shadow-[0_12px_36px_rgba(249,225,37,0.22)]">
                    <span className="relative inline-flex items-center justify-center text-[#072119]">
                      <Phone className="h-8 w-8 fill-current" />
                      <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-[#072119]" />
                    </span>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{
                      width: subStep >= 1 ? 116 : 0,
                      marginLeft: subStep >= 1 ? 16 : 0,
                    }}
                    transition={SPRING_LAYOUT}
                    className="flex items-center overflow-hidden"
                  >
                    {subStep >= 1 && (
                      <motion.span
                        initial={{ opacity: 0, letterSpacing: '0.24em', x: -10 }}
                        animate={{ opacity: 1, letterSpacing: '-0.03em', x: 0 }}
                        transition={{ duration: 0.42 / speed, ease: EASE_EXPO_OUT }}
                        className="whitespace-nowrap text-[54px] font-bold text-white"
                      >
                        allo
                      </motion.span>
                    )}
                  </motion.div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-[40px] font-semibold tracking-[-0.03em] text-white">
                  <span className="shrink-0 whitespace-nowrap">Connect Allo to</span>
                  <motion.div
                    initial={false}
                    animate={{
                      width: subStep >= 3 ? 98 : 12,
                      marginLeft: subStep >= 3 ? 12 : 0,
                      marginRight: subStep >= 3 ? 12 : 0,
                    }}
                    transition={SPRING_LAYOUT}
                    className="flex h-[84px] shrink-0 items-center justify-center overflow-visible"
                  >
                    <AnimatePresence initial={false}>
                      {subStep >= 3 && (
                        <motion.div
                          key="outro-bot"
                          initial={{ scale: 0.1, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.1, opacity: 0 }}
                          transition={SPRING_LAYOUT}
                          className="flex items-center justify-center"
                        >
                          <GrokBotRig size={72} inverted lookX={0.2} lookY={-0.06} blinkTrigger={blinkCount} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span className="shrink-0 whitespace-nowrap">Grok Bot</span>
                </div>
              )}
            </div>
          </LayoutGroup>
        )}

        {/* Thin top progress hairline (hidden during clean MP4 export) */}
        {!exportMode && (
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[3px] bg-black/5">
            <div
              className="h-full bg-[#0b9f64]"
              style={{ width: `${(elapsedMs / TOTAL_DURATION) * 100}%` }}
            />
          </div>
        )}
      </ResponsiveStage>

      {/* Sequence Transport & Beat Jump Bar */}
      {!exportMode && (
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6e8ef] pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0f1115] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:bg-[#232730] active:scale-[0.98]"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            {playing ? 'Pause' : 'Play'}
          </button>

          <button
            type="button"
            onClick={() => startFromBeat(0, speed)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d9dde8] bg-white px-3.5 py-2 text-sm font-medium text-[#0f1115] transition-colors duration-150 hover:bg-[#f4f6fb]"
          >
            <RotateCcw className="h-4 w-4 text-[#525866]" />
            Restart
          </button>

          <div className="inline-flex rounded-lg border border-[#d9dde8] bg-[#f4f6fb] p-0.5 text-sm">
            {[0.5, 1].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`cursor-pointer rounded-md px-3 py-1.5 font-medium tabular-nums transition-colors duration-150 ${
                  speed === s ? 'bg-white text-[#0f1115] shadow-xs' : 'text-[#525866]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#e6e8ef] bg-[#f7f8fd] p-1 text-sm">
          {BEATS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => startFromBeat(b.id, speed)}
              className={`cursor-pointer rounded-md px-3 py-1 font-medium transition-colors duration-150 ${
                beat === b.id
                  ? 'bg-white text-[#0f1115] shadow-xs'
                  : 'text-[#525866] hover:text-[#0f1115]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
