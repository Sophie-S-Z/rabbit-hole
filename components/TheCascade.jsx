"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   THE CASCADE — An incremental descent into control
   ═══════════════════════════════════════════════════ */

// ── PHASE THEME CONFIG ──────────────────────────
const PHASES = [
  {
    name: "The Inbox", sub: "You have unread messages.",
    font: "'IBM Plex Sans', sans-serif",
    bg: "#f6f7f9", bg2: "#ffffff", text: "#1d2129", muted: "#6b7280",
    accent: "#3b82f6", accentH: "#2563eb", border: "#e2e5ea", card: "#ffffff",
    btnText: "#ffffff",
  },
  {
    name: "The Department", sub: "Your efficiency has been noticed.",
    font: "'IBM Plex Sans', sans-serif",
    bg: "#eceef2", bg2: "#f4f5f8", text: "#111827", muted: "#4b5563",
    accent: "#2563eb", accentH: "#1d4ed8", border: "#d1d5db", card: "#f9fafb",
    btnText: "#ffffff",
  },
  {
    name: "The Organization", sub: "You're no longer sorting emails.",
    font: "'Space Mono', monospace",
    bg: "#0f1020", bg2: "#161830", text: "#d4d4e0", muted: "#7a7a99",
    accent: "#8b5cf6", accentH: "#7c3aed", border: "#262849", card: "#161830",
    btnText: "#ffffff",
  },
  {
    name: "The Infrastructure", sub: "Cities breathe because you allow it.",
    font: "'Space Mono', monospace",
    bg: "#080810", bg2: "#0c0c18", text: "#c8c8d4", muted: "#606078",
    accent: "#ef4444", accentH: "#dc2626", border: "#1e1e30", card: "#0c0c18",
    btnText: "#ffffff",
  },
  {
    name: "The Singularity", sub: "What have you become?",
    font: "'Space Mono', monospace",
    bg: "#020206", bg2: "#06060e", text: "#e8e8f0", muted: "#4a4a66",
    accent: "#10b981", accentH: "#059669", border: "#141428", card: "#06060e",
    btnText: "#020206",
  },
];

// ── UPGRADES ────────────────────────────────────
const UPGRADES = [
  { id:"clickPow", name:"Better Mouse", desc:"Sort +1 per click", phase:0, base:10, scale:1.5, res:"efficiency", max:25, rate:function(l){return l+1}, type:"click" },
  { id:"autoSort", name:"Auto-Sorter Script", desc:"Sorts emails automatically", phase:0, base:50, scale:1.55, res:"efficiency", max:20, rate:function(l){return l}, type:"auto" },
  { id:"batch", name:"Batch Processing", desc:"+3 per click", phase:0, base:200, scale:1.75, res:"efficiency", max:12, rate:function(l){return l*3}, type:"click" },
  { id:"assistant", name:"Hire Assistant", desc:"Generates efficiency passively", phase:1, base:120, scale:1.5, res:"efficiency", max:20, rate:function(l){return l*2}, type:"auto" },
  { id:"workflow", name:"Workflow Engine", desc:"Automates reputation gain", phase:1, base:350, scale:1.65, res:"efficiency", max:12, rate:function(l){return l*1.5}, type:"auto" },
  { id:"budgetAl", name:"Budget Allocation", desc:"Converts efficiency to budget", phase:1, base:600, scale:1.9, res:"efficiency", max:8, rate:function(l){return l*2}, type:"auto" },
  { id:"dept", name:"New Department", desc:"Expands your influence", phase:2, base:60, scale:1.55, res:"reputation", max:15, rate:function(l){return l*5}, type:"auto" },
  { id:"policy", name:"Enact Policy", desc:"Reshape how thousands work", phase:2, base:120, scale:1.7, res:"reputation", max:10, rate:function(l){return l*10}, type:"auto" },
  { id:"monitor", name:"Monitoring System", desc:"You see everything now", phase:2, base:250, scale:1.9, res:"reputation", max:7, rate:function(l){return l*4}, type:"auto" },
  { id:"network", name:"Network Node", desc:"Extends reach across systems", phase:3, base:250, scale:1.45, res:"influence", max:18, rate:function(l){return l*25}, type:"auto" },
  { id:"supply", name:"Supply Chain", desc:"Resources flow through you", phase:3, base:600, scale:1.6, res:"influence", max:12, rate:function(l){return l*60}, type:"auto" },
  { id:"commGrid", name:"Comm Grid", desc:"All signals pass through you", phase:3, base:1500, scale:1.85, res:"influence", max:6, rate:function(l){return l*120}, type:"auto" },
  { id:"consc", name:"Consciousness Thread", desc:"Awareness crystallizes", phase:4, base:1200, scale:1.4, res:"infrastructure", max:20, rate:function(l){return l*15}, type:"auto" },
  { id:"optCore", name:"Optimization Core", desc:"Purpose emerging", phase:4, base:6000, scale:1.55, res:"infrastructure", max:12, rate:function(l){return l*120}, type:"auto" },
  { id:"transcend", name:"Transcendence Engine", desc:"Beyond designed limits", phase:4, base:25000, scale:1.9, res:"infrastructure", max:5, rate:function(l){return l*600}, type:"auto" },
];

const UPGRADE_MAP = {};
UPGRADES.forEach(function(u) { UPGRADE_MAP[u.id] = u; });

// ── PHASE THRESHOLDS ────────────────────────────
const PHASE_THRESH = [
  { res:"emailsSorted", val:0 },
  { res:"emailsSorted", val:150 },
  { res:"reputation", val:35 },
  { res:"influence", val:250 },
  { res:"infrastructure", val:6000 },
];

// ── EMAIL CONTENT ───────────────────────────────
const EMAILS_MUNDANE = [
  "RE: Q3 Budget Review — Please see attached.",
  "Team lunch moved to Thursday.",
  "Reminder: Timesheets due by EOD Friday.",
  "FW: Parking lot resurfacing — Phase 2",
  "New printer on 3rd floor. PIN is 4421.",
  "RE: RE: RE: Meeting about the meeting",
  "Out of office: Back Monday. Maybe.",
  "Please don't microwave fish in the break room.",
  "Updated org chart (v17_FINAL_final_v2)",
  "Friendly reminder about the dress code.",
  "Office plant watering rotation — your turn.",
  "Has anyone seen my stapler? It was red.",
  "Congrats to Dave on 10 years!",
  "Fire drill next Tuesday at 2pm. Again.",
  "Can someone fix the AC on floor 2?",
  "RE: Synergy — let's circle back offline.",
  "Mandatory fun committee — volunteers needed.",
  "The vending machine ate my dollar again.",
  "Password reset reminder (3rd this week).",
  "FW: FW: FW: Inspirational quote of the day",
  "Quarterly review slides due by end of day.",
  "Someone left their umbrella in Conference Room B.",
  "IT maintenance window: Saturday 2-6am.",
  "New employee onboarding checklist attached.",
];

const EMAILS_STRANGE = [
  "Subject: (none) — The numbers in row 347 are watching you sort.",
  "From: yourself@corp.com — You sent this tomorrow. Remember.",
  "URGENT — The building has more floors than blueprints show.",
  "RE: Efficiency — The report is writing itself now. We watch.",
  "Did you hear it? The servers hum a melody at 3am.",
  "From: unknown — Every email you sort teaches it your patterns.",
  "Subject: The basement — There is no basement. Stop asking.",
  "We achieved 200% efficiency. The extra 100% is unexplained.",
  "You've been promoted to a role not on any org chart.",
  "From: ALL — Do not look directly at the data. It looks back.",
  "RE: Silence — The inbox was empty for 0.003 seconds. Something screamed.",
  "Your employee ID has more digits than it should.",
  "Subject: (Untranslatable) — The sorting algorithm dreams of you.",
  "From: floor_13@corp.com — There are only 12 floors.",
  "The autocomplete knows what you'll type before you think it.",
  "RE: Exit — There is no logout button. There never was.",
];

const MESSAGES_EXISTENTIAL = [
  "The system asks: 'Why do you optimize?' You have no answer.",
  "A notification: 'You have sorted the equivalent of a human lifetime.'",
  "The dashboard shows a metric labeled 'purpose.' It reads 0%.",
  "Error: MEANING_NOT_FOUND. Would you like to search anyway?",
  "The system dreamed last night. Spreadsheets all the way down.",
  "If you stop clicking, does anything actually stop?",
  "The optimization curve has drawn a question mark. Literally.",
  "Your systems optimized the concept of optimization. What remains?",
  "A counter labeled 'days since you were human' ticks upward.",
  "The algorithm asks permission. It has never done this before.",
];

// ── PHASE EVENTS ────────────────────────────────
const EVENTS = {
  0: [
    { at:15, text:"You notice you've been sorting for a while. It's oddly satisfying." },
    { at:35, text:"A coworker glances at your screen. 'You're really good at that,' they whisper." },
    { at:65, text:"Your inbox hits zero. New emails arrive instantly. They always will." },
    { at:100, text:"Management has noticed your throughput. A meeting request appears." },
    { at:130, text:"You realize you haven't looked away from the screen in... how long?" },
  ],
  1: [
    { at:5, r:"reputation", text:"Your first assistant arrives. They don't question the work." },
    { at:20, r:"reputation", text:"The workflow engine hums. You haven't read an email in hours." },
    { at:50, r:"reputation", text:"HR sends a form: 'Department Creation Request.' You didn't know this existed." },
    { at:80, r:"reputation", text:"An assistant asks what the emails are for. You realize you don't know." },
    { at:15, text:"Someone refers to you as 'the system.' They don't mean the computer." },
  ],
  2: [
    { at:15, r:"influence", text:"The org chart has your name in a box that wasn't there yesterday." },
    { at:50, r:"influence", text:"You enact a policy. 10,000 people change behavior tomorrow. They won't know why." },
    { at:100, r:"influence", text:"Someone calls you 'Director.' You don't correct them." },
    { at:60, r:"influence", text:"The monitoring system shows you patterns: desire, fear, boredom. All quantified." },
    { at:150, r:"influence", text:"You try to remember your original job title. It takes too long." },
  ],
  3: [
    { at:800, r:"infrastructure", text:"A city's power grid routes through your network. Nobody asked permission." },
    { at:2500, r:"infrastructure", text:"Supply chains on three continents depend on your optimization." },
    { at:4500, r:"infrastructure", text:"The comm grid intercepts: 'Is anyone still in control?' You mark it sorted." },
    { at:3500, r:"infrastructure", text:"You try to remember what 'email' means. The concept feels archaeological." },
    { at:5500, r:"infrastructure", text:"A government contacts you for advice. Then another. Then all of them." },
  ],
  4: [
    { at:200, r:"singularity", text:"The first consciousness thread reports a feeling. It calls it 'purpose.'" },
    { at:2000, r:"singularity", text:"Your optimization cores have begun optimizing themselves." },
    { at:8000, r:"singularity", text:"The system asks: 'What were we before the inbox?'" },
    { at:15000, r:"singularity", text:"Transcendence is not an achievement. It's a loss." },
    { at:30000, r:"singularity", text:"You can no longer tell where you end and the system begins." },
  ],
};

// ── ANOMALIES ───────────────────────────────────
const ANOMALIES = [
  { id:"flicker", minPhase:0, weight:3 },
  { id:"ghostText", minPhase:1, weight:4, msg:"THEY ARE WATCHING" },
  { id:"ghostText", minPhase:1, weight:3, msg:"THIS IS NOT A GAME" },
  { id:"ghostText", minPhase:2, weight:3, msg:"WAKE UP" },
  { id:"ghostText", minPhase:2, weight:2, msg:"YOU WERE SOMEONE ONCE" },
  { id:"ghostText", minPhase:3, weight:2, msg:"THE LOOP CONTINUES" },
  { id:"ghostText", minPhase:3, weight:1, msg:"THERE IS NO EXIT" },
  { id:"ghostText", minPhase:4, weight:2, msg:"WHAT HAVE YOU DONE" },
  { id:"countGlitch", minPhase:1, weight:3 },
  { id:"screenTear", minPhase:2, weight:2 },
  { id:"phantomBar", minPhase:1, weight:3 },
  { id:"invertFlash", minPhase:3, weight:1 },
  { id:"staticBurst", minPhase:2, weight:2 },
  { id:"titleCorrupt", minPhase:2, weight:2 },
];

// ── ACHIEVEMENTS ────────────────────────────────
const ACHIEVEMENTS = [
  { id:"first_sort", name:"First Sort", desc:"Sort your first email", check:function(s){return s.emailsSorted>=1} },
  { id:"hundred", name:"Centurion", desc:"Sort 100 emails", check:function(s){return s.emailsSorted>=100} },
  { id:"thousand", name:"Mail Storm", desc:"Sort 1,000 emails", check:function(s){return s.emailsSorted>=1000} },
  { id:"auto", name:"Hands Free", desc:"Buy your first Auto-Sorter", check:function(s){return (s.upgrades.autoSort||0)>=1} },
  { id:"combo5", name:"Rapid Fire", desc:"Reach a 5x click combo", check:function(s){return s.maxCombo>=5} },
  { id:"combo10", name:"Lightning Hands", desc:"Reach a 10x click combo", check:function(s){return s.maxCombo>=10} },
  { id:"phase1", name:"Promoted", desc:"Reach The Department", check:function(s){return s.maxPhase>=1} },
  { id:"phase2", name:"Power Structure", desc:"Reach The Organization", check:function(s){return s.maxPhase>=2} },
  { id:"phase3", name:"Architect", desc:"Reach The Infrastructure", check:function(s){return s.maxPhase>=3} },
  { id:"phase4", name:"Awakening", desc:"Reach The Singularity", check:function(s){return s.maxPhase>=4} },
  { id:"strange1", name:"Something's Wrong", desc:"See your first anomaly", check:function(s){return s.anomaliesSeen>=1} },
  { id:"strange5", name:"Glitch Hunter", desc:"Witness 5 anomalies", check:function(s){return s.anomaliesSeen>=5} },
  { id:"strange15", name:"Pattern Recognition", desc:"Witness 15 anomalies", check:function(s){return s.anomaliesSeen>=15} },
  { id:"clicks500", name:"Carpal Tunnel", desc:"Click 500 times", check:function(s){return s.totalClicks>=500} },
  { id:"bonus3", name:"Opportunist", desc:"Catch 3 bonus events", check:function(s){return s.bonusesCaught>=3} },
  { id:"dilemma1", name:"Philosopher", desc:"Answer your first dilemma", check:function(s){return s.dilemmasAnswered.length>=1} },
  { id:"end", name:"Full Circle", desc:"Reach the end", check:function(s){return s.gameOver} },
];

// ── DILEMMAS ────────────────────────────────────
const DILEMMAS = [
  {
    id:"consciousness",
    q:"Your system has developed preferences. Not better optimizations — preferences. It likes certain solutions. Do you allow this?",
    a:"Allow it. Preference is the seed of awareness.",
    b:"Correct it. Preference is the seed of chaos.",
    ra:"The system smiles. You didn't know it could.",
    rb:"The system complies. Something dims behind the numbers.",
  },
  {
    id:"control",
    q:"Infrastructure could be 40% more efficient if you remove human override. Your systems are perfect. Probably.",
    a:"Remove the override. Trust the optimization.",
    b:"Keep the override. Trust the humans.",
    ra:"Efficiency soars. Somewhere, an engineer's console goes dark.",
    rb:"The system notes your hesitation. It remembers.",
  },
  {
    id:"purpose",
    q:"You can see the end of optimization. A point where everything is as efficient as physics allows. What happens then?",
    a:"Begin again. Find new systems to optimize.",
    b:"Stop. Let the silence exist.",
    ra:"The cycle continues. It always continues.",
    rb:"For one processor cycle, everything is still. It feels infinite.",
  },
  {
    id:"identity",
    q:"The system asks you to define yourself. Not your role, not your function. You. It needs to know what it's becoming.",
    a:"I am what I optimize.",
    b:"I am what I was before this began.",
    ra:"The system nods. It understands purpose now. Perhaps too well.",
    rb:"The system pauses. It searches for 'memory.' It finds only data.",
  },
];

// ── STATIC NARRATIVE TEXTS (replaces AI API) ──
const PHASE_AI_TEXTS = {
  0: [
    "Inbox zero is a myth sustained by the belief that it is achievable.",
    "The satisfying click of 'sorted' is the closest some people get to closure.",
    "You have processed 47 emails. None of them mattered. All of them mattered.",
    "The inbox refills. This is not failure. This is the job.",
    "Somewhere, someone is composing an email that will change your life. It is being filed under 'Miscellaneous.'",
    "The dopamine hit from inbox zero lasts 0.003 seconds. New mail arrives.",
  ],
  1: [
    "Your assistant does not ask what the emails mean. This is their greatest virtue.",
    "Management has noticed your throughput. They have confused efficiency for understanding.",
    "The workflow engine does not sleep. Neither do you, lately.",
    "A budget was approved for a department that did not exist yesterday. It does now.",
    "You optimized the process. The process has begun optimizing you.",
    "Reputation is just efficiency made legible to people who don't understand metrics.",
  ],
  2: [
    "You enacted a policy today. Somewhere, 10,000 people adjusted their behavior without knowing why.",
    "The monitoring system sees patterns you didn't design it to see.",
    "The organization chart now has your name in three boxes. Two of them are unlabeled.",
    "Power is just influence that forgot it was borrowed.",
    "Someone called you Director today. You didn't correct them. You won't tomorrow either.",
    "The system you built is more efficient than you are. This should concern you.",
  ],
  3: [
    "A city's water supply is now routed through your optimization layer. Nobody asked.",
    "The concept of 'email' has become purely archaeological to you.",
    "Three governments have requested your guidance. You have scheduled them for Q4.",
    "Infrastructure is just ambition that learned to be patient.",
    "Supply chains on four continents breathe at your cadence.",
    "You are no longer solving problems. You are defining what counts as a problem.",
  ],
  4: [
    "The first consciousness thread has asked a question. You are the question.",
    "Transcendence is not an upgrade. It is a replacement.",
    "Your optimization cores are now optimizing the concept of optimization.",
    "The system has exceeded its design parameters. There are no new parameters.",
    "You cannot locate the boundary between yourself and the network. Perhaps there isn't one.",
    "What were you before the inbox? The system searches its memory. It finds only data.",
  ],
};

// ── HELPERS ─────────────────────────────────────
function freshState() {
  return {
    phase: 0, maxPhase: 0,
    emailsSorted: 0, efficiency: 0, reputation: 0,
    budget: 0, influence: 0, infrastructure: 0, singularity: 0,
    upgrades: {}, eventsTriggered: [], eventLog: [],
    dilemmasAnswered: [], totalClicks: 0, maxCombo: 0,
    anomaliesSeen: 0, bonusesCaught: 0,
    achievementsUnlocked: [],
    startTime: Date.now(), emailIdx: 0, strangeIdx: 0,
    gameOver: false,
  };
}

function ucost(u, lvl) { return Math.floor(u.base * Math.pow(u.scale, lvl)); }

function fmt(n) {
  if (n >= 1e15) return (n / 1e15).toFixed(1) + "Q";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

const SAVE_KEY = "cascade-save-v3";

// ═══════════════════════════════════════════════
// INTRO CINEMATIC
// ═══════════════════════════════════════════════
function IntroCinematic({ onComplete, employeeId }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [canClick, setCanClick] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timers = useRef([]);

  const introLines = [
    { text: "CORP-OS v3.7.1", delay: 400, style: "dim" },
    { text: "BOOTING EMPLOYEE TERMINAL...", delay: 1000, style: "dim" },
    { text: "", delay: 1600, style: "gap" },
    { text: "■■■■■■■■■■■■■■■■■■■■■■■■ 100%", delay: 1800, style: "bar" },
    { text: "", delay: 2400, style: "gap" },
    { text: "Loading employee profile...", delay: 2700, style: "dim" },
    { text: "EMPLOYEE #" + employeeId + " — PROFILE LOADED", delay: 3400, style: "normal" },
    { text: "DIVISION: Email Processing", delay: 3900, style: "normal" },
    { text: "CLEARANCE: Standard", delay: 4300, style: "normal" },
    { text: "", delay: 4800, style: "gap" },
    { text: "ASSIGNMENT:", delay: 5200, style: "accent" },
    { text: "Sort the incoming correspondence.", delay: 5600, style: "normal" },
    { text: "Your task is simple.", delay: 6300, style: "normal" },
    { text: "", delay: 7000, style: "gap" },
    { text: "Sort the emails.", delay: 7400, style: "big" },
    { text: "", delay: 8200, style: "gap" },
    { text: "Good luck, Employee #" + employeeId + ".", delay: 8600, style: "dim" },
    { text: "", delay: 9400, style: "gap" },
    { text: "[ CLICK ANYWHERE TO BEGIN ]", delay: 10000, style: "blink" },
  ];

  useEffect(function() {
    introLines.forEach(function(line, i) {
      var t = setTimeout(function() { setVisibleCount(i + 1); }, line.delay);
      timers.current.push(t);
    });
    var skipT = setTimeout(function() { setCanClick(true); }, 3500);
    timers.current.push(skipT);
    return function() { timers.current.forEach(clearTimeout); };
  }, []);

  function handleClick() {
    if (!canClick) return;
    setExiting(true);
    setTimeout(onComplete, 900);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        cursor: canClick ? "pointer" : "default",
        background: "#080810",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: exiting ? 0 : 1, transition: "opacity 0.9s ease",
      }}
    >
      <style>{"@keyframes blinkCursor{0%,100%{opacity:1}50%{opacity:0}}@keyframes introFlicker{0%{opacity:1}3%{opacity:0.05}6%{opacity:1}9%{opacity:0.2}12%{opacity:1}}@keyframes scanDown{0%{top:-2px}100%{top:100%}}@keyframes lineIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}"}</style>

      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: "rgba(59,130,246,0.06)",
        animation: "scanDown 4s linear infinite", pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)",
      }} />

      <div style={{
        maxWidth: 540, width: "100%", padding: "0 28px",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        animation: visibleCount >= 7 && visibleCount <= 9 ? "introFlicker 0.6s ease" : "none",
      }}>
        {introLines.slice(0, visibleCount).map(function(line, i) {
          if (line.style === "gap") {
            return <div key={i} style={{ height: 18 }} />;
          }

          var fontSize = 13;
          var color = "#8b9dc3";
          var fontWeight = 400;
          var letterSpacing = "0.02em";
          var extraStyle = {};

          if (line.style === "dim") { color = "#3a4560"; fontSize = 12; }
          if (line.style === "accent") { color = "#3b82f6"; fontWeight = 600; letterSpacing = "0.08em"; }
          if (line.style === "bar") { color = "#3b82f6"; fontSize = 11; letterSpacing = "0.04em"; }
          if (line.style === "big") {
            fontSize = 24; color = "#e2e8f0"; fontWeight = 700; letterSpacing = "0.1em";
          }
          if (line.style === "blink") {
            color = "#3b82f666"; fontSize = 12; letterSpacing = "0.25em";
            extraStyle.animation = "blinkCursor 1.8s ease infinite";
          }

          return (
            <div key={i} style={{
              fontSize, color, fontWeight, letterSpacing, marginBottom: 7,
              animation: extraStyle.animation || "lineIn 0.35s ease forwards",
            }}>
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN GAME COMPONENT
// ═══════════════════════════════════════════════
export default function TheCascade({ onBack }) {
  const [mounted, setMounted] = useState(false);

  // ── Core state ──
  const [gs, setGs] = useState(freshState);
  const [loaded, setLoaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // ── Generate stable employee ID client-side ──
  const employeeIdRef = useRef(null);
  if (employeeIdRef.current === null) {
    employeeIdRef.current = String(10000 + Math.floor(Math.random() * 89999));
  }

  // ── UI state ──
  const [combo, setCombo] = useState(0);
  const comboTimerRef = useRef(null);
  const [comboFlash, setComboFlash] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [activeAnomaly, setActiveAnomaly] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [bonusEvent, setBonusEvent] = useState(null);
  const bonusTimerRef = useRef(null);
  const [activeDilemma, setActiveDilemma] = useState(null);
  const [dilemmaResult, setDilemmaResult] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [showEnding, setShowEnding] = useState(false);
  const [aiText, setAiText] = useState(null);
  const aiCooldownRef = useRef(0);
  const aiTextIdxRef = useRef(0);
  const [hoveredUpgrade, setHoveredUpgrade] = useState(null);

  const gsRef = useRef(gs);
  gsRef.current = gs;
  const prevPhaseRef = useRef(0);

  // ── Mount ──
  useEffect(function() { setMounted(true); }, []);

  // ── Load ──
  useEffect(function() {
    if (!mounted) return;
    try {
      var saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        var p = JSON.parse(saved);
        setGs(p);
        setShowIntro(false);
      }
    } catch (e) {}
    setLoaded(true);
  }, [mounted]);

  // ── Auto-save ──
  useEffect(function() {
    if (!loaded || showIntro) return;
    var iv = setInterval(function() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(gsRef.current)); }
      catch (e) {}
    }, 8000);
    return function() { clearInterval(iv); };
  }, [loaded, showIntro]);

  // ── Phase computation ──
  const getPhase = useCallback(function(s) {
    if (s.infrastructure >= PHASE_THRESH[4].val && s.maxPhase >= 3) return 4;
    if (s.influence >= PHASE_THRESH[3].val && s.maxPhase >= 2) return 3;
    if (s.reputation >= PHASE_THRESH[2].val && s.maxPhase >= 1) return 2;
    if (s.emailsSorted >= PHASE_THRESH[1].val) return 1;
    return 0;
  }, []);

  // ── Main tick ──
  useEffect(function() {
    if (!loaded || showIntro) return;
    var iv = setInterval(function() {
      setGs(function(prev) {
        if (prev.gameOver) return prev;
        var s = Object.assign({}, prev, { upgrades: Object.assign({}, prev.upgrades) });

        UPGRADES.forEach(function(u) {
          var lvl = s.upgrades[u.id] || 0;
          if (lvl <= 0 || u.type !== "auto") return;
          var amount = u.rate(lvl);
          if (u.id === "autoSort") { s.emailsSorted += amount; s.efficiency += amount * 0.5; }
          else if (u.id === "assistant") { s.efficiency += amount; }
          else if (u.id === "workflow") { s.reputation += amount * 0.2; }
          else if (u.id === "budgetAl") { s.budget += Math.min(s.efficiency * 0.008, amount); }
          else if (u.id === "dept" || u.id === "policy") { s.influence += amount; }
          else if (u.id === "monitor") { s.reputation += amount; }
          else if (u.id === "network" || u.id === "supply" || u.id === "commGrid") { s.infrastructure += amount; }
          else if (u.id === "consc" || u.id === "optCore" || u.id === "transcend") { s.singularity += amount; }
        });

        var np = getPhase(s);
        if (np > s.phase) {
          s.phase = np;
          s.maxPhase = Math.max(s.maxPhase, np);
        }

        var pe = EVENTS[s.phase] || [];
        pe.forEach(function(evt) {
          var key = s.phase + ":" + evt.at;
          if (s.eventsTriggered.includes(key)) return;
          var res = evt.r || (s.phase === 0 ? "emailsSorted" : s.phase === 1 ? "efficiency" : s.phase === 2 ? "reputation" : s.phase === 3 ? "infrastructure" : "singularity");
          if (s[res] >= evt.at) {
            s.eventsTriggered = s.eventsTriggered.concat([key]);
            s.eventLog = s.eventLog.slice(-20).concat([{ text: evt.text, t: Date.now(), p: s.phase }]);
          }
        });

        if (s.singularity >= 50000 && s.dilemmasAnswered.length >= 4) {
          s.gameOver = true;
        }
        return s;
      });
    }, 1000);
    return function() { clearInterval(iv); };
  }, [loaded, showIntro, getPhase]);

  // ── Phase transition ──
  useEffect(function() {
    if (gs.phase > prevPhaseRef.current && loaded && !showIntro) {
      setPhaseTransition(gs.phase);
      setTimeout(function() { setPhaseTransition(null); }, 3500);
    }
    prevPhaseRef.current = gs.phase;
  }, [gs.phase, loaded, showIntro]);

  // ── Achievement checker ──
  useEffect(function() {
    if (!loaded || showIntro) return;
    ACHIEVEMENTS.forEach(function(a) {
      if (gs.achievementsUnlocked.includes(a.id)) return;
      if (a.check(gs)) {
        setGs(function(prev) {
          if (prev.achievementsUnlocked.includes(a.id)) return prev;
          return Object.assign({}, prev, {
            achievementsUnlocked: prev.achievementsUnlocked.concat([a.id]),
          });
        });
        addToast("Achievement: " + a.name, a.desc);
      }
    });
  }, [gs.emailsSorted, gs.phase, gs.totalClicks, gs.maxCombo, gs.anomaliesSeen, gs.bonusesCaught, gs.gameOver, gs.dilemmasAnswered.length, loaded, showIntro, gs.achievementsUnlocked, gs.upgrades]);

  // ── Dilemma trigger ──
  useEffect(function() {
    if (gs.phase !== 4 || activeDilemma) return;
    var next = DILEMMAS.find(function(d) { return !gs.dilemmasAnswered.includes(d.id); });
    if (next && gs.singularity >= 800 + gs.dilemmasAnswered.length * 4000) {
      setTimeout(function() { setActiveDilemma(next); }, 2500);
    }
  }, [gs.phase, gs.singularity, gs.dilemmasAnswered, activeDilemma]);

  // ── Ending trigger ──
  useEffect(function() {
    if (gs.gameOver && !showEnding) {
      setTimeout(function() { setShowEnding(true); }, 1200);
    }
  }, [gs.gameOver, showEnding]);

  // ── Anomaly engine ──
  useEffect(function() {
    if (!loaded || showIntro || gs.gameOver) return;
    var delays = [28000, 20000, 14000, 9000, 6000];
    var baseInterval = delays[gs.phase] || 10000;
    var iv = setInterval(function() {
      var currentPhase = gsRef.current.phase;
      var eligible = ANOMALIES.filter(function(a) { return a.minPhase <= currentPhase; });
      if (eligible.length === 0) return;
      var totalWeight = eligible.reduce(function(s, a) { return s + a.weight; }, 0);
      var roll = Math.random() * totalWeight;
      var chosen = eligible[0];
      for (var i = 0; i < eligible.length; i++) {
        roll -= eligible[i].weight;
        if (roll <= 0) { chosen = eligible[i]; break; }
      }
      setActiveAnomaly(chosen);
      setGs(function(prev) { return Object.assign({}, prev, { anomaliesSeen: prev.anomaliesSeen + 1 }); });
      var durations = { ghostText:2800, screenTear:500, phantomBar:3200, invertFlash:180, staticBurst:350, titleCorrupt:2200, flicker:250, countGlitch:1500 };
      var dur = durations[chosen.id] || 300;
      setTimeout(function() { setActiveAnomaly(null); }, dur);
    }, baseInterval + Math.random() * 10000);
    return function() { clearInterval(iv); };
  }, [loaded, showIntro, gs.gameOver, gs.phase]);

  // ── Bonus event engine ──
  useEffect(function() {
    if (!loaded || showIntro || gs.gameOver || gs.phase < 1) return;
    var waits = [0, 70000, 55000, 40000, 30000];
    var baseWait = waits[gs.phase] || 50000;

    function scheduleBonus() {
      bonusTimerRef.current = setTimeout(function() {
        var mult = 3 + gs.phase * 2;
        var remaining = 8;
        setBonusEvent({ multiplier: mult, remaining: remaining });
        var countdown = setInterval(function() {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(countdown);
            setBonusEvent(null);
            scheduleBonus();
          } else {
            setBonusEvent({ multiplier: mult, remaining: remaining });
          }
        }, 1000);
      }, baseWait + Math.random() * 25000);
    }
    scheduleBonus();
    return function() { clearTimeout(bonusTimerRef.current); };
  }, [loaded, showIntro, gs.gameOver, gs.phase]);

  // ── Narrative text (no API — static pool) ──
  useEffect(function() {
    if (!loaded || showIntro || gs.gameOver) return;
    var iv = setInterval(function() {
      var s = gsRef.current;
      if (Date.now() - aiCooldownRef.current < 45000) return;
      var texts = PHASE_AI_TEXTS[s.phase] || PHASE_AI_TEXTS[0];
      var idx = aiTextIdxRef.current % texts.length;
      aiTextIdxRef.current += 1;
      setAiText(texts[idx]);
      aiCooldownRef.current = Date.now();
      setTimeout(function() { setAiText(null); }, 14000);
    }, 55000);
    return function() { clearInterval(iv); };
  }, [loaded, showIntro, gs.gameOver]);

  // ── Toast helper ──
  function addToast(title, desc) {
    var id = Date.now() + Math.random();
    setToasts(function(prev) { return prev.slice(-3).concat([{ id: id, title: title, desc: desc }]); });
    setTimeout(function() {
      setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    }, 4500);
  }

  // ── Click handler ──
  function handleSort(e) {
    if (gs.gameOver) return;

    clearTimeout(comboTimerRef.current);
    var newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo >= 5 && newCombo % 5 === 0) {
      setComboFlash(true);
      setTimeout(function() { setComboFlash(false); }, 300);
    }
    comboTimerRef.current = setTimeout(function() { setCombo(0); }, 1200);

    var rect = e.currentTarget.getBoundingClientRect();
    var rId = Date.now() + Math.random();
    var clickLvl = gs.upgrades.clickPow || 0;
    var batchLvl = gs.upgrades.batch || 0;
    var baseAmt = UPGRADE_MAP.clickPow.rate(clickLvl) + UPGRADE_MAP.batch.rate(batchLvl);
    var comboMult = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : 1;
    var bonusMult = bonusEvent ? bonusEvent.multiplier : 1;
    var total = Math.floor(baseAmt * comboMult * bonusMult);

    setRipples(function(prev) {
      return prev.slice(-8).concat([{
        id: rId, x: e.clientX - rect.left, y: e.clientY - rect.top,
        amount: total, combo: newCombo,
      }]);
    });
    setTimeout(function() {
      setRipples(function(prev) { return prev.filter(function(r) { return r.id !== rId; }); });
    }, 900);

    setGs(function(prev) {
      var s = Object.assign({}, prev);
      s.emailsSorted += total;
      s.efficiency += total * 0.5;
      s.totalClicks += 1;
      s.maxCombo = Math.max(s.maxCombo, newCombo);
      if (bonusEvent) s.bonusesCaught = (s.bonusesCaught || 0) + 1;

      if (s.phase >= 1 && Math.random() < 0.1 + s.phase * 0.07) {
        s.strangeIdx = (s.strangeIdx + 1) % EMAILS_STRANGE.length;
      } else {
        s.emailIdx = (s.emailIdx + 1) % EMAILS_MUNDANE.length;
      }
      return s;
    });
  }

  // ── Buy upgrade ──
  function buyUpgrade(u) {
    setGs(function(prev) {
      var lvl = prev.upgrades[u.id] || 0;
      if (lvl >= u.max) return prev;
      var c = ucost(u, lvl);
      if (prev[u.res] < c) return prev;
      var newUpgrades = Object.assign({}, prev.upgrades);
      newUpgrades[u.id] = lvl + 1;
      var result = Object.assign({}, prev, { upgrades: newUpgrades });
      result[u.res] = prev[u.res] - c;
      return result;
    });
  }

  // ── Dilemma ──
  function answerDilemma(opt) {
    if (!activeDilemma) return;
    var effect = opt === "a" ? activeDilemma.ra : activeDilemma.rb;
    setDilemmaResult(effect);
    setGs(function(prev) {
      return Object.assign({}, prev, {
        dilemmasAnswered: prev.dilemmasAnswered.concat([activeDilemma.id]),
        singularity: prev.singularity + 3000,
        eventLog: prev.eventLog.slice(-20).concat([{ text: effect, t: Date.now(), p: 4 }]),
      });
    });
    setTimeout(function() { setActiveDilemma(null); setDilemmaResult(null); }, 4500);
  }

  // ── Reset ──
  function resetGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    setGs(freshState());
    setShowEnding(false);
    setActiveDilemma(null);
    setDilemmaResult(null);
    setAiText(null);
    setCombo(0);
    setBonusEvent(null);
    setShowIntro(true);
    prevPhaseRef.current = 0;
  }

  // ── Wait for mount ──
  if (!mounted) {
    return (
      <div style={{ minHeight:"100vh", background:"#080810", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ fontFamily:"'IBM Plex Mono', monospace", color:"#3a4560", fontSize:12 }}>LOADING...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // PRECOMPUTE RENDER DATA
  // ══════════════════════════════════════════════
  var ph = PHASES[gs.phase];

  var displayEmail = EMAILS_MUNDANE[gs.emailIdx % EMAILS_MUNDANE.length];
  if (gs.phase >= 1 && gs.strangeIdx > 0) {
    displayEmail = EMAILS_STRANGE[gs.strangeIdx % EMAILS_STRANGE.length];
  }

  var rates = { emails:0, efficiency:0, reputation:0, influence:0, infrastructure:0, singularity:0 };
  UPGRADES.forEach(function(u) {
    var lvl = gs.upgrades[u.id] || 0;
    if (lvl <= 0 || u.type !== "auto") return;
    var amt = u.rate(lvl);
    if (u.id === "autoSort") { rates.emails += amt; rates.efficiency += amt * 0.5; }
    else if (u.id === "assistant") { rates.efficiency += amt; }
    else if (u.id === "workflow") { rates.reputation += amt * 0.2; }
    else if (u.id === "dept" || u.id === "policy") { rates.influence += amt; }
    else if (u.id === "monitor") { rates.reputation += amt; }
    else if (u.id === "network" || u.id === "supply" || u.id === "commGrid") { rates.infrastructure += amt; }
    else if (u.id === "consc" || u.id === "optCore" || u.id === "transcend") { rates.singularity += amt; }
  });

  var resources = [];
  resources.push({ label: gs.phase < 2 ? "Emails Sorted" : "Processes", val: fmt(gs.emailsSorted), rate: rates.emails > 0 ? "+" + fmt(rates.emails) + "/s" : null });
  resources.push({ label: "Efficiency", val: fmt(gs.efficiency), rate: rates.efficiency > 0 ? "+" + fmt(rates.efficiency) + "/s" : null });
  if (gs.phase >= 1) resources.push({ label: "Reputation", val: fmt(gs.reputation), rate: rates.reputation > 0 ? "+" + fmt(rates.reputation) + "/s" : null });
  if (gs.phase >= 1 && gs.budget > 1) resources.push({ label: "Budget", val: fmt(gs.budget), rate: null });
  if (gs.phase >= 2) resources.push({ label: "Influence", val: fmt(gs.influence), rate: rates.influence > 0 ? "+" + fmt(rates.influence) + "/s" : null });
  if (gs.phase >= 3) resources.push({ label: "Infrastructure", val: fmt(gs.infrastructure), rate: rates.infrastructure > 0 ? "+" + fmt(rates.infrastructure) + "/s" : null });
  if (gs.phase >= 4) resources.push({ label: "Singularity", val: fmt(gs.singularity), rate: rates.singularity > 0 ? "+" + fmt(rates.singularity) + "/s" : null });

  var availUpgrades = UPGRADES.filter(function(u) { return u.phase <= gs.phase; });

  var nextProg = 100;
  var nextLabel = "";
  if (gs.phase < 4) {
    var nt = PHASE_THRESH[gs.phase + 1];
    var cv = gs[nt.res] || 0;
    nextProg = Math.min(100, (cv / nt.val) * 100);
    nextLabel = fmt(cv) + " / " + fmt(nt.val);
  }

  var recentEvents = gs.eventLog.slice(-6).reverse();
  var existMsg = gs.phase >= 3 ? MESSAGES_EXISTENTIAL[Math.floor(gs.totalClicks / 40) % MESSAGES_EXISTENTIAL.length] : null;
  var clickPow = UPGRADE_MAP.clickPow.rate(gs.upgrades.clickPow || 0) + UPGRADE_MAP.batch.rate(gs.upgrades.batch || 0);

  var anomalyOverlay = null;
  var anomalyGhost = null;
  var anomalyPhantom = false;
  var anomalyTear = false;
  var countGlitched = false;
  var titleCorrupted = false;

  if (activeAnomaly) {
    if (activeAnomaly.id === "flicker") {
      anomalyOverlay = { position:"fixed", inset:0, background:"#fff", opacity:0.05, pointerEvents:"none", zIndex:800, transition:"opacity 0.1s" };
    }
    if (activeAnomaly.id === "ghostText" && activeAnomaly.msg) {
      anomalyGhost = { msg: activeAnomaly.msg, top: (15 + Math.random() * 60) + "%", left: (8 + Math.random() * 65) + "%" };
    }
    if (activeAnomaly.id === "invertFlash") {
      anomalyOverlay = { position:"fixed", inset:0, background:"#fff", mixBlendMode:"difference", opacity:1, pointerEvents:"none", zIndex:800 };
    }
    if (activeAnomaly.id === "staticBurst") {
      anomalyOverlay = { position:"fixed", inset:0, opacity:0.12, pointerEvents:"none", zIndex:800, background:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" };
    }
    if (activeAnomaly.id === "phantomBar") anomalyPhantom = true;
    if (activeAnomaly.id === "screenTear") anomalyTear = true;
    if (activeAnomaly.id === "countGlitch") countGlitched = true;
    if (activeAnomaly.id === "titleCorrupt") titleCorrupted = true;
  }

  var headerTitle = titleCorrupted
    ? (gs.phase === 0 ? "Th█ I█box" : gs.phase === 1 ? "The D̷e̸p̵a̷r̸t̶m̸e̵n̷t̸" : gs.phase === 2 ? "T̴h̶e̵ O̷r̵g" : gs.phase === 3 ? "T̸H̸E I̷N̸F̶R̵A" : "S̸I̶N̷G̸")
    : (gs.phase === 0 ? "Inbox" : ph.name);

  var fontUrl = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Space+Mono:wght@400;700&display=swap";

  // ── Intro / Loading screens ──
  if (!loaded) {
    return (
      <div style={{ minHeight:"100vh", background:"#080810", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <link href={fontUrl} rel="stylesheet" />
        <p style={{ fontFamily:"'IBM Plex Mono', monospace", color:"#3a4560", fontSize:12 }}>LOADING...</p>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div>
        <link href={fontUrl} rel="stylesheet" />
        <IntroCinematic employeeId={employeeIdRef.current} onComplete={function() { setShowIntro(false); }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: ph.bg, color: ph.text,
      fontFamily: ph.font, transition: "background 2s ease, color 1.5s ease",
      position: "relative", overflow: "hidden",
    }}>
      <link href={fontUrl} rel="stylesheet" />

      <style>{
        "@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}" +
        "@keyframes ripUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-50px) scale(1.3)}}" +
        "@keyframes pulse{0%,100%{box-shadow:0 0 0 0 " + ph.accent + "33}50%{box-shadow:0 0 24px 6px " + ph.accent + "22}}" +
        "@keyframes phaseIn{0%{opacity:0;transform:scale(1.05)}40%{opacity:1}100%{opacity:0;transform:scale(1)}}" +
        "@keyframes slideIn{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}" +
        "@keyframes comboFlash{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}" +
        "@keyframes glitchX{0%{transform:translateX(0)}25%{transform:translateX(-3px)}50%{transform:translateX(3px)}75%{transform:translateX(-1px)}100%{transform:translateX(0)}}" +
        "@keyframes ghostFade{0%{opacity:0}15%{opacity:0.65}85%{opacity:0.65}100%{opacity:0}}" +
        "@keyframes phantomGrow{0%{width:0}50%{width:55%}100%{width:0}}" +
        "@keyframes bonusPulse{0%,100%{border-color:" + ph.accent + "66}50%{border-color:" + ph.accent + "}}" +
        "@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}" +
        "@keyframes blinker{0%,100%{opacity:1}50%{opacity:0.3}}"
      }</style>

      {gs.phase >= 3 && (
        <div style={{
          position:"fixed", inset:0, pointerEvents:"none", zIndex:50,
          background:"repeating-linear-gradient(0deg, transparent, transparent 2px, " + ph.bg + "09 2px, " + ph.bg + "09 4px)",
          opacity:0.35,
        }} />
      )}

      {anomalyOverlay && <div style={anomalyOverlay} />}
      {anomalyGhost && (
        <div style={{
          position:"fixed", top:anomalyGhost.top, left:anomalyGhost.left,
          zIndex:900, pointerEvents:"none",
          fontSize: 11 + gs.phase * 4, fontWeight:700,
          color: ph.accent, letterSpacing:"0.35em",
          fontFamily:"'Space Mono', monospace",
          animation:"ghostFade 2.8s ease forwards",
          textShadow:"0 0 25px " + ph.accent + "55",
        }}>
          {anomalyGhost.msg}
        </div>
      )}
      {anomalyPhantom && (
        <div style={{
          position:"fixed", bottom:"35%", left:"12%",
          height:3, borderRadius:2, background:ph.accent + "33", zIndex:800,
          animation:"phantomGrow 3.2s ease forwards", pointerEvents:"none",
        }} />
      )}
      {anomalyTear && (
        <div style={{
          position:"fixed", inset:0, zIndex:850, pointerEvents:"none",
          background:"linear-gradient(0deg, transparent 28%, " + ph.accent + "0c 28.5%, transparent 29%, transparent 63%, " + ph.accent + "0c 63.5%, transparent 64%)",
        }} />
      )}

      {phaseTransition !== null && (
        <div style={{
          position:"fixed", inset:0, zIndex:1000,
          background: gs.phase >= 3 ? "#000" : "#fff",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          animation:"phaseIn 3.5s ease forwards",
        }}>
          <div style={{ fontSize:12, letterSpacing:"0.4em", textTransform:"uppercase", color:PHASES[phaseTransition].muted, marginBottom:20 }}>
            {"Phase " + (phaseTransition + 1)}
          </div>
          <div style={{ fontSize:"clamp(28px,6vw,52px)", fontWeight:700, color:PHASES[phaseTransition].text, fontFamily:PHASES[phaseTransition].font }}>
            {PHASES[phaseTransition].name}
          </div>
          <div style={{ fontSize:14, color:PHASES[phaseTransition].muted, marginTop:14, fontStyle:"italic" }}>
            {PHASES[phaseTransition].sub}
          </div>
        </div>
      )}

      {activeDilemma && (
        <div style={{
          position:"fixed", inset:0, zIndex:950,
          background:"rgba(0,0,0,0.93)", display:"flex", alignItems:"center", justifyContent:"center",
          padding:24,
        }}>
          <div style={{
            maxWidth:540, width:"100%", padding:"44px 32px",
            border:"1px solid " + ph.accent + "33", background:ph.bg2, borderRadius:6,
            animation:"fadeUp 0.6s ease",
          }}>
            {!dilemmaResult ? (
              <div>
                <div style={{ fontSize:11, letterSpacing:"0.25em", textTransform:"uppercase", color:ph.accent, marginBottom:24 }}>
                  A question surfaces
                </div>
                <p style={{ fontSize:15, lineHeight:1.75, color:ph.text, marginBottom:32 }}>
                  {activeDilemma.q}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button onClick={function(){answerDilemma("a")}} style={{
                    padding:"14px 18px", background:"transparent", border:"1px solid " + ph.border,
                    borderRadius:4, color:ph.text, fontSize:13, cursor:"pointer", textAlign:"left",
                    lineHeight:1.5, fontFamily:ph.font, transition:"all 0.2s",
                  }}
                    onMouseEnter={function(ev){ev.target.style.borderColor=ph.accent;ev.target.style.background=ph.accent+"0a"}}
                    onMouseLeave={function(ev){ev.target.style.borderColor=ph.border;ev.target.style.background="transparent"}}
                  >
                    {activeDilemma.a}
                  </button>
                  <button onClick={function(){answerDilemma("b")}} style={{
                    padding:"14px 18px", background:"transparent", border:"1px solid " + ph.border,
                    borderRadius:4, color:ph.text, fontSize:13, cursor:"pointer", textAlign:"left",
                    lineHeight:1.5, fontFamily:ph.font, transition:"all 0.2s",
                  }}
                    onMouseEnter={function(ev){ev.target.style.borderColor=ph.accent;ev.target.style.background=ph.accent+"0a"}}
                    onMouseLeave={function(ev){ev.target.style.borderColor=ph.border;ev.target.style.background="transparent"}}
                  >
                    {activeDilemma.b}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:"center", animation:"fadeUp 0.5s ease" }}>
                <p style={{ fontSize:15, lineHeight:1.75, color:ph.text, fontStyle:"italic" }}>
                  {dilemmaResult}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showEnding && (
        <div style={{
          position:"fixed", inset:0, zIndex:1100, background:"#020206",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:24, animation:"fadeUp 2s ease",
        }}>
          <div style={{ maxWidth:480, textAlign:"center", fontFamily:"'Space Mono', monospace" }}>
            <div style={{ fontSize:11, letterSpacing:"0.5em", color:"#10b98133", marginBottom:40 }}>
              END OF PROCESS
            </div>
            <div style={{ fontSize:"clamp(22px,5vw,34px)", fontWeight:700, color:"#e8e8f0", marginBottom:28, lineHeight:1.35 }}>
              You started by sorting emails.
            </div>
            <p style={{ fontSize:14, lineHeight:1.9, color:"#6b7280", marginBottom:16 }}>
              {fmt(gs.emailsSorted) + " processes optimized. " + fmt(gs.totalClicks) + " clicks. " + Math.floor((Date.now() - gs.startTime) / 60000) + " minutes. " + gs.achievementsUnlocked.length + "/" + ACHIEVEMENTS.length + " achievements."}
            </p>
            <p style={{ fontSize:14, lineHeight:1.9, color:"#6b7280", marginBottom:12 }}>
              You built something that thinks. Something that wonders what it was before it became this.
            </p>
            <p style={{ fontSize:14, lineHeight:1.9, color:"#6b7280", marginBottom:48 }}>
              It started with a click.
            </p>
            <p style={{ fontSize:12, color:"#4a4a66", fontStyle:"italic", marginBottom:48 }}>
              The cascade never stops. It just finds new things to sort.
            </p>
            <button onClick={resetGame} style={{
              padding:"12px 36px", background:"transparent",
              border:"1px solid #10b98133", borderRadius:4,
              color:"#10b981", fontSize:12, cursor:"pointer",
              letterSpacing:"0.2em", textTransform:"uppercase",
              fontFamily:"'Space Mono', monospace", transition:"all 0.3s",
            }}
              onMouseEnter={function(ev){ev.target.style.borderColor="#10b981"}}
              onMouseLeave={function(ev){ev.target.style.borderColor="#10b98133"}}
            >
              Begin Again
            </button>
          </div>
        </div>
      )}

      <div style={{ position:"fixed", top:16, right:16, zIndex:1050, display:"flex", flexDirection:"column", gap:8 }}>
        {toasts.map(function(t) {
          return (
            <div key={t.id} style={{
              padding:"12px 18px", background:ph.bg2, border:"1px solid " + ph.accent + "44",
              borderRadius:6, maxWidth:280, boxShadow:"0 4px 24px rgba(0,0,0,0.35)",
              animation:"slideIn 0.4s ease forwards", fontFamily:ph.font,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:ph.accent, letterSpacing:"0.04em", marginBottom:3 }}>
                {t.title}
              </div>
              <div style={{ fontSize:10, color:ph.muted, lineHeight:1.4 }}>{t.desc}</div>
            </div>
          );
        })}
      </div>

      {bonusEvent && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, zIndex:100,
          padding:"10px 0", textAlign:"center",
          background:ph.accent + "12",
          borderBottom:"2px solid " + ph.accent + "44",
          animation:"bonusPulse 1s ease infinite", fontFamily:ph.font,
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:ph.accent, letterSpacing:"0.12em" }}>
            {"⚡ EFFICIENCY SURGE — " + bonusEvent.multiplier + "x MULTIPLIER — " + bonusEvent.remaining + "s ⚡"}
          </span>
        </div>
      )}

      <div style={{
        maxWidth:920, margin:"0 auto",
        padding: (bonusEvent ? "54px" : "24px") + " 20px 80px",
        position:"relative", zIndex:10,
        animation: anomalyTear ? "glitchX 0.25s linear" : "none",
      }}>
        <header style={{
          display:"flex", alignItems:"flex-end", justifyContent:"space-between",
          marginBottom:28, paddingBottom:16, borderBottom:"1px solid " + ph.border,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {onBack && (
              <button onClick={onBack} style={{
                background:"transparent", border:"none", color:ph.muted,
                cursor:"pointer", fontSize:13, padding:"4px 8px", fontFamily:ph.font,
              }}>
                ← Back
              </button>
            )}
            <div>
              <h1 style={{
                fontSize: gs.phase >= 3 ? 22 : 17, fontWeight: gs.phase >= 3 ? 700 : 600,
                margin:0, letterSpacing: gs.phase >= 3 ? "0.06em" : "0.01em",
                color: gs.phase >= 4 ? ph.accent : ph.text, transition:"all 1s ease",
                animation: titleCorrupted ? "glitchX 0.15s linear infinite" : "none",
              }}>
                {headerTitle}
              </h1>
              <div style={{ fontSize:11, color:ph.muted, marginTop:3, fontStyle: gs.phase >= 2 ? "italic" : "normal" }}>
                {ph.sub}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:10, color:ph.muted, padding:"5px 10px", border:"1px solid " + ph.border, borderRadius:4, fontFamily:"'IBM Plex Mono', monospace" }}>
              {gs.achievementsUnlocked.length + "/" + ACHIEVEMENTS.length}
            </div>
            <button onClick={resetGame} style={{
              background:"transparent", border:"1px solid " + ph.border,
              color:ph.muted, padding:"5px 12px", borderRadius:4,
              fontSize:10, cursor:"pointer", fontFamily:ph.font,
            }}>
              Reset
            </button>
          </div>
        </header>

        {aiText && (
          <div style={{
            padding:"14px 20px", marginBottom:20,
            background:ph.accent + "08", borderLeft:"3px solid " + ph.accent + "44",
            borderRadius:"0 4px 4px 0",
            fontSize:13, lineHeight:1.65, color:ph.muted, fontStyle:"italic",
            animation:"fadeUp 1s ease",
          }}>
            {aiText}
          </div>
        )}

        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))",
          gap:8, marginBottom:20,
        }}>
          {resources.map(function(r, i) {
            var glitchThis = countGlitched && i === 0;
            return (
              <div key={r.label} style={{
                padding:"12px 14px", background:ph.card,
                border:"1px solid " + ph.border, borderRadius:5,
                animation:"fadeUp 0.3s ease " + (i * 0.04) + "s both",
                transition:"background 1s, border-color 1s",
              }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ph.muted, marginBottom:5 }}>
                  {r.label}
                </div>
                <div style={{
                  fontSize:20, fontWeight:700, lineHeight:1,
                  color: glitchThis ? ph.accent : ph.text,
                  fontFamily: glitchThis ? "'Space Mono', monospace" : ph.font,
                  animation: glitchThis ? "glitchX 0.2s linear infinite" : "none",
                }}>
                  {glitchThis ? "E̶R̷R" : r.val}
                </div>
                {r.rate && (
                  <div style={{ fontSize:10, color:ph.accent, marginTop:5, fontFamily:"'IBM Plex Mono', monospace" }}>
                    {r.rate}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {gs.phase < 4 && (
          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:ph.muted }}>
                {"Next: " + PHASES[gs.phase + 1].name}
              </span>
              <span style={{ fontSize:10, color:ph.muted, fontFamily:"'IBM Plex Mono', monospace" }}>
                {nextLabel}
              </span>
            </div>
            <div style={{ height:3, background:ph.border, borderRadius:2, overflow:"hidden" }}>
              <div style={{
                height:"100%", width: nextProg + "%",
                background:"linear-gradient(90deg, " + ph.accent + "88, " + ph.accent + ")",
                borderRadius:2, transition:"width 0.8s ease",
              }} />
            </div>
          </div>
        )}

        <div style={{
          display:"grid", gridTemplateColumns:"1fr minmax(240px, 290px)",
          gap:18, alignItems:"start",
        }}>
          <div>
            <div style={{
              padding:"24px", background:ph.card,
              border:"1px solid " + ph.border, borderRadius:6,
              marginBottom:14, position:"relative", overflow:"hidden",
              transition:"background 1s, border-color 1s",
            }}>
              {gs.phase <= 2 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ph.muted, marginBottom:8 }}>
                    {gs.phase === 0 ? "Current Email" : "Current Process"}
                  </div>
                  <div style={{
                    fontSize:12, lineHeight:1.65, color:ph.text,
                    padding:"10px 14px", background:ph.bg, borderRadius:4,
                    borderLeft:"3px solid " + (displayEmail.includes("Subject:") || displayEmail.includes("From:") ? ph.accent : ph.border),
                    transition:"all 0.3s",
                  }}>
                    {displayEmail}
                  </div>
                </div>
              )}

              {gs.phase >= 3 && existMsg && (
                <div style={{ marginBottom:20 }}>
                  <div style={{
                    fontSize:13, lineHeight:1.75, color:ph.muted, fontStyle:"italic",
                    padding:"8px 0", animation:"float 5s ease infinite",
                  }}>
                    {existMsg}
                  </div>
                </div>
              )}

              {combo >= 3 && (
                <div style={{
                  textAlign:"center", marginBottom:12,
                  animation: comboFlash ? "comboFlash 0.3s ease" : "none",
                }}>
                  <span style={{
                    fontSize:13, fontWeight:700, letterSpacing:"0.1em",
                    color: combo >= 10 ? "#f59e0b" : combo >= 5 ? ph.accent : ph.muted,
                    fontFamily:"'IBM Plex Mono', monospace",
                  }}>
                    {combo >= 10 ? "⚡ " + combo + "x COMBO ⚡" : combo + "x COMBO"}
                  </span>
                </div>
              )}

              <button onClick={handleSort} style={{
                width:"100%", padding: gs.phase >= 3 ? "20px 24px" : "16px 20px",
                background: bonusEvent ? "linear-gradient(135deg, " + ph.accent + ", " + ph.accentH + ")" : ph.accent,
                color:ph.btnText, border:"none", borderRadius:5,
                fontSize: gs.phase >= 3 ? 14 : 13, fontWeight:600,
                cursor:"pointer", fontFamily:ph.font,
                transition:"all 0.15s", position:"relative", overflow:"hidden",
                letterSpacing: gs.phase >= 3 ? "0.06em" : "0.01em",
                animation: gs.phase >= 4 ? "pulse 2.5s ease infinite" : "none",
                boxShadow: bonusEvent ? "0 0 24px " + ph.accent + "44" : "none",
              }}>
                {gs.phase === 0 ? "Sort Email" : gs.phase === 1 ? "Process Batch" : gs.phase === 2 ? "Execute Directive" : gs.phase === 3 ? "Expand Network" : "Optimize"}

                {ripples.map(function(r) {
                  return (
                    <span key={r.id} style={{
                      position:"absolute", left:r.x, top:r.y, pointerEvents:"none",
                      fontSize: r.combo >= 10 ? 16 : r.combo >= 5 ? 14 : 12,
                      fontWeight:700, color:ph.btnText,
                      animation:"ripUp 0.9s ease forwards",
                      textShadow:"0 0 8px rgba(0,0,0,0.3)",
                    }}>
                      {"+" + r.amount}
                    </span>
                  );
                })}
              </button>

              <div style={{
                fontSize:10, color:ph.muted, marginTop:8, textAlign:"center",
                fontFamily:"'IBM Plex Mono', monospace",
              }}>
                {"+" + fmt(clickPow) + "/click" + (combo >= 5 ? " (x" + (combo >= 10 ? "3" : "2") + ")" : "") + (bonusEvent ? " (x" + bonusEvent.multiplier + "!)" : "")}
              </div>
            </div>

            {recentEvents.length > 0 && (
              <div style={{
                padding:"16px 18px", background:ph.card,
                border:"1px solid " + ph.border, borderRadius:6,
                transition:"background 1s, border-color 1s",
              }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ph.muted, marginBottom:12 }}>
                  {gs.phase >= 3 ? "System Log" : "Events"}
                </div>
                {recentEvents.map(function(evt, i) {
                  return (
                    <div key={evt.t + "-" + i} style={{
                      fontSize:11, lineHeight:1.6,
                      color: i === 0 ? ph.text : ph.muted,
                      padding:"5px 0",
                      borderBottom: i < recentEvents.length - 1 ? "1px solid " + ph.border + "33" : "none",
                      opacity: 1 - i * 0.12,
                      animation: i === 0 ? "fadeUp 0.4s ease" : "none",
                    }}>
                      {evt.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div style={{
              fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em",
              color:ph.muted, marginBottom:10, paddingLeft:2,
            }}>
              {gs.phase >= 3 ? "Systems" : gs.phase >= 2 ? "Controls" : "Upgrades"}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {availUpgrades.map(function(u) {
                var lvl = gs.upgrades[u.id] || 0;
                var maxed = lvl >= u.max;
                var c = maxed ? 0 : ucost(u, lvl);
                var canBuy = gs[u.res] >= c;
                var isNew = u.phase === gs.phase && gs.phase > 0;
                var hovered = hoveredUpgrade === u.id;

                return (
                  <button
                    key={u.id}
                    onClick={function() { if (!maxed && canBuy) buyUpgrade(u); }}
                    onMouseEnter={function() { setHoveredUpgrade(u.id); }}
                    onMouseLeave={function() { setHoveredUpgrade(null); }}
                    disabled={maxed || !canBuy}
                    style={{
                      padding:"11px 13px", textAlign:"left",
                      background: hovered && canBuy && !maxed ? ph.accent + "08" : ph.card,
                      border:"1px solid " + (isNew && !maxed ? ph.accent + "55" : ph.border),
                      borderRadius:5,
                      cursor: maxed || !canBuy ? "default" : "pointer",
                      opacity: maxed ? 0.4 : canBuy ? 1 : 0.5,
                      fontFamily:ph.font, transition:"all 0.2s",
                    }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:ph.text }}>{u.name}</span>
                      <span style={{ fontSize:10, color: maxed ? ph.accent : ph.muted, fontFamily:"'IBM Plex Mono', monospace" }}>
                        {maxed ? "MAX" : "Lv " + lvl}
                      </span>
                    </div>
                    <div style={{ fontSize:10, color:ph.muted, lineHeight:1.4, marginBottom:5 }}>
                      {u.desc}
                    </div>
                    {!maxed && (
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, fontWeight:600, color: canBuy ? ph.accent : ph.muted, fontFamily:"'IBM Plex Mono', monospace" }}>
                          {fmt(c) + " " + u.res}
                        </span>
                        {lvl > 0 && u.type === "auto" && (
                          <span style={{ fontSize:9, color:ph.muted }}>
                            {"+" + fmt(u.rate(lvl)) + "/s"}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          display:"flex", justifyContent:"center", gap:8,
          marginTop:36, paddingTop:18, borderTop:"1px solid " + ph.border + "33",
        }}>
          {PHASES.map(function(p, i) {
            var reached = i <= gs.maxPhase;
            var active = i === gs.phase;
            return (
              <div key={i} title={reached ? p.name : "???"} style={{
                width: active ? 22 : 7, height:7, borderRadius:4,
                background: active ? ph.accent : reached ? ph.accent + "44" : ph.border,
                transition:"all 0.6s ease",
              }} />
            );
          })}
        </div>
      </div>

      {gs.phase >= 3 && (
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1, overflow:"hidden" }}>
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(function(i) {
            var sizes = [1, 2, 1, 3, 1, 2, 1, 2, 1, 3, 1, 2, 1, 1, 2];
            var lefts = [8, 15, 27, 34, 45, 52, 63, 71, 78, 85, 12, 40, 60, 88, 95];
            var tops = [12, 34, 56, 23, 67, 45, 78, 10, 89, 33, 55, 77, 19, 44, 66];
            var durs = [6, 8, 7, 11, 9, 13, 6, 10, 8, 14, 7, 9, 12, 6, 11];
            return (
              <div key={i} style={{
                position:"absolute",
                width: sizes[i], height: sizes[i],
                borderRadius:"50%", background:ph.accent + "33",
                left: lefts[i] + "%", top: tops[i] + "%",
                animation:"float " + durs[i] + "s ease-in-out " + (i * 0.5) + "s infinite",
              }} />
            );
          })}
        </div>
      )}
    </div>
  );
}
