import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Phone, Play, Sparkles } from 'lucide-react';
import { GrokBotRig } from '../components/GrokBotRig';
import { ResponsiveStage } from '../components/ResponsiveStage';
import { EASE_EXPO_OUT } from '../motion/tokens';

type Motif = 'pill-light' | 'bot-dark';
type Phase = 'give-phone' | 'exiting-give' | 'its-own' | 'pill-expanded';

export const InlinePillScene: React.FC<{ speed?: number }> = ({ speed = 1 }) => {
  const [motif, setMotif] = useState<Motif>('pill-light');
  const [phase, setPhase] = useState<Phase>('pill-expanded');
  const [wordStep, setWordStep] = useState<number>(4);
  const [exitStep, setExitStep] = useState<number>(0);
  const [dotCount, setDotCount] = useState<number>(10);
  const [darkBotExpanded, setDarkBotExpanded] = useState<boolean>(true);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const [stiffness, setStiffness] = useState<number>(380);
  const [damping, setDamping] = useState<number>(30);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms / speed);
      timersRef.current.push(id);
    },
    [speed],
  );

  // Exact Panel 1 F077 -> Panel 2 F064 choreography with ZERO blank gap & persistent bot
  const replayLightSequence = useCallback(() => {
    clearTimers();
    setPhase('give-phone');
    setWordStep(0);
    setExitStep(0);
    setDotCount(0);

    // Speech-cadence word snaps: 3f / 4f / 2f gaps
    schedule(70, () => setWordStep(1)); // Give
    schedule(180, () => setWordStep(2)); // your
    schedule(310, () => setWordStep(3)); // a
    schedule(390, () => setWordStep(4)); // phone

    // Staggered anticipation pop-up exit (P2 F18-F26) while persistent bot glides smoothly down!
    schedule(1020, () => {
      setPhase('exiting-give');
      setExitStep(1); // Give pops up & cuts out
    });
    schedule(1090, () => setExitStep(2)); // your
    schedule(1160, () => setExitStep(3)); // a
    schedule(1230, () => setExitStep(4)); // phone

    // Immediately snap into "Its own number" (zero blank gap!)
    schedule(1320, () => {
      setPhase('its-own');
      setWordStep(1); // Its
    });
    schedule(1450, () => setWordStep(2)); // own
    schedule(1580, () => setWordStep(3)); // number

    // Inline green pill opens between "Its own" and "number" + bot executes 5-frame blink
    schedule(1940, () => {
      setBlinkCount((c) => c + 1);
      setPhase('pill-expanded');
    });

    // Sequential 10 masked dots (~1 dot per frame = 36ms)
    for (let i = 1; i <= 10; i++) {
      schedule(2020 + i * 36, () => setDotCount(i));
    }
  }, [clearTimers, schedule]);

  // Panel 6 F043 -> F065 ("Connect Allo to [bot] Grok Bot")
  const replayDarkSequence = useCallback(() => {
    clearTimers();
    setDarkBotExpanded(false);
    setWordStep(0);

    schedule(70, () => setWordStep(1)); // Connect
    schedule(190, () => setWordStep(2)); // Allo
    schedule(310, () => setWordStep(3)); // to
    schedule(430, () => setWordStep(4)); // Grok Bot
    schedule(760, () => setDarkBotExpanded(true));
    schedule(1100, () => setBlinkCount((c) => c + 1));
  }, [clearTimers, schedule]);

  useEffect(() => {
    if (motif === 'pill-light') {
      replayLightSequence();
    } else {
      replayDarkSequence();
    }
    return clearTimers;
  }, [motif, replayLightSequence, replayDarkSequence, clearTimers]);

  const layoutSpring = { type: 'spring' as const, stiffness, damping, mass: 0.9 };
  const botDropped = phase !== 'give-phone';

  const toggleExpanded = () => {
    clearTimers();
    if (motif === 'pill-light') {
      if (phase === 'pill-expanded') {
        setPhase('its-own');
        setWordStep(3);
        setDotCount(0);
      } else {
        setPhase('pill-expanded');
        setWordStep(3);
        setBlinkCount((c) => c + 1);
        setDotCount(0);
        for (let i = 1; i <= 10; i++) {
          schedule(60 + i * 34, () => setDotCount(i));
        }
      }
    } else {
      setDarkBotExpanded((v) => !v);
      setWordStep(4);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 16:9 Proportional 960x540 Stage */}
      <ResponsiveStage
        className={`transition-colors duration-200 ${
          motif === 'bot-dark' ? 'emerald-bitmap-bg text-white' : 'bg-[#f7f8fd] text-[#08090c]'
        }`}
        statusLeft={
          motif === 'pill-light'
            ? 'Persistent bot + speech-cadence pop exits + Framer Motion layout pill reflow'
            : 'Dark emerald 2x2 pixel-grid + inverted inline bot expansion'
        }
        statusRight={`stiffness ${stiffness} · damping ${damping}`}
      >
        <div className="relative flex h-full w-full items-center justify-center px-12">
          <LayoutGroup>
            {motif === 'pill-light' ? (
              <div className="relative flex h-full w-full items-center justify-center">
                {/* Typography Layer — anchored at upper-center (y: -48 when bot drops, y: 0 when bot is inline) */}
                <motion.div
                  animate={{ y: botDropped ? -58 : 0 }}
                  transition={layoutSpring}
                  className="relative flex h-[76px] w-full items-center justify-center"
                >
                  {/* Phase A: "Give your [132px reserved gap] a phone" — zero overlap with green earcups */}
                  {(phase === 'give-phone' || phase === 'exiting-give') && (
                    <div className="flex items-center justify-center text-[42px] font-semibold tracking-[-0.03em]">
                      <div className="flex w-[220px] items-center justify-end gap-2.5 pr-3">
                        {wordStep >= 1 && exitStep < 1 && (
                          <motion.span
                            initial={{ y: 5 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            Give
                          </motion.span>
                        )}
                        {wordStep >= 2 && exitStep < 2 && (
                          <motion.span
                            initial={{ y: 5 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            your
                          </motion.span>
                        )}
                      </div>

                      {/* Exact reserved clearance for GrokBotRig (92px body + earcups) */}
                      <div className="w-[132px] shrink-0" aria-hidden="true" />

                      <div className="flex w-[220px] items-center justify-start gap-2.5 pl-3">
                        {wordStep >= 3 && exitStep < 3 && (
                          <motion.span
                            initial={{ y: 5 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            a
                          </motion.span>
                        )}
                        {wordStep >= 4 && exitStep < 4 && (
                          <motion.span
                            initial={{ y: 5 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            phone
                          </motion.span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phase B: "Its own [expanding green pill] number" — pure flex-width expansion (zero FLIP scale distortion) */}
                  {(phase === 'its-own' || phase === 'pill-expanded') && (
                    <div className="flex items-center justify-center text-[42px] font-semibold tracking-[-0.03em]">
                      <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
                        {wordStep >= 1 && (
                          <motion.span
                            initial={{ y: 6 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            Its
                          </motion.span>
                        )}
                        {wordStep >= 2 && (
                          <motion.span
                            initial={{ y: 6 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            own
                          </motion.span>
                        )}
                      </div>

                      <motion.div
                        initial={false}
                        animate={{
                          width: phase === 'pill-expanded' ? 196 : 12,
                          marginLeft: phase === 'pill-expanded' ? 14 : 0,
                          marginRight: phase === 'pill-expanded' ? 14 : 0,
                        }}
                        transition={layoutSpring}
                        className="flex h-[52px] shrink-0 items-center justify-center overflow-hidden"
                      >
                        <AnimatePresence initial={false}>
                          {phase === 'pill-expanded' && (
                            <motion.div
                              key="number-pill"
                              initial={{ scale: 0.35, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.35, opacity: 0 }}
                              transition={layoutSpring}
                              className="flex h-[50px] w-[192px] items-center justify-center gap-2.5 rounded-full bg-[#0b9f64] px-4 text-white shadow-[0_6px_18px_rgba(11,159,100,0.22)]"
                            >
                              <span className="relative inline-flex shrink-0 items-center justify-center">
                                <Phone className="h-4 w-4 fill-white text-white" />
                                <Sparkles className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 text-[#f9e125]" />
                              </span>
                              <span className="flex items-center gap-[5px] pr-0.5">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <motion.span
                                    key={i}
                                    initial={false}
                                    animate={{
                                      scale: i < dotCount ? 1 : 0,
                                      opacity: i < dotCount ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.08, ease: EASE_EXPO_OUT }}
                                    className="h-[6px] w-[6px] rounded-full bg-white"
                                  />
                                ))}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <div className="shrink-0 whitespace-nowrap">
                        {wordStep >= 3 && (
                          <motion.span
                            initial={{ y: 6 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.07, ease: EASE_EXPO_OUT }}
                          >
                            number
                          </motion.span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Single Persistent Grok Bot — never unmounts, glides cleanly from inline (y:0) to lower center (y:82) */}
                <motion.div
                  className="pointer-events-none absolute"
                  animate={{
                    y: botDropped ? 82 : 0,
                    scale: botDropped ? 1.04 : 0.94,
                  }}
                  transition={layoutSpring}
                >
                  <GrokBotRig
                    size={96}
                    lookX={botDropped ? 0 : 0.28}
                    lookY={phase === 'pill-expanded' ? -0.44 : botDropped ? -0.18 : -0.08}
                    blinkTrigger={blinkCount}
                  />
                </motion.div>
              </div>
            ) : (
              /* Dark Emerald Outro Bookend: "Connect Allo to [bot] Grok Bot" */
              <div className="flex items-center justify-center text-[40px] font-semibold tracking-[-0.03em] text-white">
                <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
                  {wordStep >= 1 && (
                    <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.07 }}>
                      Connect
                    </motion.span>
                  )}
                  {wordStep >= 2 && (
                    <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.07 }}>
                      Allo
                    </motion.span>
                  )}
                  {wordStep >= 3 && (
                    <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.07 }}>
                      to
                    </motion.span>
                  )}
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    width: darkBotExpanded ? 98 : 12,
                    marginLeft: darkBotExpanded ? 12 : 0,
                    marginRight: darkBotExpanded ? 12 : 0,
                  }}
                  transition={layoutSpring}
                  className="flex h-[84px] shrink-0 items-center justify-center overflow-visible"
                >
                  <AnimatePresence initial={false}>
                    {darkBotExpanded && (
                      <motion.div
                        key="inline-dark-bot"
                        initial={{ scale: 0.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.1, opacity: 0 }}
                        transition={layoutSpring}
                        className="flex items-center justify-center"
                      >
                        <GrokBotRig
                          size={74}
                          inverted
                          lookX={0.22}
                          lookY={-0.06}
                          blinkTrigger={blinkCount}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div className="shrink-0 whitespace-nowrap">
                  {wordStep >= 4 && (
                    <motion.span initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.07 }}>
                      Grok Bot
                    </motion.span>
                  )}
                </div>
              </div>
            )}
          </LayoutGroup>
        </div>
      </ResponsiveStage>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6e8ef] pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => (motif === 'pill-light' ? replayLightSequence() : replayDarkSequence())}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0f1115] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:bg-[#232730] active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            Replay sequence
          </button>

          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d9dde8] bg-white px-3.5 py-2 text-sm font-medium text-[#0f1115] transition-colors duration-150 hover:bg-[#f4f6fb]"
          >
            {(motif === 'pill-light' ? phase === 'pill-expanded' : darkBotExpanded)
              ? 'Collapse inline token'
              : 'Expand inline token'}
          </button>

          <div className="inline-flex rounded-lg border border-[#d9dde8] bg-[#f4f6fb] p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setMotif('pill-light')}
              className={`cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors duration-150 ${
                motif === 'pill-light' ? 'bg-white text-[#0f1115] shadow-xs' : 'text-[#525866]'
              }`}
            >
              Light pill
            </button>
            <button
              type="button"
              onClick={() => setMotif('bot-dark')}
              className={`cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors duration-150 ${
                motif === 'bot-dark' ? 'bg-[#072119] text-white shadow-xs' : 'text-[#525866]'
              }`}
            >
              Dark outro
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-[#0f1115]">
          <label className="flex items-center gap-2.5">
            <span className="text-[#525866]">Stiffness</span>
            <input
              type="range"
              min={160}
              max={640}
              step={20}
              value={stiffness}
              onChange={(e) => setStiffness(Number(e.target.value))}
              className="studio-slider w-24"
            />
            <span className="w-8 tabular-nums">{stiffness}</span>
          </label>
          <label className="flex items-center gap-2.5">
            <span className="text-[#525866]">Damping</span>
            <input
              type="range"
              min={14}
              max={48}
              step={2}
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value))}
              className="studio-slider w-24"
            />
            <span className="w-6 tabular-nums">{damping}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
