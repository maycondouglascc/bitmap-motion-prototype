import React, { useState } from 'react';
import { FullSequenceScene } from './scenes/FullSequenceScene';
import { CharacterRigScene } from './scenes/CharacterRigScene';
import { InlinePillScene } from './scenes/InlinePillScene';
import { DynamicIslandScene } from './scenes/DynamicIslandScene';

type TabId = 'sequence' | 'rig' | 'pill' | 'island';

const TABS: { id: TabId; label: string }[] = [
  { id: 'sequence', label: 'Full sequence' },
  { id: 'rig', label: 'Character rig' },
  { id: 'pill', label: 'Inline pill' },
  { id: 'island', label: 'Dynamic Island' },
];

const SCENE_NOTES: Record<
  TabId,
  { heading: string; summary: string; mechanics: { title: string; detail: string }[] }
> = {
  sequence: {
    heading: 'Continuous multi-beat launch sequence',
    summary:
      'Chains all four measured motion systems together with zero-fade hard cuts and shared-layout character continuity.',
    mechanics: [
      {
        title: 'Motivated hard cuts',
        detail: 'Zero crossfades between scenes. Incoming beats start mid-motion so cuts feel seamless at 30 fps.',
      },
      {
        title: 'Shared character continuity',
        detail: 'Grok Bot transitions via Framer Motion layoutId from inline headline scale down to lower baseline.',
      },
      {
        title: 'Dark emerald pixel-grid payoff',
        detail: 'Hard cut from #f7f8fd light UI into #04160f emerald overlaid with a 2x2 pixel grid on a 4px pitch.',
      },
    ],
  },
  rig: {
    heading: '2.5D spherical character rig',
    summary:
      'Reproduces the Grok Bot entirely from 2D SVG layers clipped by a circular alpha matte, with spherical gaze wrap and velocity squash.',
    mechanics: [
      {
        title: 'Velocity squash and stretch',
        detail: 'J-curve entrance compresses from 0.79x dive stretch to 1.35x bottom-arc squash before rebounding to apex hangtime.',
      },
      {
        title: 'Alpha-matted spherical eyes',
        detail: 'Eyes slide toward the circle boundary and narrow via cosine foreshortening, clipping cleanly at the edge.',
      },
      {
        title: '1.75x impact camera punch-in',
        detail: 'Headset winds up before a 4-frame slam synced directly to a spring-driven camera zoom on the contact frame.',
      },
    ],
  },
  pill: {
    heading: 'Inline flexbox pill expansion',
    summary:
      'Demonstrates Framer Motion layout springs pushing surrounding typography outward as an inline token expands between words.',
    mechanics: [
      {
        title: 'Speech-cadence word snaps',
        detail: 'Words cut in sharply with a 2-frame vertical settle rather than sluggish opacity fades.',
      },
      {
        title: 'Live flexbox reflow',
        detail: 'Adjacent spans carry layout props so widening the green pill or dark-mode bot pushes text apart smoothly.',
      },
      {
        title: 'Synced secondary reaction',
        detail: 'As the pill opens and reveals ten masked digits sequentially, the bot executes a 5-frame blink and glances up.',
      },
    ],
  },
  island: {
    heading: 'Dynamic Island dive and call morph',
    summary:
      'Integrates the mascot directly into the iPhone interface with counter-motion framing, polarity inversion, and character wipes.',
    mechanics: [
      {
        title: 'Counter-motion framing',
        detail: 'The iPhone bezel glides upward while the bot arcs downward over the edge, doubling perceived dive speed.',
      },
      {
        title: '1-frame polarity flip',
        detail: 'On landing inside the dark Dynamic Island slot, the bot flips cleanly from black-on-light to white-on-dark.',
      },
      {
        title: 'Choreographed call state swap',
        detail: 'Green Accept shrinks to zero, red Decline slides right via layout, waveform expands, and labels wipe left-to-right.',
      },
    ],
  },
};

export const App: React.FC = () => {
  const isExportMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('export') === '1';

  const [activeTab, setActiveTab] = useState<TabId>('sequence');
  const note = SCENE_NOTES[activeTab];

  if (isExportMode) {
    return (
      <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#f7f8fd]">
        <FullSequenceScene exportMode />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-[#0f1115]">
      {/* Single-line studio header */}
      <header className="sticky top-0 z-40 border-b border-[#e6e8ef] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#0f1115] text-white"
              aria-hidden="true"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                <circle cx="10" cy="10" r="8" />
                <rect x="6.5" y="7.5" width="2.2" height="5" rx="1.1" fill="#ffffff" />
                <rect x="11.3" y="7.5" width="2.2" height="5" rx="1.1" fill="#ffffff" />
              </svg>
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#0f1115]">
              Bitmap Motion Lab
            </span>
          </div>

          {/* Connected segmented mode selector */}
          <nav
            aria-label="Animation prototypes"
            className="inline-flex rounded-lg border border-[#e6e8ef] bg-[#f7f8fd] p-1 text-sm"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer rounded-md px-3.5 py-1.5 font-medium transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0f1115] shadow-xs'
                    : 'text-[#525866] hover:text-[#0f1115]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main interactive workbench */}
      <main className="mx-auto max-w-[1120px] px-5 pt-7 pb-16 sm:px-8">
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-[#0f1115]">
            {note.heading}
          </h1>
          <p className="max-w-[64ch] text-sm text-[#525866]">{note.summary}</p>
        </div>

        {/* Active Prototype Stage + Controls */}
        <section aria-label={note.heading}>
          {activeTab === 'sequence' && <FullSequenceScene />}
          {activeTab === 'rig' && <CharacterRigScene />}
          {activeTab === 'pill' && <InlinePillScene />}
          {activeTab === 'island' && <DynamicIslandScene />}
        </section>

        {/* Clean 3-column typographic technique breakdown separated by 1px hairline */}
        <section
          aria-label="Motion mechanics"
          className="mt-10 grid grid-cols-1 gap-8 border-t border-[#e6e8ef] pt-7 md:grid-cols-3"
        >
          {note.mechanics.map((m) => (
            <div key={m.title} className="flex flex-col gap-1.5">
              <h2 className="text-sm font-semibold text-[#0f1115]">{m.title}</h2>
              <p className="text-sm leading-relaxed text-[#525866]">{m.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default App;
