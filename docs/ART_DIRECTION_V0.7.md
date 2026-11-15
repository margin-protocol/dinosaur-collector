# SIANG COLLECTOR｜小湘收集器 — Art Direction V0.7

> Status: APPROVED visual direction / asset production pending  
> Art: 皮寶 (GPT) · Engineering: 德寶 (Claude) · Creative director: 湘  
> Date: 2026-11-15

## 1. Confirmed direction

**Refined Organic Fantasy × Biopunk × Ornate Incubation × Minimal Tech UI**

The previously proposed cozy cream scrapbook/nursery aesthetic is **superseded** for the main game art direction. The user approved the egg-style concept sheet (12 variants and a layer breakdown), and selected the **leftmost chibi character proportion** in the three-character comparison. Earlier ornate UI concept images were **not approved as final character art**.

The visual hierarchy must be: **egg and character > incubation environment > interface decorations**. Avoid filling every surface with ornate borders, flowers, gauges or gold details. The game is mobile-first, primarily Android PWA.

Six desired qualities from the intended player: **flesh, minimalism, fantasy, opulence, biological feel, technology**. They are not equal mandates on every screen.

## 2. Style language

- Organic membranes, capillary patterns, semi-translucent eggshells, internal bioluminescence and subtly pulsing structures.
- Fine rose-gold or dark-metal hardware, petal-like incubation cradles, controlled crystal accents.
- Elegant sci-fi diagnostics: incubation progress, life-sign pulse, scanning overlays; **no decorative fake data**.
- Luxurious material and lighting on the central subject, **restrained, readable** UI surrounding it.
- Blood/flesh visual language should feel strange and living, not gratuitously gory.
- Fantasy/biology and technology should feel integrated (living incubation equipment), not two unrelated aesthetics.

### Proposed palette (adjust after device tests)

| Token | HEX | Purpose |
|---|---|---|
| `bg-deep` | `#191518` | Dark background |
| `wine` | `#742F42` | Organic structures and vital pulse |
| `ivory` | `#F0E7DF` | Main text and highlights |
| `rose-metal` | `#B99283` | Restrained premium metal detailing |
| `silver` | `#9DA6AC` | Secondary technical information |
| `bio-cyan` | `#83C9C1` | Scans, energy, status |
| `egg-glow` | `#FFD9C4` | Warm internal illumination |

These are **proposed UI tokens**, not exact sampled colors from the concept images. Check text contrast and small-screen legibility.

## 3. Character canon and proportions

- The chosen **leftmost chibi** concept is the character *proportion reference*: roughly **2–2.5 heads tall**, small limbs, clear silhouette and expressive face.
- All 小湘 variants must share recognizable facial proportions and key visual identity, while changing costume, prop, expression and theme.
- Use the user's approved real-photo references for facial likeness **only in the art-production workflow**; do not put private photos into a public GitHub repository without explicit approval.
- The generated UI images and character depictions are **concept references, not approved final sprite assets**.
- Keep 小湘 charming and approachable even when the surrounding world is strange and biological.
- The small dinosaur remains an adorable, unknown companion organism. Its biology may include subtle translucent parts and glowing markings, but should not become a generic plush mascot or horror monster.
- The mascot and all character variants require consistent turnarounds / canonical reference sheets before bulk production.

## 4. Egg visual system — approved concept direction

A translucent, luminous **organic egg** supported by a delicate **petal-like metallic incubation cradle**. Shell material, pattern, internal light and external attachments distinguish egg types.

**Concept examples (not a commitment to implementing all at launch):**

| Egg | Design cue | Intended gameplay association |
|---|---|---|
| Ordinary | Warm pearlescent shell, fine organic veins | Basic hatch |
| Regional | Greenish mineral / map-like channels | Taiwan location |
| Weather | Sky-blue translucent shell, clouds / atmosphere | Weather event |
| Date | Soft rose, heart-like inner glow | Couple event |
| Cipher | Violet luminescent symbols and orbit rings | Secret code |
| Mystery | Deep opalescent core and complex metallic arcs | Rare/unknown |
| Flesh | Visible living veins and tissue-like wraps | Special biology |
| Floral | Sprouting botanical growth and petals | Nature |
| Crystal | Faceted mineral shell | Mineral/energy |
| Deep-sea | Aquatic translucent shell and floating organisms | Aquatic |
| Mechanical | Precision metal ring structures | Tech |
| Ancient | Fossil-like etching and relic finish | Ancient discovery |

The exact launch egg list, drop rates, hatch requirements and unlock rules are **not finalized**. Avoid hard-coding these concept categories as mandatory gameplay mechanics.

### Special opening egg

Create a **one-of-a-kind「小湘本源蛋」** as the first egg the boyfriend receives. It hatches **No.001 原味小湘** after a simple tutorial task. It must be visibly distinct from ordinary eggs. No other starting character is present. Do not spoil its contents in the opening UI.

## 5. Production asset requirements

**Deliver real transparent PNG/WebP assets**, not a cropped collage or flattened screenshot. Preferred source size for the egg: **1024×1024**, alpha background, consistent center, scale and anchor across all egg types.

Minimum layer set per egg:
1. `shell.png`: intact translucent shell; no baked-in glow or cracks where avoidable.
2. `glow.png`: isolated internal emission, independently opacity/color animated.
3. `cracks.png`: isolated crack geometry, no solid background.
4. `cradle.png`: standalone metal-petal stand.
5. Optional `ornaments.png`: vines, rings, petals, exterior features.
6. Optional `foreground.png`: effects that overlap the character/egg in front.

**Important:** The prior 12-egg concept sheet **illustrates** layer separation but is **not** actual separate transparent assets. Do not treat the sheet as a production sprite atlas. Layer extraction from a single painted image may not reconstruct concealed pixels; layers may need to be newly illustrated.

Suggested names:
```text
public/assets/eggs/
  origin/
    shell.png
    glow.png
    cracks.png
    cradle.png
  ordinary/
    shell.png
    glow.png
    cracks.png
    cradle.png
  ...
public/assets/characters/siang-001-original.png
public/assets/mascot/dinosaur-idle.png
```

Where possible use shared cradles and effects to reduce workload, but allow unique supports for exceptional eggs. Optimize production PNGs into WebP/AVIF where supported while preserving original master assets separately.

## 6. Motion direction

- Idle: subtle organic breathing/pulsation; slow illumination; small ambient movement.
- Warming: inner glow gradually strengthens, a few life-sign pulses.
- Near hatch: restrained shake, staged crack overlay, emerging light.
- Reveal: brief light flare, shell separates, character silhouette and collectible card.
- CSS/SVG can animate layer position, opacity and glow; do not imply that a single PNG automatically produces physically separated shards.
- Provide a reduced-motion mode; avoid excessive flashing and expensive full-screen blur filters on mobile.

## 7. Interface specification

**Portrait mobile first.** The approved moodboard's wide cinematic layouts are **not** a literal screen design.

- Home: egg as main focal point, character and mascot in supporting positions, one visible incubation progress control, primary task action and bottom navigation.
- Hatch: dedicated immersive egg focus with very little UI chrome.
- Dex: clear, searchable biological specimen archive; silhouettes for undiscovered entries.
- Research: two selected 小湘 assistants, current egg, recipe clues and history.
- Tasks / weekly bingo: simple, high-contrast panels; functional clarity over decoration.
- Review/admin: especially clean and fast; show evidence and review actions without busy ornamental backgrounds.

Use accessible tap targets (approximately 44×44 CSS px minimum), readable body text, contrast checks and safe-area insets for Android devices. Decorative organic scenery must not compete with labels.

## 8. Handoff and implementation boundaries

- **Approved now:** art direction, chibi proportion (leftmost), organic luminous eggs, modular layer requirement, special origin egg.
- **Not approved/final:** character face/sprite, exact egg variant set, complete UI layout, exact palette values, animations, background scene, all final PNG layers.
- Start engineering with **replaceable placeholder asset paths** and a data-driven egg registry. Do not bake artwork into CSS or flatten an entire interface into one background image.
- Keep all game architecture on the project's GitHub-first trajectory; this document is an art handoff, not a change to storage/auth architecture.
- Coordinate with art before declaring any illustrated asset production-ready.

## 9. Immediate engineering tasks for 德寶

1. Build a responsive portrait-first design-system prototype using the palette tokens and restrained panels.
2. Implement an egg view with independent layers (`shell`, `glow`, `cracks`, `cradle`) and placeholder assets.
3. Build an egg registry mapping IDs to asset paths, metadata and hatch state.
4. Implement hatch progress states and reduced-motion handling.
5. Reserve space for 小湘 chibi + dinosaur companion; do not finalize their faces using unapproved mockups.
6. Confirm needed transparent asset dimensions, anchors and maximum file sizes with art before asset export.

**Core principle: a mysterious living specimen that can be nurtured and collected, with an elegant UI that gets out of the way.**
