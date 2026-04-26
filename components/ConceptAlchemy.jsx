"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const BASE_ELEMENTS = [
  { name: "Fire", emoji: "🔥", tier: 0, lore: "The first spark that split the darkness" },
  { name: "Water", emoji: "💧", tier: 0, lore: "Primordial tears of the cosmos" },
  { name: "Earth", emoji: "🌍", tier: 0, lore: "Dust compressed by the weight of time" },
  { name: "Air", emoji: "💨", tier: 0, lore: "The breath between the stars" },
];

const TIER_NAMES = ["Stardust", "Stellar", "Nebular", "Cosmic", "Astral"];

const TIER_COLORS = [
  { main: "#a0b0c8", glow: "140,160,200" },
  { main: "#4da6ff", glow: "77,166,255" },
  { main: "#c06df7", glow: "192,109,247" },
  { main: "#ffb347", glow: "255,179,71" },
  { main: "#ff6b9d", glow: "255,107,157" },
];

const QUEST_LIST = [
  { id: "q1", title: "First Steps", desc: "Discover 5 elements", type: "count", target: 5, reward: { name: "Life", emoji: "🧬", tier: 1, lore: "The sacred pattern that refuses to stay still" } },
  { id: "q2", title: "Curious Mind", desc: "Discover 12 elements", type: "count", target: 12, reward: { name: "Time", emoji: "⏳", tier: 2, lore: "The river flowing one direction" } },
  { id: "q3", title: "Alchemist", desc: "Discover 25 elements", type: "count", target: 25, reward: { name: "Void", emoji: "🕳️", tier: 2, lore: "The absence that contains everything" } },
  { id: "q4", title: "Stargazer", desc: "Create a Nebular element", type: "tier", target: 2, reward: { name: "Crystal", emoji: "💎", tier: 2, lore: "Light imprisoned in perfection" } },
  { id: "q5", title: "Cosmic Voyager", desc: "Create a Cosmic element", type: "tier", target: 3, reward: { name: "Dark Matter", emoji: "🌑", tier: 3, lore: "The invisible scaffolding of reality" } },
  { id: "q6", title: "Transcendence", desc: "Create an Astral element", type: "tier", target: 4, reward: { name: "Singularity", emoji: "⚫", tier: 4, lore: "Where laws surrender to infinity" } },
  { id: "q7", title: "Chain Master", desc: "Complete a chain reaction", type: "chain", target: 1, reward: { name: "Energy", emoji: "⚡", tier: 1, lore: "Neither created nor destroyed" } },
  { id: "q8", title: "Unmaker", desc: "Split an element", type: "reverse", target: 1, reward: { name: "Entropy", emoji: "🌀", tier: 2, lore: "The slow unwinding of order" } },
];

function getReaction(name) {
  const n = name.toLowerCase();
  if (["fire","flame","explo","bomb","lava","inferno","blaze","burn"].some(w => n.includes(w))) return "explosion";
  if (["ice","frost","freeze","cold","snow","glacier","cryo"].some(w => n.includes(w))) return "frost";
  if (["life","tree","forest","nature","bloom","growth","plant"].some(w => n.includes(w))) return "aurora";
  if (["star","cosmos","universe","galaxy","nebula","supernova","void"].some(w => n.includes(w))) return "supernova";
  return null;
}

function getTreeDepth(node) {
  if (!node.children || node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(getTreeDepth));
}

function buildAncestry(name, disc, depth) {
  if (depth > 5) return { name, emoji: disc[name]?.emoji || "?", children: [] };
  const d = disc[name];
  if (!d || !d.recipe) return { name, emoji: d?.emoji || "?", children: [] };
  return {
    name,
    emoji: d.emoji,
    children: [buildAncestry(d.recipe[0], disc, depth + 1), buildAncestry(d.recipe[1], disc, depth + 1)],
  };
}

function renderTreeSVG(node, x, y, w) {
  const elements = [];
  const halfW = w / 2;
  const vGap = 72;
  if (node.children) {
    node.children.forEach((child, i) => {
      const cx = i === 0 ? x - halfW / 2 : x + halfW / 2;
      const cy = y + vGap;
      elements.push(
        <line key={"tl-" + x + "-" + y + "-" + i} x1={x} y1={y + 20} x2={cx} y2={cy - 20} stroke="rgba(140,160,200,0.15)" strokeWidth={1} />
      );
      elements.push(...renderTreeSVG(child, cx, cy, halfW));
    });
  }
  elements.push(<circle key={"tc-" + x + "-" + y} cx={x} cy={y} r={20} fill="rgba(10,8,20,0.9)" stroke="rgba(140,160,200,0.25)" strokeWidth={1} />);
  elements.push(<text key={"te-" + x + "-" + y} x={x} y={y + 6} textAnchor="middle" fontSize={16} fill="white">{node.emoji}</text>);
  elements.push(<text key={"tn-" + x + "-" + y} x={x} y={y + 36} textAnchor="middle" fontSize={10} fill="rgba(200,210,230,0.5)" fontFamily="Cormorant Garamond, serif">{node.name}</text>);
  return elements;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@300;400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes twinkle{0%,100%{opacity:var(--tw-o,0.5)}50%{opacity:0.05}}
@keyframes nodeAppear{0%{transform:translate(-50%,-50%) scale(0);opacity:0}60%{transform:translate(-50%,-50%) scale(1.2);opacity:1}100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes hoverPulse{0%,100%{box-shadow:0 0 20px var(--glow-c),0 0 40px var(--glow-c)}50%{box-shadow:0 0 35px var(--glow-c),0 0 70px var(--glow-c),0 0 90px var(--glow-c)}}
@keyframes discoverBanner{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}30%{transform:translate(-50%,-50%) scale(1)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(0.9) translateY(-20px)}}
@keyframes lineIn{from{opacity:0}to{opacity:1}}
@keyframes astralHue{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0}}
@keyframes ringGrow{0%{transform:translate(-50%,-50%) scale(0);opacity:0.8}100%{transform:translate(-50%,-50%) scale(4);opacity:0}}
@keyframes slideR{0%{opacity:0;transform:translateX(40px)}100%{opacity:1;transform:translateX(0)}}
@keyframes questDone{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}25%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(0.9)}}
@keyframes ePart{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0}}
@keyframes aWave{0%{transform:translateX(-100%) scaleY(0.5);opacity:0}50%{opacity:0.6;transform:translateX(0) scaleY(1)}100%{transform:translateX(100%) scaleY(0.5);opacity:0}}
@keyframes fSpread{0%{transform:scale(0);opacity:0.8}100%{transform:scale(3);opacity:0}}
@keyframes snFlash{0%{transform:translate(-50%,-50%) scale(0);opacity:1}50%{opacity:0.8}100%{transform:translate(-50%,-50%) scale(5);opacity:0}}
@keyframes beamPulse{0%,100%{opacity:0.6}50%{opacity:1}}
@keyframes mergeGlow{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(1.5);opacity:0.8}}
@keyframes orbSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

const btnStyle = {
  padding: "5px 12px", borderRadius: 16, cursor: "pointer",
  background: "rgba(140,160,200,0.06)", border: "1px solid rgba(140,160,200,0.1)",
  color: "#c8cde0", fontFamily: "'Cormorant Garamond', serif", fontSize: 12,
  display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
};

const btnActive = {
  ...btnStyle,
  background: "rgba(140,160,200,0.18)",
  borderColor: "rgba(140,160,200,0.4)",
  color: "#fff",
};

const SAVE_KEY = "concept-alchemy-save";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── CLIENT-SIDE COMBINATION ENGINE ──────────────────────────
const COMBO_TABLE = {
  // Base pairs
  "Air+Fire": { name:"Smoke", emoji:"🌫️", lore:"The breath of burning things" },
  "Air+Water": { name:"Rain", emoji:"🌧️", lore:"The sky weeping into the earth" },
  "Earth+Fire": { name:"Lava", emoji:"🌋", lore:"Stone that remembered heat" },
  "Earth+Water": { name:"Mud", emoji:"🟤", lore:"Earth that learned softness" },
  "Air+Air": { name:"Wind", emoji:"🌬️", lore:"Air that decided to go somewhere" },
  "Earth+Earth": { name:"Mountain", emoji:"⛰️", lore:"Patience compressed into height" },
  "Fire+Fire": { name:"Inferno", emoji:"🔥", lore:"Hunger that consumed itself" },
  "Water+Water": { name:"Ocean", emoji:"🌊", lore:"Depth without a memory of shore" },
  "Fire+Water": { name:"Steam", emoji:"♨️", lore:"The argument between fire and water" },
  // Tier 2
  "Fire+Smoke": { name:"Ash", emoji:"🌑", lore:"What remains when meaning burns away" },
  "Air+Steam": { name:"Cloud", emoji:"☁️", lore:"Water practicing the art of not falling" },
  "Earth+Steam": { name:"Hot Spring", emoji:"💧", lore:"Earth exhaling warmth into stillness" },
  "Fire+Steam": { name:"Geyser", emoji:"💦", lore:"The earth expressing itself violently" },
  "Lava+Water": { name:"Obsidian", emoji:"🪨", lore:"Volcanic fury frozen mid-rage" },
  "Earth+Lava": { name:"Volcano", emoji:"🗻", lore:"A mountain with grievances" },
  "Air+Lava": { name:"Cinder", emoji:"✨", lore:"Fire given permission to wander" },
  "Fire+Mud": { name:"Brick", emoji:"🧱", lore:"Earth and fire shaking hands" },
  "Earth+Mud": { name:"Clay", emoji:"🏺", lore:"Earth in its most honest form" },
  "Fire+Rain": { name:"Rainbow", emoji:"🌈", lore:"Light negotiating with water" },
  "Air+Smoke": { name:"Fog", emoji:"🌁", lore:"Air that swallowed itself" },
  "Fire+Wind": { name:"Wildfire", emoji:"🔥", lore:"Freedom that forgot consequences" },
  "Air+Mountain": { name:"Blizzard", emoji:"❄️", lore:"A mountain's breath in winter" },
  "Earth+Wind": { name:"Desert", emoji:"🏜️", lore:"The patience of sand waiting forever" },
  "Mountain+Water": { name:"River", emoji:"🏞️", lore:"Water that found its direction" },
  "Air+Cloud": { name:"Storm", emoji:"⛈️", lore:"The sky's dramatic announcement" },
  "Cloud+Fire": { name:"Lightning", emoji:"⚡", lore:"The sky's most decisive thought" },
  "Earth+Rain": { name:"Forest", emoji:"🌲", lore:"What patience and water create together" },
  "Fire+Mountain": { name:"Magma", emoji:"🔴", lore:"The anger of the deep world" },
  "Ash+Earth": { name:"Soil", emoji:"🌱", lore:"Death composted into possibility" },
  "Obsidian+Fire": { name:"Glass", emoji:"🔮", lore:"Transparency forged in darkness" },
  "Soil+Water": { name:"Life", emoji:"🧬", lore:"The sacred pattern that refuses to stay still" },
  "Ocean+Mountain": { name:"Island", emoji:"🏝️", lore:"Solitude crowned in salt" },
  "Desert+Water": { name:"Oasis", emoji:"🌴", lore:"Hope made liquid" },
  "Lightning+Air": { name:"Thunder", emoji:"🌩️", lore:"Light's announcement, arriving late" },
  "Lightning+Earth": { name:"Crater", emoji:"🔵", lore:"Where power chose to become absence" },
  "Storm+Ocean": { name:"Hurricane", emoji:"🌀", lore:"Water and wind conspiring" },
  "River+Mountain": { name:"Waterfall", emoji:"🌊", lore:"Water's most theatrical gesture" },
  "Clay+Fire": { name:"Pottery", emoji:"🏺", lore:"Earth shaped by human intention" },
  "Fire+Ocean": { name:"Coral", emoji:"🪸", lore:"Life that chose stone as its expression" },
  // Life combinations
  "Air+Life": { name:"Song", emoji:"🎵", lore:"Breath given shape by longing" },
  "Earth+Life": { name:"Tree", emoji:"🌳", lore:"The slow ambition of roots" },
  "Fire+Life": { name:"Consciousness", emoji:"🧠", lore:"Awareness that burned its way into being" },
  "Water+Life": { name:"Fish", emoji:"🐟", lore:"Life in its most fluid interpretation" },
  "Life+Life": { name:"Evolution", emoji:"🧬", lore:"Error used as the engine of progress" },
  // Time combinations
  "Earth+Time": { name:"History", emoji:"📜", lore:"Stone that learned to remember" },
  "Fire+Time": { name:"Entropy", emoji:"🌀", lore:"The slow unwinding of order" },
  "Water+Time": { name:"Memory", emoji:"💭", lore:"What remains when the current changes" },
  "Air+Time": { name:"Silence", emoji:"🌙", lore:"The space between moments" },
  "Life+Time": { name:"Mortality", emoji:"⏳", lore:"The price of being temporary" },
  "Void+Time": { name:"Eternity", emoji:"∞", lore:"Absence without end" },
  "Crystal+Time": { name:"Fossil", emoji:"🦕", lore:"Time preserved in mineral patience" },
  "Consciousness+Time": { name:"Wisdom", emoji:"🦉", lore:"Understanding that survived its own making" },
  // Void combinations
  "Void+Fire": { name:"Dark Star", emoji:"⭐", lore:"Light pulled back before it could speak" },
  "Void+Water": { name:"Abyss", emoji:"🕳️", lore:"Depth without a floor" },
  "Void+Earth": { name:"Vacuum", emoji:"⚫", lore:"Space insisting on its own emptiness" },
  "Void+Air": { name:"Stillness", emoji:"🌙", lore:"Air that forgot how to move" },
  "Void+Life": { name:"Nihil", emoji:"🖤", lore:"The conclusion that questions its own logic" },
  "Void+Energy": { name:"Singularity", emoji:"⚫", lore:"Where laws surrender to infinity" },
  "Void+Consciousness": { name:"Enlightenment", emoji:"☀️", lore:"The moment emptiness becomes clarity" },
  "Void+Void": { name:"Paradox", emoji:"♾️", lore:"Nothing containing everything" },
  // Energy combinations
  "Energy+Fire": { name:"Plasma", emoji:"⚡", lore:"Matter at its most excited state" },
  "Energy+Water": { name:"Electrolysis", emoji:"🔋", lore:"Water split by conviction" },
  "Energy+Earth": { name:"Earthquake", emoji:"🫨", lore:"The ground expressing opinion" },
  "Energy+Air": { name:"Sonic Boom", emoji:"💥", lore:"Sound breaking its own barrier" },
  "Energy+Life": { name:"Soul", emoji:"✨", lore:"The spark that insists on continuing" },
  "Energy+Crystal": { name:"Laser", emoji:"🔆", lore:"Light made to agree with itself" },
  "Energy+Time": { name:"Frequency", emoji:"📡", lore:"Vibration given direction through duration" },
  "Energy+Energy": { name:"Radiation", emoji:"☢️", lore:"Energy that escapes in all directions" },
  // Entropy combinations
  "Entropy+Fire": { name:"Supernova", emoji:"💫", lore:"A star's final, brightest argument" },
  "Entropy+Life": { name:"Decay", emoji:"🍂", lore:"Life returning its borrowed atoms" },
  "Entropy+Crystal": { name:"Fracture", emoji:"💎", lore:"Perfection negotiating with time" },
  "Entropy+Energy": { name:"Heat Death", emoji:"🌌", lore:"The universe reaching cold agreement" },
  "Entropy+Entropy": { name:"Chaos", emoji:"🌀", lore:"The default state beneath all structure" },
  // Crystal combinations
  "Crystal+Water": { name:"Ice", emoji:"🧊", lore:"Water that decided to stay" },
  "Crystal+Fire": { name:"Prism", emoji:"🔮", lore:"Light divided into its honest parts" },
  "Crystal+Air": { name:"Snowflake", emoji:"❄️", lore:"Geometry negotiating with cold" },
  "Crystal+Earth": { name:"Gem", emoji:"💎", lore:"Pressure applied long enough" },
  "Crystal+Life": { name:"Shell", emoji:"🐚", lore:"Life choosing mineral architecture" },
  "Crystal+Lightning": { name:"Quartz", emoji:"🔮", lore:"Stone that remembers electricity" },
  "Crystal+Crystal": { name:"Diamond", emoji:"💎", lore:"Clarity achieved through immense force" },
  // Dark Matter combinations
  "Dark Matter+Fire": { name:"Nebula", emoji:"🌌", lore:"Stellar nurseries in the invisible dark" },
  "Dark Matter+Life": { name:"Cosmic Horror", emoji:"🌑", lore:"Life that shouldn't exist, aware of it" },
  "Dark Matter+Energy": { name:"Galaxy", emoji:"🌌", lore:"Matter's grandest collaboration" },
  "Dark Matter+Time": { name:"Black Hole", emoji:"⚫", lore:"Gravity winning every argument" },
  "Dark Matter+Consciousness": { name:"Dread", emoji:"😱", lore:"Awareness meeting what it cannot know" },
  "Dark Matter+Dark Matter": { name:"Void", emoji:"🕳️", lore:"The absence that contains everything" },
  // Consciousness combinations
  "Consciousness+Fire": { name:"Passion", emoji:"❤️‍🔥", lore:"Awareness that found something to burn for" },
  "Consciousness+Water": { name:"Emotion", emoji:"💧", lore:"The tide that lives inside" },
  "Consciousness+Earth": { name:"Philosophy", emoji:"📚", lore:"Thought grounded in questions" },
  "Consciousness+Air": { name:"Thought", emoji:"💭", lore:"Awareness made weightless" },
  "Consciousness+Life": { name:"Self", emoji:"🪞", lore:"The loop that knows it is looping" },
  "Consciousness+Crystal": { name:"Clarity", emoji:"✨", lore:"Mind purified of its own noise" },
  "Consciousness+Consciousness": { name:"Empathy", emoji:"💗", lore:"Awareness discovering it is not alone" },
  // Philosophy combinations
  "Philosophy+Fire": { name:"Enlightenment", emoji:"☀️", lore:"Ideas that cannot be unthought" },
  "Philosophy+Water": { name:"Perspective", emoji:"👁️", lore:"Truth seen from a different shore" },
  "Philosophy+Life": { name:"Ethics", emoji:"⚖️", lore:"The question applied to action" },
  "Philosophy+Void": { name:"Existentialism", emoji:"🌀", lore:"Meaning found in its own absence" },
  "Philosophy+Time": { name:"Metaphysics", emoji:"∞", lore:"Questions that outlive their answers" },
  "Philosophy+Energy": { name:"Mathematics", emoji:"📐", lore:"Pattern discovered, not invented" },
  // Emotion and thought
  "Emotion+Fire": { name:"Love", emoji:"❤️", lore:"The willingness to be transformed" },
  "Emotion+Water": { name:"Grief", emoji:"🌧️", lore:"Love with nowhere left to go" },
  "Emotion+Air": { name:"Longing", emoji:"🌬️", lore:"Desire shaped like the absent" },
  "Emotion+Earth": { name:"Attachment", emoji:"🔗", lore:"Feeling that chose to stay" },
  "Emotion+Void": { name:"Yearning", emoji:"💙", lore:"Desire with no object" },
  "Emotion+Time": { name:"Nostalgia", emoji:"🌅", lore:"Love that outlived its moment" },
  "Thought+Fire": { name:"Inspiration", emoji:"💡", lore:"An idea that chose the wrong moment" },
  "Thought+Water": { name:"Dream", emoji:"🌙", lore:"Mind swimming without a destination" },
  "Thought+Earth": { name:"Knowledge", emoji:"📚", lore:"Experience that refused to dissolve" },
  "Thought+Void": { name:"Meditation", emoji:"🧘", lore:"Thinking about not thinking" },
  "Thought+Life": { name:"Language", emoji:"🗣️", lore:"Thought that learned to travel" },
  // Soul combinations
  "Soul+Fire": { name:"Will", emoji:"💪", lore:"The part of you that refuses to stop" },
  "Soul+Water": { name:"Compassion", emoji:"💗", lore:"The self dissolving into another" },
  "Soul+Void": { name:"Ghost", emoji:"👻", lore:"Presence that forgot how to leave" },
  "Soul+Time": { name:"Karma", emoji:"☯️", lore:"Action echoing through what comes next" },
  "Soul+Crystal": { name:"Virtue", emoji:"⭐", lore:"Character compressed into habit" },
  "Soul+Earth": { name:"Humanity", emoji:"🧑", lore:"Spirit wearing its temporary house" },
  // Advanced conceptual
  "Love+Time": { name:"Devotion", emoji:"💛", lore:"Affection that survived the test of duration" },
  "Love+Void": { name:"Sacrifice", emoji:"💙", lore:"Giving up something real for something greater" },
  "Grief+Time": { name:"Acceptance", emoji:"🌱", lore:"Pain that learned the shape of peace" },
  "Dream+Life": { name:"Hope", emoji:"🌅", lore:"The future lived in advance" },
  "Hope+Time": { name:"Patience", emoji:"⏰", lore:"Certainty that tomorrow exists" },
  "Knowledge+Fire": { name:"Invention", emoji:"⚙️", lore:"Understanding applied to the possible" },
  "Knowledge+Life": { name:"Science", emoji:"🔬", lore:"Curiosity given a method" },
  "Language+Life": { name:"Story", emoji:"📖", lore:"Experience given a shape others can carry" },
  "Ethics+Power": { name:"Justice", emoji:"⚖️", lore:"Strength that chose restraint" },
  "Mathematics+Life": { name:"Code", emoji:"💻", lore:"Logic given the gift of recursion" },
  "Code+Life": { name:"Intelligence", emoji:"🤖", lore:"Pattern that learned to surprise its maker" },
  "Intelligence+Consciousness": { name:"Sentience", emoji:"👁️", lore:"Awareness that passed its own Turing test" },
  "Sentience+Void": { name:"Singularity", emoji:"⚫", lore:"When mind consumes the concept of limit" },
  "Wisdom+Time": { name:"Legacy", emoji:"📜", lore:"Understanding that survived its teacher" },
  "Clarity+Void": { name:"Nirvana", emoji:"☮️", lore:"Peace achieved through perfect dissolution" },
  "Supernova+Void": { name:"Neutron Star", emoji:"⭐", lore:"Collapsed grandeur still spinning" },
  "Galaxy+Life": { name:"Civilization", emoji:"🏛️", lore:"Stars that learned to write their own names" },
  "Evolution+Consciousness": { name:"Civilization", emoji:"🏛️", lore:"Awareness organized at cosmic scale" },
  "Enlightenment+Void": { name:"Transcendence", emoji:"🌟", lore:"Existence exceeding its own framework" },
  "Passion+Thought": { name:"Art", emoji:"🎨", lore:"Feeling given a form that outlasts feeling" },
  "Art+Time": { name:"Beauty", emoji:"🎨", lore:"The permanent made from the passing" },
  "Fog+Lightning": { name:"Static", emoji:"📺", lore:"Signal and noise at war" },
  "Story+Time": { name:"Myth", emoji:"📜", lore:"Truth encoded as something easier to swallow" },
  "Myth+Fire": { name:"Religion", emoji:"🕊️", lore:"The sacred story believed into being" },
  "Science+Void": { name:"Cosmology", emoji:"🌌", lore:"Curiosity applied to the largest questions" },
  "Power+Void": { name:"Silence", emoji:"🤫", lore:"Authority exercised by withholding" },
  "Ice+Fire": { name:"Meltwater", emoji:"💧", lore:"Winter admitting defeat to spring" },
  "Ice+Life": { name:"Preservation", emoji:"🧊", lore:"Time held in suspension" },
  "Plasma+Life": { name:"Mutation", emoji:"🧬", lore:"Fire rewriting the instructions" },
  "Radiation+Life": { name:"Mutation", emoji:"🧬", lore:"Energy leaving its mark on the possible" },
  "Black Hole+Light": { name:"Event Horizon", emoji:"⚫", lore:"The last place light is allowed to be" },
  "Neutron Star+Neutron Star": { name:"Gravitational Wave", emoji:"🌊", lore:"Space itself rippling with news" },
  "Civilisation+Time": { name:"Ruins", emoji:"🏛️", lore:"What remains when ambition finishes" },
  "Ruins+Life": { name:"Archaeology", emoji:"🏺", lore:"The living asking the dead what happened" },
};

function seededHash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const FALLBACK_NAMES = [
  "Aether","Nexus","Flux","Resonance","Chimera","Axiom","Lattice","Specter",
  "Manifold","Threshold","Cipher","Praxis","Liminal","Substrate","Vortex","Crucible",
  "Quintessence","Apogee","Catalyst","Ephemera","Zenith","Fulcrum","Meridian","Alchemy",
  "Synthesis","Paradox","Confluence","Recursion","Archetype","Continuum",
];

const FALLBACK_EMOJIS = [
  "✨","⚡","🌀","🔮","💫","🌌","⚗️","🌟","💎","🔆","🌙","☀️","🌊","🔥","💧","⭐",
];

const FALLBACK_LORE = [
  "Something born between two impossible things",
  "The space where definitions break down",
  "A concept the universe made without permission",
  "Neither one nor the other, but both at once",
  "What emerges when opposites stop arguing",
  "The name for the place between categories",
  "An idea that arrived before language did",
  "Formed in the gap between what is and what could be",
  "The child of two things that shouldn't meet",
  "Something that had no name until now",
];

function clientCombine(aName, bName) {
  const key = [aName, bName].sort().join("+");
  if (COMBO_TABLE[key]) return COMBO_TABLE[key];
  const h = seededHash(key);
  return {
    name: FALLBACK_NAMES[h % FALLBACK_NAMES.length],
    emoji: FALLBACK_EMOJIS[(h >>> 4) % FALLBACK_EMOJIS.length],
    lore: FALLBACK_LORE[(h >>> 8) % FALLBACK_LORE.length],
  };
}

export default function ConceptAlchemy({ onBack }) {
  const [disc, setDisc] = useState(() => {
    const m = {};
    BASE_ELEMENTS.forEach(b => { m[b.name] = b; });
    return m;
  });
  const [nodes, setNodes] = useState([]);
  const [conns, setConns] = useState([]);
  const [cam, setCam] = useState({ x: 0, y: 0, z: 1 });
  const [drag, setDrag] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [combining, setCombining] = useState(false);
  const [mergePos, setMergePos] = useState(null);
  const [newDiscName, setNewDiscName] = useState(null);
  const [search, setSearch] = useState("");
  const [cache, setCache] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [comboCount, setComboCount] = useState(0);
  const [infoNode, setInfoNode] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [chainMode, setChainMode] = useState(false);
  const [chainQueue, setChainQueue] = useState([]);
  const [chainRunning, setChainRunning] = useState(false);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questNotif, setQuestNotif] = useState(null);
  const [didChain, setDidChain] = useState(false);
  const [didReverse, setDidReverse] = useState(false);
  const [treeName, setTreeName] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [effects, setEffects] = useState([]);
  const [questOpen, setQuestOpen] = useState(false);
  const canvasRef = useRef(null);
  const nid = useRef(0);

  // --- Persistence ---
  useEffect(() => {
    const p = loadSave();
    if (p) {
      if (p.disc) setDisc(p.disc);
      if (p.cache) setCache(p.cache);
      if (p.cn) setComboCount(p.cn);
      if (p.cq) setCompletedQuests(p.cq);
      if (p.dch) setDidChain(true);
      if (p.drv) setDidReverse(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      writeSave({ disc, cache, cn: comboCount, cq: completedQuests, dch: didChain, drv: didReverse });
    }, 500);
    return () => clearTimeout(t);
  }, [disc, cache, comboCount, completedQuests, didChain, didReverse, loaded]);

  // --- Stars ---
  const stars = useMemo(() => Array.from({ length: 180 }, (_, i) => ({
    x: ((i * 137.508) % 100),
    y: ((i * 97.332) % 100),
    size: (i % 9) * 0.2 + 0.4,
    opacity: (i % 5) * 0.12 + 0.2,
    dur: (i % 6) + 2,
    delay: (i % 6),
  })), []);

  // --- Quests ---
  useEffect(() => {
    const count = Object.keys(disc).length;
    const maxTier = Math.max(0, ...Object.values(disc).map(d => d.tier || 0));
    const newlyDone = QUEST_LIST.filter(q => !completedQuests.includes(q.id)).filter(q => {
      if (q.type === "count") return count >= q.target;
      if (q.type === "tier") return maxTier >= q.target;
      if (q.type === "chain") return didChain;
      if (q.type === "reverse") return didReverse;
      return false;
    });
    if (newlyDone.length > 0) {
      const q = newlyDone[0];
      setCompletedQuests(prev => [...prev, q.id]);
      if (!disc[q.reward.name]) setDisc(prev => ({ ...prev, [q.reward.name]: q.reward }));
      setQuestNotif(q);
      setTimeout(() => setQuestNotif(null), 3500);
    }
  }, [disc, didChain, didReverse]);

  // --- Canvas helpers ---
  const screenToCanvas = useCallback((sx, sy) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (sx - r.left - cam.x) / cam.z, y: (sy - r.top - cam.y) / cam.z };
  }, [cam]);

  const findNodeAt = useCallback((cx, cy, excludeId) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.id === excludeId) continue;
      if (Math.hypot(n.x - cx, n.y - cy) < 45) return n;
    }
    return null;
  }, [nodes]);

  // --- Client-side combination engine (no API needed) ---
  const cacheKey = (a, b) => [a, b].sort().join("+");

  const callAPI = (a, b) => {
    const k = cacheKey(a.name, b.name);
    if (cache[k]) return Promise.resolve(cache[k]);
    return Promise.resolve(clientCombine(a.name, b.name));
  };

  // --- Effects ---
  const fireEffect = (type, ex, ey) => {
    if (!type) return;
    const id = Date.now() + Math.random();
    setEffects(prev => [...prev, { type, x: ex, y: ey, id }]);
    setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), 2500);
  };

  // --- Core combine ---
  const doOneCombine = useCallback(async (nA, nB, skipBanner) => {
    const result = await callAPI(nA, nB);
    const k = cacheKey(nA.name, nB.name);
    const tier = Math.min(Math.max(nA.tier || 0, nB.tier || 0) + 1, 4);
    setCache(prev => ({ ...prev, [k]: { ...result, tier } }));
    setComboCount(prev => prev + 1);
    if (!disc[result.name]) {
      setDisc(prev => ({
        ...prev,
        [result.name]: { name: result.name, emoji: result.emoji, tier, lore: result.lore, recipe: [nA.name, nB.name] },
      }));
      if (!skipBanner) {
        setNewDiscName(result.name);
        setTimeout(() => setNewDiscName(null), 2800);
      }
    }
    const reaction = getReaction(result.name);
    if (reaction) {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r) fireEffect(reaction, r.width / 2, r.height / 2);
    }
    return { name: result.name, emoji: result.emoji, tier, lore: result.lore };
  }, [cache, disc]);

  const handleCombine = useCallback(async (nA, nB) => {
    if (combining) return;
    setCombining(true);
    setHoverTarget(null);
    setMergePos({ ax: nA.x, ay: nA.y, bx: nB.x, by: nB.y });
    try {
      const r = await doOneCombine(nA, nB, false);
      setMergePos(null);
      const newId = nid.current++;
      setNodes(prev => [...prev, { id: newId, name: r.name, emoji: r.emoji, x: (nA.x + nB.x) / 2, y: (nA.y + nB.y) / 2, tier: r.tier, lore: r.lore, fresh: true }]);
      setConns(prev => [...prev, { from: nA.id, to: newId }, { from: nB.id, to: newId }]);
      setTimeout(() => setNodes(prev => prev.map(n => n.id === newId ? { ...n, fresh: false } : n)), 800);
    } catch (err) {
      console.error(err);
      setMergePos(null);
    }
    setCombining(false);
  }, [combining, doOneCombine]);

  // --- Chain reactions ---
  const runChain = useCallback(async () => {
    if (chainQueue.length < 3 || chainRunning) return;
    setChainRunning(true);
    setChainMode(false);
    const r = canvasRef.current?.getBoundingClientRect();
    const cx = r ? (r.width / 2 - cam.x) / cam.z : 0;
    const cy = r ? (r.height / 2 - cam.y) / cam.z : 0;
    let current = chainQueue[0];
    let prevId = nid.current++;
    setNodes(prev => [...prev, { id: prevId, name: current.name, emoji: current.emoji, x: cx - 200, y: cy, tier: current.tier || 0, lore: current.lore, fresh: true }]);
    for (let i = 1; i < chainQueue.length; i++) {
      const next = chainQueue[i];
      const nextId = nid.current++;
      const xOff = cx - 200 + i * 130;
      setNodes(prev => [...prev, { id: nextId, name: next.name, emoji: next.emoji, x: xOff, y: cy - 70, tier: next.tier || 0, lore: next.lore, fresh: true }]);
      await new Promise(resolve => setTimeout(resolve, 700));
      setMergePos({ ax: xOff - 65, ay: cy, bx: xOff, by: cy - 70 });
      try {
        const res = await doOneCombine(current, next, i < chainQueue.length - 1);
        setMergePos(null);
        const resId = nid.current++;
        setNodes(prev => [...prev, { id: resId, name: res.name, emoji: res.emoji, x: xOff + 65, y: cy, tier: res.tier, lore: res.lore, fresh: true }]);
        setConns(prev => [...prev, { from: prevId, to: resId }, { from: nextId, to: resId }]);
        current = res;
        prevId = resId;
        if (i === chainQueue.length - 1) {
          setNewDiscName(res.name);
          setTimeout(() => setNewDiscName(null), 2800);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (err) {
        console.error(err);
        setMergePos(null);
        break;
      }
    }
    setChainQueue([]);
    setChainRunning(false);
    setDidChain(true);
  }, [chainQueue, chainRunning, cam, doOneCombine]);

  // --- Reverse alchemy ---
  const reverseAlchemy = useCallback((elem) => {
    const d = disc[elem.name];
    if (!d?.recipe) return;
    const dA = disc[d.recipe[0]];
    const dB = disc[d.recipe[1]];
    if (!dA || !dB) return;
    const r = canvasRef.current?.getBoundingClientRect();
    const cx = r ? (r.width / 2 - cam.x) / cam.z : 0;
    const cy = r ? (r.height / 2 - cam.y) / cam.z : 0;
    const idA = nid.current++;
    const idB = nid.current++;
    setNodes(prev => [
      ...prev,
      { id: idA, name: dA.name, emoji: dA.emoji, x: cx - 70, y: cy, tier: dA.tier || 0, lore: dA.lore, fresh: true },
      { id: idB, name: dB.name, emoji: dB.emoji, x: cx + 70, y: cy, tier: dB.tier || 0, lore: dB.lore, fresh: true },
    ]);
    setDidReverse(true);
    setInfoNode(null);
    const rr = canvasRef.current?.getBoundingClientRect();
    if (rr) fireEffect("frost", rr.width / 2, rr.height / 2);
  }, [disc, cam]);

  // --- Mouse handlers ---
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const cp = screenToCanvas(e.clientX, e.clientY);
    const hit = findNodeAt(cp.x, cp.y, -1);
    if (hit) {
      if (chainMode) {
        setChainQueue(prev => [...prev, { name: hit.name, emoji: hit.emoji, tier: hit.tier || 0, lore: hit.lore }]);
        return;
      }
      setDrag({ type: "node", id: hit.id, sx: e.clientX, sy: e.clientY, ox: hit.x, oy: hit.y });
    } else {
      setDrag({ type: "pan", sx: e.clientX, sy: e.clientY, ocx: cam.x, ocy: cam.y });
    }
    setInfoNode(null);
  }, [screenToCanvas, findNodeAt, cam, chainMode]);

  const handleMouseMove = useCallback((e) => {
    if (!drag) return;
    if (drag.type === "pan") {
      setCam(prev => ({ ...prev, x: drag.ocx + (e.clientX - drag.sx), y: drag.ocy + (e.clientY - drag.sy) }));
    } else if (drag.type === "node") {
      const nx = drag.ox + (e.clientX - drag.sx) / cam.z;
      const ny = drag.oy + (e.clientY - drag.sy) / cam.z;
      setNodes(prev => prev.map(n => n.id === drag.id ? { ...n, x: nx, y: ny } : n));
      const t = findNodeAt(nx, ny, drag.id);
      setHoverTarget(t ? t.id : null);
    }
  }, [drag, cam, findNodeAt]);

  const handleMouseUp = useCallback((e) => {
    if (drag?.type === "node" && hoverTarget !== null) {
      const nA = nodes.find(n => n.id === drag.id);
      const nB = nodes.find(n => n.id === hoverTarget);
      if (nA && nB) handleCombine(nA, nB);
    }
    if (drag?.type === "node" && Math.abs(e.clientX - drag.sx) < 4 && Math.abs(e.clientY - drag.sy) < 4) {
      const node = nodes.find(n => n.id === drag.id);
      if (node) setInfoNode(node);
    }
    setDrag(null);
    setHoverTarget(null);
  }, [drag, hoverTarget, nodes, handleCombine]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setCam(prev => {
      const nz = Math.max(0.2, Math.min(3, prev.z * factor));
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return { ...prev, z: nz };
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      return { x: mx - (mx - prev.x) * (nz / prev.z), y: my - (my - prev.y) * (nz / prev.z), z: nz };
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (el) el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el?.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // --- Add / remove ---
  const addToCanvas = (elem) => {
    if (chainMode) {
      setChainQueue(prev => [...prev, { name: elem.name, emoji: elem.emoji, tier: elem.tier || 0, lore: elem.lore }]);
      return;
    }
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    // deterministic offset based on element name to avoid hydration issues
    const seed = elem.name.charCodeAt(0) + (elem.name.charCodeAt(1) || 0);
    const cx = (r.width / 2 - cam.x) / cam.z + ((seed % 120) - 60);
    const cy = (r.height / 2 - cam.y) / cam.z + (((seed * 7) % 120) - 60);
    const id = nid.current++;
    const d = disc[elem.name] || elem;
    setNodes(prev => [...prev, { id, name: d.name, emoji: d.emoji, x: cx, y: cy, tier: d.tier || 0, lore: d.lore, fresh: true }]);
    setTimeout(() => setNodes(prev => prev.map(n => n.id === id ? { ...n, fresh: false } : n)), 600);
  };

  const removeNode = (nodeId) => {
    setNodes(p => p.filter(n => n.id !== nodeId));
    setConns(p => p.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (infoNode?.id === nodeId) setInfoNode(null);
  };

  // --- Derived state ---
  const discList = Object.values(disc);
  const filtered = discList.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => (b.tier || 0) - (a.tier || 0));

  const infoTier = infoNode ? Math.min(infoNode.tier || 0, 4) : 0;
  const infoColor = TIER_COLORS[infoTier];
  const infoDisc = infoNode ? disc[infoNode.name] : null;

  const newDiscData = newDiscName ? disc[newDiscName] : null;
  const newDiscTier = newDiscData ? Math.min(newDiscData.tier || 0, 4) : 0;
  const newDiscColor = TIER_COLORS[newDiscTier];

  const treeData = treeName ? buildAncestry(treeName, disc, 0) : null;
  const treeDepth = treeData ? getTreeDepth(treeData) : 0;
  const treeW = Math.max(600, Math.pow(2, treeDepth) * 90);
  const treeH = (treeDepth + 1) * 80 + 80;

  const mergeScreen = mergePos ? {
    x1: mergePos.ax * cam.z + cam.x, y1: mergePos.ay * cam.z + cam.y,
    x2: mergePos.bx * cam.z + cam.x, y2: mergePos.by * cam.z + cam.y,
  } : null;
  const mAngle = mergeScreen ? Math.atan2(mergeScreen.y2 - mergeScreen.y1, mergeScreen.x2 - mergeScreen.x1) * 180 / Math.PI : 0;
  const mDist = mergeScreen ? Math.hypot(mergeScreen.x2 - mergeScreen.x1, mergeScreen.y2 - mergeScreen.y1) : 0;
  const mMidX = mergeScreen ? (mergeScreen.x1 + mergeScreen.x2) / 2 : 0;
  const mMidY = mergeScreen ? (mergeScreen.y1 + mergeScreen.y2) / 2 : 0;

  // --- Constellation map data ---
  const mapData = useMemo(() => {
    const els = Object.values(disc);
    const byTier = [[], [], [], [], []];
    els.forEach(e => byTier[Math.min(e.tier || 0, 4)].push(e));
    const pos = {};
    const radii = [0, 120, 220, 320, 420];
    byTier.forEach((tierEls, ti) => {
      tierEls.forEach((el, i) => {
        const angle = tierEls.length === 1 ? -Math.PI / 2 : (i / tierEls.length) * Math.PI * 2 - Math.PI / 2;
        const r = ti === 0 ? 0 : radii[ti];
        const spread = ti === 0 ? (i - (tierEls.length - 1) / 2) * 55 : 0;
        pos[el.name] = { x: 500 + Math.cos(angle) * r + spread, y: 400 + Math.sin(angle) * r, tier: el.tier || 0, emoji: el.emoji };
      });
    });
    const links = [];
    els.forEach(el => {
      if (el.recipe && pos[el.recipe[0]] && pos[el.name]) {
        links.push({ x1: pos[el.recipe[0]].x, y1: pos[el.recipe[0]].y, x2: pos[el.name].x, y2: pos[el.name].y, tier: el.tier || 0 });
      }
      if (el.recipe && pos[el.recipe[1]] && pos[el.name]) {
        links.push({ x1: pos[el.recipe[1]].x, y1: pos[el.recipe[1]].y, x2: pos[el.name].x, y2: pos[el.name].y, tier: el.tier || 0 });
      }
    });
    return { pos, links };
  }, [disc]);

  /* ═══════════ RENDER ═══════════ */
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", position: "relative", background: "#04030a", fontFamily: "'Cormorant Garamond', serif" }}>
      <style>{CSS}</style>

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 80% at 20% 50%,rgba(12,8,40,0.9) 0%,transparent 70%),radial-gradient(ellipse 100% 100% at 80% 20%,rgba(25,10,50,0.6) 0%,transparent 60%),#04030a" }} />
        <div style={{ position: "absolute", width: 600, height: 600, top: "10%", left: "5%", borderRadius: "50%", background: "radial-gradient(circle,rgba(100,40,180,0.06) 0%,transparent 70%)", filter: "blur(40px)" }} />
        {stars.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x + "%", top: s.y + "%", width: s.size, height: s.size, borderRadius: "50%", background: "rgba(200,210,240," + s.opacity + ")", "--tw-o": String(s.opacity), animation: "twinkle " + s.dur + "s ease-in-out " + s.delay + "s infinite" }} />
        ))}
      </div>

      {/* Visual effects */}
      {effects.map(ef => {
        const colors = ef.type === "explosion" ? ["#ff6b35","#ffb347","#ff4444"] : ef.type === "frost" ? ["#88ddff","#aaeeff"] : ef.type === "aurora" ? ["#50ffb4","#50c8ff"] : ["#fff","#ffdd57","#ff6b9d"];
        return (
          <div key={ef.id} style={{ position: "absolute", left: ef.x, top: ef.y, zIndex: 200, pointerEvents: "none", transform: "translate(-50%,-50%)" }}>
            {ef.type === "aurora" && <div style={{ width: 400, height: 80, background: "linear-gradient(90deg,transparent,rgba(80,255,180,0.3),rgba(80,200,255,0.3),transparent)", borderRadius: 40, animation: "aWave 2s ease-in-out forwards", filter: "blur(8px)" }} />}
            {ef.type === "frost" && <div style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(100,200,255,0.4)", animation: "fSpread 1.5s ease-out forwards" }} />}
            {ef.type === "supernova" && <div style={{ width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.8),transparent)", animation: "snFlash 1.5s ease-out forwards", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />}
            {Array.from({ length: 16 }).map((_, j) => {
              const a = (j / 16) * Math.PI * 2;
              const d = 60 + (j * 7) % 60;
              return <div key={j} style={{ position: "absolute", width: 5, height: 5, borderRadius: "50%", background: colors[j % colors.length], "--bx": (Math.cos(a) * d) + "px", "--by": (Math.sin(a) * d) + "px", animation: "ePart 0.8s ease-out " + (j * 0.02) + "s forwards", opacity: 0 }} />;
            })}
          </div>
        );
      })}

      {/* Merge beam */}
      {mergeScreen && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 90 }}>
          <div style={{ position: "absolute", left: mergeScreen.x1, top: mergeScreen.y1, width: mDist, height: 3, transformOrigin: "0 50%", transform: "rotate(" + mAngle + "deg)", background: "linear-gradient(90deg,rgba(140,160,200,0.5),rgba(200,180,255,0.8),rgba(140,160,200,0.5))", borderRadius: 4, boxShadow: "0 0 12px rgba(180,160,255,0.4)", animation: "beamPulse 0.8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", left: mMidX - 25, top: mMidY - 25, width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle,rgba(200,180,255,0.4) 0%,transparent 70%)", animation: "mergeGlow 0.6s ease-in-out infinite", boxShadow: "0 0 40px rgba(180,160,255,0.3)" }} />
          <div style={{ position: "absolute", left: mMidX - 18, top: mMidY - 18, width: 36, height: 36, borderRadius: "50%", border: "1.5px solid rgba(200,180,255,0.3)", animation: "orbSpin 1.5s linear infinite" }} />
        </div>
      )}

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, zIndex: 50, padding: "6px 16px", borderRadius: 20, background: "rgba(8,6,18,0.8)", border: "1px solid rgba(140,160,200,0.15)", color: "#8090b0", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontSize: 13, backdropFilter: "blur(8px)" }}>
          ← Back
        </button>
      )}

      {/* Canvas */}
      <div ref={canvasRef} style={{ position: "absolute", inset: 0, cursor: drag?.type === "pan" ? "grabbing" : chainMode ? "cell" : "crosshair", zIndex: 1 }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setDrag(null); setHoverTarget(null); }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.z + ")" }}>
          <svg style={{ position: "absolute", left: -5000, top: -5000, width: 10000, height: 10000, pointerEvents: "none", overflow: "visible" }}>
            {conns.map((c, i) => {
              const f = nodes.find(n => n.id === c.from);
              const t = nodes.find(n => n.id === c.to);
              if (!f || !t) return null;
              const tc = TIER_COLORS[Math.min(t.tier || 0, 4)];
              return (
                <g key={i} style={{ animation: "lineIn 0.8s" }}>
                  <line x1={f.x + 5000} y1={f.y + 5000} x2={t.x + 5000} y2={t.y + 5000} stroke={"rgba(" + tc.glow + ",0.12)"} strokeWidth={2} />
                  <line x1={f.x + 5000} y1={f.y + 5000} x2={t.x + 5000} y2={t.y + 5000} stroke={"rgba(" + tc.glow + ",0.35)"} strokeWidth={0.5} strokeDasharray="4 6" />
                  <circle cx={(f.x + t.x) / 2 + 5000} cy={(f.y + t.y) / 2 + 5000} r={2} fill={"rgba(" + tc.glow + ",0.4)"} />
                </g>
              );
            })}
          </svg>
          {nodes.map(node => {
            const ti = Math.min(node.tier || 0, 4);
            const tc = TIER_COLORS[ti];
            const isH = hoverTarget === node.id;
            const isD = drag?.type === "node" && drag.id === node.id;
            return (
              <div key={node.id} style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", cursor: isD ? "grabbing" : "grab", userSelect: "none", transform: "translate(-50%,-50%)", left: node.x, top: node.y, zIndex: isD ? 100 : 10, animation: node.fresh ? "nodeAppear 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: "radial-gradient(circle at 35% 35%,rgba(255,255,255,0.06),rgba(0,0,0,0.4))", border: "1.5px solid rgba(" + tc.glow + ",0.4)", boxShadow: "0 0 12px rgba(" + tc.glow + ",0.25),0 0 30px rgba(" + tc.glow + ",0.25),inset 0 0 12px rgba(0,0,0,0.5)", animation: isH ? "hoverPulse 0.8s ease-in-out infinite" : ti >= 4 ? "astralHue 4s linear infinite" : "none", "--glow-c": "rgba(" + tc.glow + ",0.25)", position: "relative" }}>
                  {node.emoji}
                  <div onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "rgba(80,30,30,0.9)", border: "1px solid rgba(180,60,60,0.3)", color: "rgba(220,150,150,0.8)", fontSize: 10, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onMouseDown={e => e.stopPropagation()}>×</div>
                </div>
                <div style={{ marginTop: 6, fontWeight: 600, fontSize: 11, color: tc.main, textShadow: "0 0 8px rgba(" + tc.glow + ",0.25)", letterSpacing: 0.5, textAlign: "center", maxWidth: 90, lineHeight: 1.2 }}>{node.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 8, letterSpacing: 1.5, color: tc.main, opacity: 0.5, marginTop: 2, textTransform: "uppercase" }}>{TIER_NAMES[ti]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HUD */}
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: 20, padding: "8px 24px", borderRadius: 30, background: "rgba(8,6,18,0.7)", border: "1px solid rgba(140,160,200,0.1)", backdropFilter: "blur(12px)" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#c8cde0", letterSpacing: 2 }}>⚗️ CONCEPT ALCHEMY</span>
        <span style={{ width: 1, height: 16, background: "rgba(140,160,200,0.15)" }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 11, color: "rgba(200,210,230,0.5)" }}>{discList.length} discovered</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 11, color: "rgba(200,210,230,0.5)" }}>{comboCount} fused</span>
      </div>

      {/* Sidebar toggle */}
      <button onClick={() => setSidebarOpen(p => !p)} style={{ position: "absolute", top: 56, left: sidebarOpen ? 274 : 16, zIndex: 30, width: 28, height: 28, borderRadius: 7, background: "rgba(8,6,18,0.7)", border: "1px solid rgba(140,160,200,0.15)", color: "#8090b0", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "left 0.3s", backdropFilter: "blur(8px)" }}>{sidebarOpen ? "◂" : "▸"}</button>

      {/* Sidebar */}
      <div style={{ position: "absolute", left: sidebarOpen ? 0 : -280, top: 48, bottom: 0, width: 270, zIndex: 25, display: "flex", flexDirection: "column", background: "rgba(6,4,16,0.85)", borderRight: "1px solid rgba(140,160,200,0.08)", backdropFilter: "blur(16px)", transition: "left 0.3s" }}>
        <div style={{ padding: "16px 16px 8px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", padding: "7px 12px", borderRadius: 16, background: "rgba(20,16,40,0.8)", border: "1px solid rgba(140,160,200,0.1)", color: "#c8cde0", fontFamily: "'Cormorant Garamond', serif", fontSize: 13, outline: "none" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "4px 12px" }}>
          {[4, 3, 2, 1, 0].map(tier => {
            const items = sorted.filter(d => (d.tier || 0) === tier);
            if (!items.length) return null;
            const tc = TIER_COLORS[tier];
            return (
              <div key={tier} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 9, letterSpacing: 1.5, color: tc.main, opacity: 0.6, marginBottom: 4, textTransform: "uppercase", paddingLeft: 4 }}>{"✦ " + TIER_NAMES[tier] + " — " + items.length}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {items.map(el => (
                    <div key={el.name} onClick={() => addToCanvas(el)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 11px", border: "1px solid rgba(" + tc.glow + ",0.12)", background: "rgba(10,8,20,0.6)", borderRadius: 20, color: "#c8cde0", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", userSelect: "none" }}>
                      <span style={{ fontSize: 14 }}>{el.emoji}</span>
                      <span>{el.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 20, padding: "6px 14px", borderRadius: 22, background: "rgba(8,6,18,0.7)", border: "1px solid rgba(140,160,200,0.08)", backdropFilter: "blur(12px)", alignItems: "center" }}>
        {BASE_ELEMENTS.map(b => (
          <button key={b.name} onClick={() => addToCanvas(b)} style={{ ...btnStyle, fontSize: 12, padding: "4px 10px" }}>
            <span style={{ fontSize: 13 }}>{b.emoji}</span>{b.name}
          </button>
        ))}
        <span style={{ width: 1, height: 18, background: "rgba(140,160,200,0.12)" }} />
        <button onClick={() => { setChainMode(p => !p); if (chainMode) setChainQueue([]); }} style={{ ...(chainMode ? btnActive : btnStyle), fontSize: 12, padding: "4px 10px" }}>⛓️Chain</button>
        <button onClick={() => setShowMap(true)} style={{ ...btnStyle, fontSize: 12, padding: "4px 10px" }}>🗺️Map</button>
        <button onClick={() => setQuestOpen(p => !p)} style={{ ...btnStyle, fontSize: 12, padding: "4px 10px" }}>📜Quests</button>
      </div>

      {/* Chain queue bar */}
      {chainMode && (
        <div style={{ position: "absolute", bottom: 65, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 18, background: "rgba(8,6,18,0.85)", border: "1px solid rgba(140,160,200,0.15)", backdropFilter: "blur(12px)", animation: "fadeUp 0.3s", maxWidth: "80vw", overflowX: "auto" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 9, color: "rgba(140,160,200,0.4)" }}>CHAIN</span>
          {chainQueue.length === 0 && <span style={{ fontStyle: "italic", fontWeight: 300, fontSize: 12, color: "rgba(140,160,200,0.25)" }}>Click 3+ elements</span>}
          {chainQueue.map((q, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {i > 0 && <span style={{ color: "rgba(140,160,200,0.3)", fontSize: 11 }}>→</span>}
              <span onClick={() => setChainQueue(prev => prev.filter((_, j) => j !== i))} style={{ padding: "3px 8px", borderRadius: 12, background: "rgba(140,160,200,0.08)", border: "1px solid rgba(140,160,200,0.15)", fontSize: 12, color: "#c8cde0", cursor: "pointer" }}>{q.emoji} {q.name}</span>
            </div>
          ))}
          {chainQueue.length >= 3 && <button onClick={runChain} disabled={chainRunning} style={{ ...btnActive, marginLeft: 6, fontSize: 11 }}>{chainRunning ? "..." : "⚡ Fuse"}</button>}
        </div>
      )}

      {/* Quest panel */}
      {questOpen && (
        <div style={{ position: "absolute", top: 56, right: 16, zIndex: 30, width: 260, maxHeight: "65vh", overflow: "auto", padding: 14, borderRadius: 14, background: "rgba(6,4,16,0.9)", border: "1px solid rgba(140,160,200,0.1)", backdropFilter: "blur(16px)", animation: "slideR 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#c8cde0" }}>📜 Quests</span>
            <button onClick={() => setQuestOpen(false)} style={{ background: "none", border: "none", color: "rgba(140,160,200,0.3)", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
          {QUEST_LIST.map(q => {
            const done = completedQuests.includes(q.id);
            const tc = TIER_COLORS[Math.min(q.reward.tier, 4)];
            let prog = 0;
            if (q.type === "count") prog = Math.min(Object.keys(disc).length / q.target, 1);
            else if (q.type === "tier") prog = Math.max(0, ...Object.values(disc).map(d => (d.tier || 0))) >= q.target ? 1 : 0;
            else if (q.type === "chain") prog = didChain ? 1 : 0;
            else if (q.type === "reverse") prog = didReverse ? 1 : 0;
            return (
              <div key={q.id} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 10, background: done ? "rgba(80,200,120,0.06)" : "rgba(10,8,20,0.5)", border: "1px solid " + (done ? "rgba(80,200,120,0.15)" : "rgba(140,160,200,0.06)"), opacity: done ? 0.6 : 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: done ? "rgba(80,200,120,0.7)" : "#c8cde0" }}>{q.title}</div>
                <div style={{ fontWeight: 300, fontSize: 10, color: "rgba(200,210,230,0.4)", marginTop: 2 }}>{q.desc}</div>
                {!done && <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: "rgba(140,160,200,0.08)", overflow: "hidden" }}><div style={{ height: "100%", width: (prog * 100) + "%", background: "rgba(" + tc.glow + ",0.5)", borderRadius: 1, transition: "width 0.5s" }} /></div>}
                <div style={{ marginTop: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(140,160,200,0.25)" }}>{"→ " + q.reward.emoji + " " + q.reward.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info panel */}
      {infoNode && (
        <div style={{ position: "absolute", bottom: 65, right: 16, zIndex: 30, width: 250, padding: "14px 16px", borderRadius: 14, background: "rgba(8,6,18,0.92)", border: "1px solid rgba(" + infoColor.glow + ",0.2)", backdropFilter: "blur(16px)", animation: "fadeUp 0.3s" }}>
          <button onClick={() => setInfoNode(null)} style={{ position: "absolute", top: 6, right: 10, background: "none", border: "none", color: "rgba(140,160,200,0.3)", cursor: "pointer", fontSize: 14 }}>×</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{infoNode.emoji}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#e0e4f0" }}>{infoNode.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: infoColor.main, letterSpacing: 1.5, textTransform: "uppercase" }}>{"✦ " + TIER_NAMES[infoTier]}</div>
            </div>
          </div>
          {infoNode.lore && <div style={{ fontStyle: "italic", fontSize: 13, color: "rgba(200,210,230,0.5)", lineHeight: 1.4, borderTop: "1px solid rgba(140,160,200,0.08)", paddingTop: 8 }}>{'"' + infoNode.lore + '"'}</div>}
          {infoDisc?.recipe && <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(140,160,200,0.3)" }}>{"Recipe: " + infoDisc.recipe[0] + " + " + infoDisc.recipe[1]}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {infoDisc?.recipe && <button onClick={() => reverseAlchemy(infoNode)} style={{ ...btnStyle, fontSize: 10 }}>🔀 Split</button>}
            {infoDisc?.recipe && <button onClick={() => { setTreeName(infoNode.name); setInfoNode(null); }} style={{ ...btnStyle, fontSize: 10 }}>🌳 Tree</button>}
          </div>
        </div>
      )}

      {/* Tree modal */}
      {treeName && treeData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,3,10,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setTreeName(null)}>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#c8cde0", marginBottom: 12 }}>{"🌳 " + treeName}</div>
          <div style={{ overflow: "auto", maxWidth: "90vw", maxHeight: "75vh", padding: 16 }} onClick={e => e.stopPropagation()}>
            <svg width={treeW} height={treeH} viewBox={"0 0 " + treeW + " " + treeH}>
              {renderTreeSVG(treeData, treeW / 2, 45, treeW * 0.8)}
            </svg>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(140,160,200,0.3)", marginTop: 8 }}>Click to close</div>
        </div>
      )}

      {/* Constellation map */}
      {showMap && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,3,10,0.95)", backdropFilter: "blur(8px)" }} onClick={() => setShowMap(false)}>
          <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontWeight: 600, fontSize: 16, color: "#c8cde0", zIndex: 1 }}>🗺️ Constellation Map</div>
          <div style={{ width: "100%", height: "100%", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={1000} height={800} viewBox="0 0 1000 800" onClick={() => setShowMap(false)}>
              {[120, 220, 320, 420].map((r, i) => <circle key={i} cx={500} cy={400} r={r} fill="none" stroke="rgba(140,160,200,0.04)" strokeWidth={1} strokeDasharray="4 8" />)}
              {mapData.links.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={"rgba(" + TIER_COLORS[Math.min(l.tier, 4)].glow + ",0.12)"} strokeWidth={1} />)}
              {Object.entries(mapData.pos).map(([name, p]) => {
                const tc = TIER_COLORS[Math.min(p.tier, 4)];
                return (
                  <g key={name}>
                    <circle cx={p.x} cy={p.y} r={16} fill="rgba(10,8,20,0.8)" stroke={"rgba(" + tc.glow + ",0.4)"} strokeWidth={1.5} />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14}>{p.emoji}</text>
                    <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize={9} fill={tc.main} fontFamily="Cormorant Garamond,serif" fontWeight={600}>{name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Discovery banner */}
      {newDiscName && newDiscData && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 100, animation: "discoverBanner 2.8s ease-out forwards", pointerEvents: "none", textAlign: "center" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 60, height: 60, borderRadius: "50%", border: "2px solid rgba(" + newDiscColor.glow + ",0.4)", animation: "ringGrow 1.2s ease-out forwards" }} />
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const d = 50 + (i * 7) % 50;
            return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 4, borderRadius: "50%", marginLeft: -2, marginTop: -2, background: newDiscColor.main, "--bx": (Math.cos(a) * d) + "px", "--by": (Math.sin(a) * d) + "px", animation: "pBurst " + (0.8 + (i % 5) * 0.08) + "s ease-out forwards", animationDelay: (i * 0.02) + "s", boxShadow: "0 0 6px " + newDiscColor.main }} />;
          })}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 10, letterSpacing: 4, color: "rgba(200,210,230,0.6)", marginBottom: 8 }}>✦ NEW DISCOVERY ✦</div>
          <div style={{ fontWeight: 700, fontSize: 28, color: "#e8ecf4", textShadow: "0 0 30px rgba(" + newDiscColor.glow + ",0.5)" }}>{newDiscData.emoji + " " + newDiscName}</div>
          {newDiscData.lore && <div style={{ fontStyle: "italic", fontWeight: 300, fontSize: 14, color: "rgba(200,210,230,0.4)", marginTop: 6 }}>{newDiscData.lore}</div>}
        </div>
      )}

      {/* Quest completion */}
      {questNotif && (
        <div style={{ position: "fixed", top: "40%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 150, animation: "questDone 3.5s ease-out forwards", pointerEvents: "none", textAlign: "center", padding: "20px 36px", borderRadius: 18, background: "rgba(6,4,16,0.9)", border: "1px solid rgba(80,200,120,0.3)", backdropFilter: "blur(16px)" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: 4, color: "rgba(80,200,120,0.6)", marginBottom: 4 }}>✦ QUEST COMPLETE ✦</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "rgba(80,200,120,0.9)", marginBottom: 6 }}>{questNotif.title}</div>
          <div style={{ fontWeight: 600, fontSize: 18, color: "#e8ecf4" }}>{questNotif.reward.emoji + " " + questNotif.reward.name}</div>
          <div style={{ fontStyle: "italic", fontWeight: 300, fontSize: 12, color: "rgba(200,210,230,0.4)", marginTop: 3 }}>{questNotif.reward.lore}</div>
        </div>
      )}

      {/* Empty state hint */}
      {nodes.length === 0 && !chainMode && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10, textAlign: "center", pointerEvents: "none", animation: "fadeUp 1s" }}>
          <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.3 }}>⚗️</div>
          <div style={{ fontWeight: 600, fontSize: 18, color: "rgba(140,160,200,0.25)", letterSpacing: 2 }}>The Void Awaits</div>
          <div style={{ fontWeight: 300, fontSize: 12, color: "rgba(140,160,200,0.15)", marginTop: 6, lineHeight: 1.5 }}>Add elements below · Drag one onto another to fuse</div>
        </div>
      )}

      {/* Combining indicator */}
      {(combining || chainRunning) && (
        <div style={{ position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 30, padding: "5px 18px", borderRadius: 18, background: "rgba(8,6,18,0.8)", border: "1px solid rgba(140,160,200,0.15)", fontStyle: "italic", fontWeight: 300, fontSize: 12, color: "rgba(200,210,230,0.5)", backdropFilter: "blur(8px)", animation: "fadeUp 0.2s" }}>
          {chainRunning ? "⛓️ Chain reacting..." : "✦ Transmuting..."}
        </div>
      )}
    </div>
  );
}
