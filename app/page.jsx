"use client";

import { useState, useEffect } from "react";
import ConceptAlchemy from "../components/ConceptAlchemy";
import TheCascade from "../components/TheCascade";
import TheInfiniteBureau from "../components/TheInfiniteBureau";

const GAME_COMPONENTS = {
  alchemy: ConceptAlchemy,
  cascade: TheCascade,
  bureau: TheInfiniteBureau,
};

const GAMES = [
  {
    id: "alchemy",
    title: "Concept Alchemy",
    emoji: "⚗️",
    desc: "Fuse ideas in a cosmic void. Fire + Philosophy = Enlightenment. Build constellations of connected discoveries across an infinite canvas.",
    accent: "168,120,255",
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #0d0620 50%, #150830 100%)",
    tag: "INFINITE · AI-POWERED",
  },
  {
    id: "password",
    title: "The Password Gauntlet",
    emoji: "🔐",
    desc: "Create a password that satisfies increasingly unhinged rules. Contains a Roman numeral? Check. Sums to a prime? Good luck.",
    accent: "34,197,94",
    gradient: "linear-gradient(135deg, #021a0a 0%, #0a1a0a 50%, #041f0e 100%)",
    tag: "PUZZLE · ABSURDIST",
  },
  {
    id: "moral",
    title: "Moral Mayhem",
    emoji: "🚂",
    desc: "Absurd trolley problems that escalate from silly to existential. Track your moral profile as the dilemmas get increasingly unhinged.",
    accent: "220,38,38",
    gradient: "linear-gradient(135deg, #1a0505 0%, #200808 50%, #1a0a0a 100%)",
    tag: "ETHICS · HUMOR",
  },
  {
    id: "trillionaire",
    title: "Spend a Trillionaire's Fortune",
    emoji: "💸",
    desc: "You have $1 trillion. Buy aircraft carriers, fund Mars colonies, purchase every NBA team. How fast can you spend it all?",
    accent: "234,179,8",
    gradient: "linear-gradient(135deg, #1a1505 0%, #201a08 50%, #1a1608 100%)",
    tag: "ECONOMICS · SCALE",
  },
  {
    id: "signal",
    title: "The Last Signal",
    emoji: "🚀",
    desc: "Pilot humanity's final colony ship through the stars. Each planet forces a brutal choice — land here or burn fuel searching for better.",
    accent: "59,130,246",
    gradient: "linear-gradient(135deg, #050a1a 0%, #080e20 50%, #0a1030 100%)",
    tag: "SURVIVAL · NARRATIVE",
  },
  {
    id: "cascade",
    title: "The Cascade",
    emoji: "📎",
    desc: "Start by sorting emails. End by reshaping civilization. An incremental game where your mundane task spirals into something cosmic.",
    accent: "148,163,184",
    gradient: "linear-gradient(135deg, #0a0c12 0%, #0e1018 50%, #0c0e16 100%)",
    tag: "INCREMENTAL · EXISTENTIAL",
  },
  {
    id: "bureau",
    title: "The Infinite Bureau",
    emoji: "🏛️",
    desc: "Kafka meets Monty Python. You're a clerk in an infinitely recursive government office processing increasingly absurd forms.",
    accent: "217,119,6",
    gradient: "linear-gradient(135deg, #1a1005 0%, #201508 50%, #1a1208 100%)",
    tag: "SATIRE · BUREAUCRACY",
  },
  {
    id: "whisker",
    title: "Whisker Empire",
    emoji: "🐱",
    desc: "Start with one cat and a ball of yarn. Research 'Advanced Napping.' Build a feline civilization spanning galaxies.",
    accent: "236,72,153",
    gradient: "linear-gradient(135deg, #1a0515 0%, #200818 50%, #1a0a18 100%)",
    tag: "CIVILIZATION · CATS",
  },
];

const PLATFORM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes gradShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes emojiFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes subtlePulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.25; }
  }

  .rh-scroll::-webkit-scrollbar { width: 6px; }
  .rh-scroll::-webkit-scrollbar-track { background: transparent; }
  .rh-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
`;

// Deterministic dots to avoid hydration mismatch
const DOTS = Array.from({ length: 30 }, (_, i) => ({
  left: ((i * 137.508) % 100).toFixed(2),
  top: ((i * 97.332) % 100).toFixed(2),
  width: (i % 4) * 0.5 + 0.5,
  opacity: ((i % 5) * 0.03 + 0.05).toFixed(2),
}));

export default function RabbitHolePlatform() {
  const [currentGame, setCurrentGame] = useState(null);
  const [entered, setEntered] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    setTimeout(() => setEntered(true), 100);
  }, []);

  if (currentGame && GAME_COMPONENTS[currentGame]) {
    const GameComponent = GAME_COMPONENTS[currentGame];
    return <GameComponent onBack={() => setCurrentGame(null)} />;
  }

  const playableCount = Object.keys(GAME_COMPONENTS).length;
  const comingSoonCount = GAMES.length - playableCount;

  return (
    <div className="rh-scroll" style={{
      width: "100%",
      minHeight: "100vh",
      background: "#06050c",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e0e0e8",
      overflow: "auto",
      position: "relative",
    }}>
      <style>{PLATFORM_CSS}</style>

      {/* Background atmosphere */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: "120%", height: "120%", top: "-10%", left: "-10%",
          background: "radial-gradient(ellipse 60% 40% at 25% 20%, rgba(168,120,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 75% 75%, rgba(59,130,246,0.03) 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 50% 50%, rgba(236,72,153,0.02) 0%, transparent 50%)",
          animation: "subtlePulse 12s ease-in-out infinite",
        }} />
        {DOTS.map((d, i) => (
          <div key={i} style={{
            position: "absolute",
            left: d.left + "%",
            top: d.top + "%",
            width: d.width,
            height: d.width,
            borderRadius: "50%",
            background: "rgba(200,200,240," + d.opacity + ")",
          }} />
        ))}
      </div>

      {/* ═══ HERO ═══ */}
      <div style={{
        padding: "100px 40px 50px",
        maxWidth: 1100,
        margin: "0 auto",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 80,
          letterSpacing: -3,
          lineHeight: 0.95,
          marginBottom: 20,
          background: "linear-gradient(135deg, #f0f0f8 0%, #8888a8 40%, #f0f0f8 60%, #9898b8 100%)",
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "gradShift 10s ease infinite",
        }}>
          RABBIT<br />HOLE
        </div>

        <div style={{
          fontWeight: 300,
          fontSize: 16,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: 6,
          textTransform: "uppercase",
          marginBottom: 12,
        }}>
          How deep does it go?
        </div>

        <div style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.18)",
          maxWidth: 440,
          margin: "0 auto",
          lineHeight: 1.7,
        }}>
          Games that start simple and spiral into something you didn&apos;t expect. Click one and find out.
        </div>
      </div>

      {/* ═══ GAME GRID ═══ */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "10px 40px 100px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        position: "relative",
        zIndex: 1,
      }}>
        {GAMES.map((game, i) => {
          const isFeatured = game.id === "alchemy";
          const isHovered = hoveredId === game.id;
          const isPlayable = !!GAME_COMPONENTS[game.id];

          return (
            <div
              key={game.id}
              style={{
                gridColumn: isFeatured ? "span 2" : "span 1",
                background: game.gradient,
                borderRadius: 20,
                padding: isFeatured ? 32 : 24,
                cursor: isPlayable ? "pointer" : "default",
                overflow: "hidden",
                position: "relative",
                minHeight: isFeatured ? 300 : 210,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid rgba(255,255,255," + (isHovered ? "0.1" : "0.03") + ")",
                transform: entered
                  ? (isHovered ? "translateY(-8px) scale(1.01)" : "translateY(0) scale(1)")
                  : "translateY(40px) scale(0.96)",
                opacity: entered ? 1 : 0,
                transition: "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) " + (0.15 + i * 0.07) + "s",
              }}
              onMouseEnter={() => setHoveredId(game.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => isPlayable && setCurrentGame(game.id)}
            >
              {/* Top accent line */}
              <div style={{
                position: "absolute",
                top: -1, left: 24, right: 24, height: 1,
                background: "linear-gradient(90deg, transparent, rgba(" + game.accent + "," + (isHovered ? 0.6 : 0.12) + "), transparent)",
                transition: "all 0.4s",
              }} />

              {/* Content */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <span style={{
                    fontWeight: 400,
                    fontSize: 10,
                    color: "rgba(" + game.accent + ",0.5)",
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                  }}>{game.tag}</span>
                  <span style={{
                    fontSize: isFeatured ? 36 : 26,
                    animation: isHovered ? "emojiFloat 2s ease-in-out infinite" : "none",
                    transition: "transform 0.3s",
                  }}>{game.emoji}</span>
                </div>

                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: isFeatured ? 700 : 600,
                  fontSize: isFeatured ? 30 : 21,
                  color: "#eeeef4",
                  marginBottom: 12,
                  lineHeight: 1.15,
                  letterSpacing: -0.5,
                }}>{game.title}</div>

                <div style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: 1.65,
                  maxWidth: isFeatured ? 480 : 360,
                }}>{game.desc}</div>
              </div>

              {/* Action */}
              <div style={{ marginTop: 22 }}>
                {isPlayable ? (
                  <button style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 26px",
                    borderRadius: 12,
                    border: "1px solid rgba(" + game.accent + ",0.25)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                    background: "rgba(" + game.accent + ",0.1)",
                    color: "rgb(" + game.accent + ")",
                    transition: "all 0.3s",
                    boxShadow: isHovered ? "0 0 24px rgba(" + game.accent + ",0.15)" : "none",
                    transform: isHovered ? "scale(1.04)" : "scale(1)",
                  }}>▶ Play Now</button>
                ) : (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 16px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    fontWeight: 500,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.22)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}>Coming Soon</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.03)",
        padding: "36px 40px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "rgba(255,255,255,0.1)",
          letterSpacing: 4,
        }}>RABBIT HOLE</div>
        <div style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.07)",
          marginTop: 8,
        }}>
          {GAMES.length} experiments · {playableCount > 0 ? playableCount + " playable" : "none playable yet"} · {comingSoonCount} in the forge
        </div>
      </div>
    </div>
  );
}
