# Rabbit Hole

**Games that start simple and spiral into something you didn't expect.**

A platform of experimental browser games built with Next.js. Each game begins with a familiar, manageable premise and gradually escalates — in scope, absurdity, or existential weight — until you're somewhere you didn't anticipate when you clicked Play.

**Live:** [rabbit-hole-rosy-six.vercel.app](https://rabbit-hole-rosy-six.vercel.app)

---

## Games

### ⚗️ Concept Alchemy
*Infinite · Combinatorial*

Fuse two concepts together and discover what they become. Start with the four classical elements and work outward through hundreds of discoverable combinations — Steam, Philosophy, Consciousness, Grief, Language, Dark Matter, and beyond.

Every pair of concepts produces a result. Known combinations are hand-authored with lore; any pair not in the table falls back to a deterministic hash so the same combination always yields the same result, no matter when or where you play. There's no API, no server, no randomness — just you and the combinatorial space.

**Mechanics:** Drag elements onto each other to fuse them. Pan the canvas freely. Discovered elements persist across sessions.

---

### 📎 The Cascade
*Incremental · Existential*

You start by sorting emails. You end somewhere else entirely.

An incremental game in five phases, each expanding the scope of your task by an order of magnitude. Phase 0 is inbox management. By Phase 4, you are something that no longer has an inbox. The game doesn't announce these transitions — it lets the labels and the numbers do the work.

Between phases, a narrator reflects on what you've been doing. The reflections get harder to dismiss as the numbers get larger.

**Mechanics:** Click to process tasks. Upgrades unlock automatically. Progress saves between sessions.

---

### 🏛️ The Infinite Bureau
*Puzzle · Bureaucratic Horror*

You are Clerk. Process the forms.

A document-processing puzzle game across four acts, each adding new departments, new rules, and new contradictions. Act 1 is straightforward: check the Bureau ID format, count the witness signatures, verify the date. By Act 3 you are processing your own release request, which you must approve, because the rules require it, and you cannot redirect it, because the rules forbid that too.

Every form has a correct answer derivable from the rulebook. The rulebook is always visible. The rules are always internally consistent — except when they're not, at which point that contradiction is itself the puzzle.

**Mechanics:** Read the form. Check the rulebook. Stamp APPROVE, DENY, or REDIRECT. Earn clearance. Advance through acts.

---

## Coming Soon

| Game | Premise |
|------|---------|
| 🔐 The Password Gauntlet | Create a password satisfying increasingly unhinged rules |
| 🚂 Moral Mayhem | Absurd trolley problems that escalate from silly to existential |
| 💸 Spend a Trillionaire's Fortune | $1 trillion. Buy aircraft carriers. Fund Mars colonies. Go. |
| 🚀 The Last Signal | Pilot humanity's final colony ship. Each planet is a one-way decision. |
| 🐱 Whisker Empire | One cat, a ball of yarn, and the slow march toward feline civilization |

---

## Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, `"use client"` components)
- **Runtime:** React 19
- **Styling:** Inline styles — no CSS framework, no build step beyond Next.js
- **Persistence:** `localStorage` — no database, no accounts
- **Deployment:** [Vercel](https://vercel.com), auto-deploys from `main`
- **API costs:** $0 — all game logic runs entirely in the browser

---

## Architecture

```
app/
  page.jsx          # Platform launcher — game registry and selection UI
  layout.jsx        # Root layout
  api/fuse/         # Legacy route (unused)
components/
  ConceptAlchemy.jsx    # Element fusion game
  TheCascade.jsx        # Incremental escalation game
  TheInfiniteBureau.jsx # Bureaucratic puzzle game
```

Each game is a single self-contained component that accepts an `onBack` prop. The platform passes `onBack={() => setCurrentGame(null)}` to return to the launcher. Adding a new game means writing the component and adding two lines to `page.jsx`.

### No-API design

All three games were originally designed around LLM API calls. The deployed versions replace every API call with client-side equivalents:

- **Concept Alchemy** — 200+ hand-authored combinations in a lookup table; any unlisted pair runs through an FNV-1a hash to produce a deterministic name, emoji, and lore blurb
- **The Cascade** — narrative text between phases comes from static pools, cycled by a counter
- **The Infinite Bureau** — the final ending is generated from a template using the player's actual stats (forms processed, approval rate, infractions, best streak)

### Hydration safety

All components that use `Math.random()` or `localStorage` are guarded by a `mounted` state flag. During server-side pre-render the component returns a static loading placeholder; after hydration it switches to the live interactive version. This prevents React hydration mismatches without disabling SSR entirely.

---

## Local Development

```bash
# Clone
git clone https://github.com/Sophie-S-Z/rabbit-hole.git
cd rabbit-hole

# Install
npm install

# Run
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment variables required.

---

## Adding a Game

1. Create `components/YourGame.jsx` with `"use client"` at the top and a default export that accepts `{ onBack }`
2. In `app/page.jsx`, import the component and add it to `GAME_COMPONENTS` and `GAMES`

```js
// app/page.jsx
import YourGame from "../components/YourGame";

const GAME_COMPONENTS = {
  alchemy: ConceptAlchemy,
  cascade: TheCascade,
  bureau: TheInfiniteBureau,
  yourgame: YourGame,           // add here
};

const GAMES = [
  // ...existing games...
  {
    id: "yourgame",
    title: "Your Game Title",
    emoji: "🎮",
    desc: "One or two sentences.",
    accent: "R,G,B",            // RGB values for the card accent color
    gradient: "linear-gradient(135deg, #... 0%, #... 100%)",
    tag: "GENRE · THEME",
  },
];
```

Push to `main` and Vercel deploys automatically.
