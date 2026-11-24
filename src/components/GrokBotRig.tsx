import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS, frames } from '../motion/tokens';

export interface GrokBotRigProps {
  /** Base visual box size in pixels (includes headset earcup clearance so flexbox never clips/overlaps) */
  size?: number;
  /** Normalized horizontal look direction (-1 left to +1 right) */
  lookX?: number;
  /** Normalized vertical look direction (-1 up to +1 down) */
  lookY?: number;
  /** Whether the green headset is visible on the bot */
  showHeadset?: boolean;
  /** Optional independent transform for animating headset drop-in & wind-up */
  headsetAnim?: {
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
    opacity?: number;
  };
  /** Custom transition for headsetAnim (e.g. crisp slam vs soft float) */
  headsetTransition?: Record<string, unknown>;
  /** Instant 1-frame polarity inversion (white body + black eyes for Dynamic Island / Dark Outro) */
  inverted?: boolean;
  /** Incrementing counter to trigger the exact 5-frame (167ms) blink */
  blinkTrigger?: number;
  /** Squash & stretch overrides */
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  /** Custom transition for squash & stretch container */
  bodyTransition?: Record<string, unknown>;
  /** Reveals the alpha matte clip boundary and vector construction guides */
  xray?: boolean;
  /** Smoothly spring eye gaze vs immediate tracking */
  instantGaze?: boolean;
  className?: string;
}

/**
 * 2.5D Spherical Character Rig reproducing Bitmap Studio's Grok Bot.
 * Outer layout box matches the full silhouette width including headset earcups
 * so Framer Motion flexbox reflow never overlaps adjacent text.
 */
export const GrokBotRig: React.FC<GrokBotRigProps> = ({
  size = 104,
  lookX = 0,
  lookY = 0,
  showHeadset = true,
  headsetAnim,
  headsetTransition,
  inverted = false,
  blinkTrigger = 0,
  scaleX = 1,
  scaleY = 1,
  rotate = 0,
  bodyTransition,
  xray = false,
  instantGaze = false,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Trigger exact 5-frame blink (167ms at 30fps)
  useEffect(() => {
    if (blinkTrigger === 0) return;
    setIsBlinking(true);
    const t = window.setTimeout(() => setIsBlinking(false), 185);
    return () => window.clearTimeout(t);
  }, [blinkTrigger]);

  const gx = Math.max(-1, Math.min(1, lookX));
  const gy = Math.max(-1, Math.min(1, lookY));

  // Spherical projection inside a 100x100 viewBox (body circle centered at 50,50 r=37)
  const R = 37;
  const eyeDeltaX = gx * (R * 0.64);
  const eyeDeltaY = gy * (R * 0.68);

  // Cosine foreshortening of eye separation & pill width near silhouette edges
  const cosX = Math.cos(gx * 0.8);
  const cosY = Math.cos(gy * 0.6);
  const halfGap = 8.2 * (0.66 + 0.34 * cosX);
  const leftEyeScaleX = Math.max(0.45, cosX * (gx < 0 ? 0.86 : 1.04));
  const rightEyeScaleX = Math.max(0.45, cosX * (gx > 0 ? 0.86 : 1.04));
  const eyeScaleY = Math.max(0.62, 0.75 + 0.25 * cosY);

  // Relative 2.5D parallax shifts for headset pieces (strictly relative deltas)
  const bandDeltaX = gx * 2.4;
  const bandDeltaY = gy * 1.4;
  const cupDeltaX = gx * 5.0;
  const cupDeltaY = gy * 2.6;
  const leftCupScaleX = Math.max(0.58, 1 + gx * 0.18);
  const rightCupScaleX = Math.max(0.58, 1 - gx * 0.18);
  const micDeltaX = gx * 6.2;
  const micDeltaY = gy * 3.0;

  const bodyFill = inverted ? COLORS.white : COLORS.ink;
  const eyeFill = inverted ? COLORS.ink : COLORS.white;

  const gazeTransition = instantGaze
    ? { duration: 0.04 }
    : { type: 'spring' as const, stiffness: 360, damping: 28, mass: 0.65 };

  const clipId = React.useId();

  // Outer width accounts for headset earcups cleanly so flexbox never collides with adjacent letters
  const boxWidth = showHeadset ? Math.round(size * 1.08) : size;

  return (
    <motion.div
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`}
      style={{ width: boxWidth, height: size }}
      animate={{ scaleX, scaleY, rotate }}
      transition={bodyTransition ?? { type: 'spring', stiffness: 360, damping: 26, mass: 0.75 }}
    >
      <svg
        viewBox="-6 -6 112 112"
        width={size * 1.12}
        height={size * 1.12}
        className="overflow-visible"
        aria-label="Grok Bot 2.5D character rig"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r={R} />
          </clipPath>
        </defs>

        {/* Headset Band & Earcups hugging the sphere */}
        {showHeadset && (
          <motion.g
            initial={false}
            animate={{
              x: headsetAnim?.x ?? 0,
              y: headsetAnim?.y ?? 0,
              scale: headsetAnim?.scale ?? 1,
              rotate: headsetAnim?.rotate ?? 0,
              opacity: headsetAnim?.opacity ?? 1,
            }}
            style={{ originX: '50px', originY: '50px' }}
            transition={headsetTransition ?? { type: 'spring', stiffness: 420, damping: 25, mass: 0.7 }}
          >
            {/* Headband arc curving over the upper crown */}
            <motion.path
              d="M 11 49 C 11 10, 89 10, 89 49"
              fill="none"
              stroke={COLORS.green}
              strokeWidth="8.5"
              strokeLinecap="round"
              animate={{ x: bandDeltaX, y: bandDeltaY }}
              transition={gazeTransition}
            />

            {/* Left earcup */}
            <motion.rect
              x={5.5}
              y={36}
              width={11.5}
              height={28}
              rx={5.75}
              fill={COLORS.green}
              style={{ originX: '11.25px', originY: '50px' }}
              animate={{
                x: cupDeltaX,
                y: cupDeltaY,
                scaleX: leftCupScaleX,
              }}
              transition={gazeTransition}
            />

            {/* Right earcup */}
            <motion.rect
              x={83}
              y={36}
              width={11.5}
              height={28}
              rx={5.75}
              fill={COLORS.green}
              style={{ originX: '88.75px', originY: '50px' }}
              animate={{
                x: cupDeltaX,
                y: cupDeltaY,
                scaleX: rightCupScaleX,
              }}
              transition={gazeTransition}
            />
          </motion.g>
        )}

        {/* Spherical Body Circle (also the Alpha Matte boundary) */}
        <circle
          cx="50"
          cy="50"
          r={R}
          fill={bodyFill}
          fillOpacity={xray ? 0.14 : 1}
          stroke={xray ? COLORS.green : 'none'}
          strokeWidth={xray ? 1.8 : 0}
          strokeDasharray={xray ? '4 3' : undefined}
        />

        {/* X-ray spherical latitude/longitude helper lines */}
        {xray && (
          <g stroke="#0b9f64" strokeOpacity={0.38} strokeWidth={1.1} fill="none">
            <ellipse cx="50" cy="50" rx={R} ry={14} />
            <ellipse cx="50" cy="50" rx={14} ry={R} />
            <line
              x1="50"
              y1="50"
              x2={50 + eyeDeltaX}
              y2={50 + eyeDeltaY}
              stroke="#ff3b30"
              strokeWidth={1.6}
            />
            <circle cx={50 + eyeDeltaX} cy={50 + eyeDeltaY} r={2.8} fill="#ff3b30" />
          </g>
        )}

        {/* Eyes Group — Clipped by the Body Circle Alpha Matte (unless X-Ray is on) */}
        <g clipPath={xray ? undefined : `url(#${clipId})`}>
          <motion.g
            animate={{
              x: eyeDeltaX,
              y: eyeDeltaY,
              rotate: gx * 6,
            }}
            style={{ originX: '50px', originY: '50px' }}
            transition={gazeTransition}
          >
            {/* Left Eye Pill */}
            <motion.rect
              x={50 - halfGap - 3.6}
              y={42.2}
              width={7.2}
              height={15.6}
              rx={3.6}
              fill={xray ? COLORS.ink : eyeFill}
              style={{ originX: `${50 - halfGap}px`, originY: '50px' }}
              animate={{
                scaleX: leftEyeScaleX,
                scaleY: isBlinking ? [eyeScaleY, 0.45, 0.1, 0.02, 0.12, eyeScaleY] : eyeScaleY,
              }}
              transition={
                isBlinking
                  ? { duration: frames(5), times: [0, 0.2, 0.4, 0.52, 0.72, 1], ease: 'linear' }
                  : gazeTransition
              }
            />

            {/* Right Eye Pill */}
            <motion.rect
              x={50 + halfGap - 3.6}
              y={42.2}
              width={7.2}
              height={15.6}
              rx={3.6}
              fill={xray ? COLORS.ink : eyeFill}
              style={{ originX: `${50 + halfGap}px`, originY: '50px' }}
              animate={{
                scaleX: rightEyeScaleX,
                scaleY: isBlinking ? [eyeScaleY, 0.45, 0.1, 0.02, 0.12, eyeScaleY] : eyeScaleY,
              }}
              transition={
                isBlinking
                  ? { duration: frames(5), times: [0, 0.2, 0.4, 0.52, 0.72, 1], ease: 'linear' }
                  : gazeTransition
              }
            />
          </motion.g>
        </g>

        {/* Foreground Mic Boom — sits cleanly in front of the sphere with parallax */}
        {showHeadset && (
          <motion.g
            initial={false}
            animate={{
              x: (headsetAnim?.x ?? 0) + micDeltaX,
              y: (headsetAnim?.y ?? 0) + micDeltaY,
              scale: headsetAnim?.scale ?? 1,
              rotate: headsetAnim?.rotate ?? 0,
              opacity: headsetAnim?.opacity ?? 1,
            }}
            style={{ originX: '50px', originY: '50px' }}
            transition={headsetTransition ?? { type: 'spring', stiffness: 420, damping: 25, mass: 0.7 }}
          >
            <path
              d="M 12 57 C 13 70, 21 75, 33 75"
              fill="none"
              stroke={COLORS.green}
              strokeWidth="4.4"
              strokeLinecap="round"
            />
            <rect x="28" y="71.2" width="12.5" height="7.4" rx="3.7" fill={COLORS.green} />
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
};
