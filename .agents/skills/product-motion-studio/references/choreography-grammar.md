# Studio Choreography Grammar for Product Launches & UI Motion

Load this reference during **Phase 1** to design original storyboards, timing budgets,
color systems, and scene transitions that feel like a high-craft motion studio.

---

## 1. Proven 6-Beat Product Launch Storyboard Arc (`10–20 s`)

Adapt or subset these beats to fit any SaaS product, AI tool, mobile app, or feature launch:

| Beat | Role | Duration | Signature Motion Moves |
| :--- | :--- | :--- | :--- |
| **1. Subject Hook** | Introduce brand mascot, app icon, or hero object | `2.0–2.5 s` | Curved J-entry with velocity smear → bottom squash → apex hang → secondary accessory/badge snap synced to a **`1.65–1.75×` impact camera punch-in** |
| **2. Inline Value Prop** | State the core promise in 3–6 words | `2.5–3.2 s` | Speech-cadence word snaps (`3f/4f/2f` rhythm) → anticipation pop-up exit → **inline flex-width token expansion** (e.g., `"Your own [pill/badge] workflow"`) with sequential interior reveal |
| **3. Hero UI Action** | Show the product doing the job inside real UI | `2.5–3.0 s` | Subject dives into the UI with **counter-motion framing** (mockup glides up as subject arcs down) → **1-frame polarity flip** on dark surfaces → choreographed control swap + live waveform/status + L→R character wipe |
| **4. Conversational / Card Proof** | Show output quality (quote, result, notification) | `2.5–3.0 s` | Origin-anchored elastic bubble pop (`4f`) → dynamic width-tracking text stream → rapid `2–3f` reframe scaling subject to avatar size as rich result card drops cleanly beneath |
| **5. Complex UI Focus Zoom** | Make desktop/dashboard UI legible on mobile feeds | `2.5–3.0 s` | Establish full desktop mockup briefly → **`9f` (`300 ms`) aggressive `1.85×` 2D camera push-in** straight onto the key thread/metric, pushing window chrome off-frame |
| **6. Dark-Mode Brand Payoff** | High-contrast logo lockup + CTA | `2.5–3.5 s` | **1-frame hard cut** from cool light UI to deep dark surface with micro pixel-grid texture → icon glide + wordmark kerning compression → final inline token bookend (`"Connect X to [icon] Y"`) held cleanly `≥ 0.9 s` |

---

## 2. Calibrated Timing Budget (30 fps Reference, Rendered at 60 fps)

Avoid sluggish `400–600 ms` symmetric fades. Studio motion feels snappy because micro-actions
are short while reading holds stay generous:

| Motion Element | Target Duration | Easing / Physics |
| :--- | :--- | :--- |
| Crisp word snap-in | `1f` cut + `2f` (`67 ms`) Y-settle (`+5 px → 0`) | Exponential out `[0.16, 1, 0.3, 1]` |
| Staggered speech-cadence word gaps | Irregular `2f–4f` (`67–133 ms`), never robotic uniform | Synced to natural spoken stress |
| Anticipation pop-up word exit | `2f` (`-6 px`) nudge then crisp cut | Fast left-to-right cascade (`65 ms` step) |
| Elastic bubble / badge / card pop | `4f` (`133 ms`) | Spring (`stiffness: 520, damping: 26`) |
| Natural character blink | `5f` (`167 ms`): `100% → 45% → 10% → 0% → 12% → 100%` | Linear keyframes with 1 closed frame |
| UI state morph / inline pill expand | `8–10f` (`267–333 ms`) | Spring (`stiffness: 380, damping: 30`) |
| 2D camera push-in (`1.0× → 1.85×`) | `9f` (`300 ms`) | Steep expo out `[0.16, 1, 0.3, 1]` |
| Reading hold between major beats | `20–30f` (`0.7–1.0 s`) | Keep subtle life (waveform, float, blink, dots) |

---

## 3. Color Restraint & Visual Contrast Rules

- **Use 4 core roles:** Cool gallery off-white stage (e.g., `#f7f8fd`, crisper than `#ffffff`),
  deep ink (`#08090c`), **one** saturated brand accent (e.g., emerald `#0b9f64`), and a high-contrast
  dark payoff backdrop (deep tinted dark + subtle radial spotlight + `2×2 px` on `4 px` pitch
  dot/pixel grid at `~4%` opacity to eliminate H.264 gradient banding).
- **Never crossfade light-to-dark:** Use a crisp 1-frame hard cut at the climax beat to maximize
  perceived production contrast.
- **Social Loop Showcase Layout:** To turn a `15–20 s` linear launch video into a hypnotic `4 s`
  social feed loop, arrange 6 copies of the `16:9` composition in a `2×3` grid on white gutters
  and phase-offset each panel forward by `~3.2 s` (`96` frames at 30 fps).

---

## 4. Transition Grammar

- **Motivated Hard Cuts:** Zero cross-dissolves or whip-pan blurs. Cut cleanly on beat into a
  shot that is **already moving** (rotating character, rising window, expanding card).
- **Counter-Motion Framing:** Move the background container *toward* the entering subject
  (e.g., phone slides up as icon dives down) to double perceived velocity without extreme travel.
- **Persistent Subject Continuity:** Keep a hero mascot/icon mounted continuously across
  sub-beats so it smoothly repositions (`inline → below headline` or `above bezel → inside slot`)
  rather than fading out and back in.
