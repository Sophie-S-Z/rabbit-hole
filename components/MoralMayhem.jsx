"use client";
import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import "./storage-polyfill";

var SAVE_KEY = 'moral-mayhem-save-v1';

var INTRO_ERRORS = [
  'MORAL FRAMEWORK: CORRUPTED',
  'COMPASS: SHATTERED',
  'ETHICS MODULE: 404',
  'EMPATHY DRIVER: UNRESPONSIVE',
  'GUILT SENSOR: OVERLOADED',
  'CONSCIENCE.DLL: MISSING'
];

var INTRO_SCORE_SEQUENCE = [85, 88, 91, 93, 95, 97, 98, 99, 74, 31, 8, -3, -47, -999];

var FALLBACK_PROFILES = [
  { title: 'Lawful Reasonable', roast: 'You played it safe at every turn. Somewhere a philosophy professor is nodding approvingly and a raccoon is deeply disappointed in you.', spirit: 'Golden Retriever' },
  { title: 'Cautious Pragmatist', roast: 'You chose logic over chaos, mostly. The universe notes your restraint and finds it very suspicious.', spirit: 'Hedgehog' },
  { title: 'Chaotic Neutral', roast: "You're not evil. You're not good. You're someone who negotiated with sentient furniture and we respect that energy.", spirit: 'Raccoon' },
  { title: 'Agent of Entropy', roast: "You looked chaos in the eye and said 'hold my beverage.' The auction raccoon follows your career with great interest.", spirit: 'Crow' },
  { title: 'Unhinged Visionary', roast: 'You bypassed morality entirely and found something on the other side. Philosophers call it enlightenment. HR calls it a situation.', spirit: 'Platypus' }
];

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r, g, b) {
  var rh = Math.round(r).toString(16);
  var gh = Math.round(g).toString(16);
  var bh = Math.round(b).toString(16);
  if (rh.length < 2) rh = '0' + rh;
  if (gh.length < 2) gh = '0' + gh;
  if (bh.length < 2) bh = '0' + bh;
  return '#' + rh + gh + bh;
}

function lerpColor(c1, c2, t) {
  var a = hexToRgb(c1);
  var b = hexToRgb(c2);
  return rgbToHex(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  );
}

var PHASE_COLORS = [
  { bg: '#FDF6EC', accent: '#FF6B6B', text: '#2D2D2D' },
  { bg: '#ECEAE5', accent: '#E8A317', text: '#1A1A1A' },
  { bg: '#D8D4CD', accent: '#8B5CF6', text: '#111111' },
  { bg: '#1A1A2E', accent: '#FF3366', text: '#F0F0F0' }
];

function getPhaseColors(levelIndex) {
  if (levelIndex === 19) {
    return { bg: '#FFFFFF', accent: '#111111', text: '#111111', vignette: false, glitch: false, paper: false, phase: 4 };
  }
  var phase;
  var localT;
  if (levelIndex < 5) {
    phase = 0;
    localT = levelIndex / 5;
  } else if (levelIndex < 10) {
    phase = 1;
    localT = (levelIndex - 5) / 5;
  } else if (levelIndex < 15) {
    phase = 2;
    localT = (levelIndex - 10) / 5;
  } else {
    phase = 3;
    localT = (levelIndex - 15) / 5;
  }
  var fromPhase = PHASE_COLORS[phase];
  var toPhase = phase < 3 ? PHASE_COLORS[phase + 1] : PHASE_COLORS[phase];
  var bg = lerpColor(fromPhase.bg, toPhase.bg, localT);
  var accent = lerpColor(fromPhase.accent, toPhase.accent, localT);
  var text = lerpColor(fromPhase.text, toPhase.text, localT);
  var vignetteStrength = 0;
  if (levelIndex >= 8) {
    vignetteStrength = Math.min(1, (levelIndex - 8) / 7);
  }
  return {
    bg: bg,
    accent: accent,
    text: text,
    vignette: levelIndex >= 8,
    vignetteStrength: vignetteStrength,
    glitch: levelIndex >= 15,
    paper: levelIndex >= 5 && levelIndex < 15,
    phase: phase
  };
}

function formatVotes(n) {
  if (n >= 1000000) { return (n / 1000000).toFixed(1) + 'M'; }
  if (n >= 1000) { return Math.round(n / 1000) + 'K'; }
  return String(n);
}

function getAlignmentCategory(score) {
  if (score <= 4) return 'Lawful Reasonable';
  if (score <= 8) return 'Cautious Pragmatist';
  if (score <= 12) return 'Chaotic Neutral';
  if (score <= 16) return 'Agent of Entropy';
  return 'Unhinged Visionary';
}

function getFallbackProfile(score) {
  if (score <= 4) return FALLBACK_PROFILES[0];
  if (score <= 8) return FALLBACK_PROFILES[1];
  if (score <= 12) return FALLBACK_PROFILES[2];
  if (score <= 16) return FALLBACK_PROFILES[3];
  return FALLBACK_PROFILES[4];
}

function formatTime(ms) {
  var s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
}

// ── SVG HELPER COMPONENTS ────────────────────────────────────────────────────

function StickFigure(props) {
  var cx = props.cx !== undefined ? props.cx : 200;
  var cy = props.cy !== undefined ? props.cy : 100;
  var s  = props.scale !== undefined ? props.scale : 1;
  var mood = props.mood || 'neutral';
  var sw = 2.5 * s;
  var hr = 16 * s;

  var mouthPath;
  if (mood === 'happy') {
    mouthPath = React.createElement('path', { d: 'M '+(cx-7*s)+' '+(cy+7*s)+' Q '+cx+' '+(cy+13*s)+' '+(cx+7*s)+' '+(cy+7*s), stroke:'#222', strokeWidth:sw*0.6, fill:'none', strokeLinecap:'round' });
  } else if (mood === 'worried') {
    mouthPath = React.createElement('path', { d: 'M '+(cx-7*s)+' '+(cy+10*s)+' Q '+cx+' '+(cy+6*s)+' '+(cx+7*s)+' '+(cy+10*s), stroke:'#222', strokeWidth:sw*0.6, fill:'none', strokeLinecap:'round' });
  } else if (mood === 'shocked') {
    mouthPath = React.createElement('ellipse', { cx:cx, cy:cy+9*s, rx:5*s, ry:6*s, stroke:'#222', strokeWidth:sw*0.6, fill:'none' });
  } else if (mood === 'smug') {
    mouthPath = React.createElement('path', { d: 'M '+(cx-7*s)+' '+(cy+8*s)+' Q '+(cx+2*s)+' '+(cy+13*s)+' '+(cx+7*s)+' '+(cy+6*s), stroke:'#222', strokeWidth:sw*0.6, fill:'none', strokeLinecap:'round' });
  } else {
    mouthPath = React.createElement('line', { x1:cx-6*s, y1:cy+8*s, x2:cx+6*s, y2:cy+8*s, stroke:'#222', strokeWidth:sw*0.6, strokeLinecap:'round' });
  }

  return React.createElement('g', null,
    React.createElement('circle', { cx:cx, cy:cy, r:hr, stroke:'#222', strokeWidth:sw, fill:'#FFF8F0' }),
    React.createElement('circle', { cx:cx-5*s, cy:cy-3*s, r:2*s, fill:'#222' }),
    React.createElement('circle', { cx:cx+5*s, cy:cy-3*s, r:2*s, fill:'#222' }),
    mouthPath,
    React.createElement('line', { x1:cx, y1:cy+hr, x2:cx, y2:cy+hr+45*s, stroke:'#222', strokeWidth:sw, strokeLinecap:'round' }),
    React.createElement('line', { x1:cx, y1:cy+hr+18*s, x2:cx-25*s, y2:cy+hr+35*s, stroke:'#222', strokeWidth:sw, strokeLinecap:'round' }),
    React.createElement('line', { x1:cx, y1:cy+hr+18*s, x2:cx+25*s, y2:cy+hr+35*s, stroke:'#222', strokeWidth:sw, strokeLinecap:'round' }),
    React.createElement('line', { x1:cx, y1:cy+hr+45*s, x2:cx-18*s, y2:cy+hr+75*s, stroke:'#222', strokeWidth:sw, strokeLinecap:'round' }),
    React.createElement('line', { x1:cx, y1:cy+hr+45*s, x2:cx+18*s, y2:cy+hr+75*s, stroke:'#222', strokeWidth:sw, strokeLinecap:'round' })
  );
}

function SweatDrops(props) {
  var cx = props.cx !== undefined ? props.cx : 200;
  var cy = props.cy !== undefined ? props.cy : 100;
  return React.createElement('g', null,
    React.createElement('path', { d:'M '+(cx+20)+' '+(cy-8)+' Q '+(cx+27)+' '+(cy-16)+' '+(cx+23)+' '+(cy-23), stroke:'#555', strokeWidth:1.5, fill:'none', strokeLinecap:'round' }),
    React.createElement('path', { d:'M '+(cx+25)+' '+(cy+4)+' Q '+(cx+33)+' '+(cy-4)+' '+(cx+29)+' '+(cy-12), stroke:'#555', strokeWidth:1.5, fill:'none', strokeLinecap:'round' })
  );
}

// ── SVG ILLUSTRATIONS ────────────────────────────────────────────────────────

function SvgLevel1() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".bobL1{animation:bobL1 2s ease-in-out infinite}@keyframes bobL1{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="100" y="165" width="200" height="12" rx="2" stroke="#222" strokeWidth="2.5" fill="#FFF5E0"/>
      <line x1="118" y1="177" x2="118" y2="240" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="282" y1="177" x2="282" y2="240" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <StickFigure cx={305} cy={105} scale={0.9} mood="worried"/>
      <SweatDrops cx={305} cy={105}/>
      <text x="318" y="100" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#555">CEO</text>
      <g className="bobL1" style={{transformOrigin:'152px 148px'}}>
        <rect x="132" y="150" width="40" height="7" rx="1" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
        <line x1="137" y1="157" x2="137" y2="172" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <line x1="167" y1="157" x2="167" y2="172" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <line x1="132" y1="153" x2="116" y2="162" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="172" y1="153" x2="188" y2="162" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="152" cy="143" r="9" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
        <circle cx="149" cy="141" r="1.5" fill="#222"/>
        <circle cx="155" cy="141" r="1.5" fill="#222"/>
        <path d="M 149 146 Q 152 149 155 146" stroke="#222" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M 151 152 L 150 160 L 152 158 L 154 160 L 153 152 Z" stroke="#222" strokeWidth="1" fill="#FFF5E0"/>
        <text x="110" y="185" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#555">Table-othy</text>
      </g>
      <rect x="18" y="50" width="75" height="60" rx="3" stroke="#222" strokeWidth="1.5" fill="#EEF5FF"/>
      <text x="55" y="68" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#333">WINDOW</text>
      <rect x="28" y="83" width="12" height="4" rx="1" stroke="#444" strokeWidth="1" fill="#FFF5E0"/>
      <line x1="31" y1="87" x2="31" y2="97" stroke="#444" strokeWidth="1"/>
      <line x1="37" y1="87" x2="37" y2="97" stroke="#444" strokeWidth="1"/>
      <line x1="34" y1="85" x2="34" y2="74" stroke="#444" strokeWidth="1"/>
      <rect x="27" y="68" width="14" height="8" rx="1" stroke="#444" strokeWidth="1" fill="#FFF5E0"/>
      <text x="34" y="75" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="5" fill="#333">UNION</text>
      <rect x="60" y="83" width="12" height="4" rx="1" stroke="#444" strokeWidth="1" fill="#FFF5E0"/>
      <line x1="63" y1="87" x2="63" y2="97" stroke="#444" strokeWidth="1"/>
      <line x1="69" y1="87" x2="69" y2="97" stroke="#444" strokeWidth="1"/>
      <line x1="66" y1="85" x2="66" y2="74" stroke="#444" strokeWidth="1"/>
      <rect x="59" y="68" width="16" height="8" rx="1" stroke="#444" strokeWidth="1" fill="#FFF5E0"/>
      <text x="67" y="75" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="5" fill="#333">DENTAL</text>
    </svg>
  );
}

function SvgLevel2() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".pulseP{animation:pulseP 1.5s ease-in-out infinite}@keyframes pulseP{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <StickFigure cx={155} cy={110} scale={1} mood="worried"/>
      <SweatDrops cx={155} cy={110}/>
      <g className="pulseP" style={{transformOrigin:'194px 163px'}}>
        <rect x="181" y="148" width="26" height="44" rx="4" stroke="#222" strokeWidth="2" fill="#E8E8E8"/>
        <rect x="184" y="154" width="20" height="28" rx="1" stroke="#444" strokeWidth="1" fill="#C5E0FF"/>
        <circle cx="194" cy="186" r="3" stroke="#444" strokeWidth="1" fill="none"/>
        <text x="185" y="168" fontFamily="Patrick Hand, cursive" fontSize="6" fill="#444">47:03</text>
        <circle cx="207" cy="148" r="6" fill="#FF3333"/>
        <text x="207" y="152" textAnchor="middle" fontSize="7" fill="white">!</text>
      </g>
      <rect x="218" y="38" width="162" height="108" rx="12" stroke="#222" strokeWidth="2" fill="#FFFEF0"/>
      <path d="M 235 146 L 218 165 L 252 146" stroke="#222" strokeWidth="2" fill="#FFFEF0"/>
      <text x="238" y="78" fontFamily="serif" fontSize="24" fill="#333">♪</text>
      <text x="268" y="65" fontFamily="serif" fontSize="18" fill="#333">♫</text>
      <text x="295" y="84" fontFamily="serif" fontSize="22" fill="#333">♪</text>
      <text x="322" y="70" fontFamily="serif" fontSize="16" fill="#333">♩</text>
      <ellipse cx="285" cy="120" rx="30" ry="22" fill="#5F9E5F" stroke="#333" strokeWidth="1.5"/>
      <ellipse cx="278" cy="113" rx="5" ry="6" fill="#4A7A4A"/>
      <ellipse cx="292" cy="113" rx="5" ry="6" fill="#4A7A4A"/>
      <path d="M 275 126 Q 285 132 295 126" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <text x="250" y="102" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#888">47-min voicemail</text>
    </svg>
  );
}

function SvgLevel3() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".spinG{animation:spinG 3s linear infinite}@keyframes spinG{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <StickFigure cx={140} cy={108} scale={1} mood="shocked"/>
      <rect x="210" y="55" width="125" height="185" rx="3" stroke="#222" strokeWidth="2.5" fill="#E8D5B0"/>
      <circle cx="220" cy="148" r="5" stroke="#222" strokeWidth="2" fill="#D4A020"/>
      <circle cx="285" cy="128" r="32" stroke="#222" strokeWidth="2" fill="#F0E8D0"/>
      <g style={{transformOrigin:'285px 128px'}} className="spinG">
        <line x1="285" y1="104" x2="285" y2="152" stroke="#888" strokeWidth="1.5" strokeDasharray="5,3"/>
        <line x1="261" y1="128" x2="309" y2="128" stroke="#888" strokeWidth="1.5" strokeDasharray="5,3"/>
      </g>
      <rect x="268" y="114" width="34" height="28" rx="3" stroke="#222" strokeWidth="1.5" fill="#D4E8D4"/>
      <text x="285" y="131" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#333">LOOM</text>
      <path d="M 248 88 Q 236 78 226 84 L 221 95 L 238 97 Z" stroke="#E05050" strokeWidth="1.5" fill="#FFB0B0"/>
      <path d="M 320 82 Q 336 72 341 80 L 343 92 L 327 90 Z" stroke="#5050E0" strokeWidth="1.5" fill="#B0B0FF"/>
      <path d="M 318 168 Q 332 178 337 170 L 338 158 L 322 160 Z" stroke="#50A050" strokeWidth="1.5" fill="#B0FFB0"/>
      <path d="M 30 240 Q 60 222 90 236 Q 120 222 155 240" stroke="#E05050" strokeWidth="1.5" fill="#FFB0B0"/>
      <text x="90" y="262" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#666">47 mismatched socks</text>
    </svg>
  );
}

function SvgLevel4() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="155" y="155" width="90" height="85" rx="2" stroke="#222" strokeWidth="2.5" fill="#D4AA60"/>
      <rect x="148" y="148" width="104" height="12" rx="2" stroke="#222" strokeWidth="2" fill="#C4993A"/>
      <line x1="200" y1="148" x2="200" y2="125" stroke="#444" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="200" cy="120" rx="8" ry="10" stroke="#333" strokeWidth="1.5" fill="#555"/>
      <StickFigure cx={200} cy={84} scale={0.85} mood="worried"/>
      <SweatDrops cx={200} cy={84}/>
      <rect x="170" y="143" width="22" height="14" rx="1" stroke="#222" strokeWidth="1.5" fill="#FFFEF0" transform="rotate(-8,181,150)"/>
      <rect x="210" y="143" width="22" height="14" rx="1" stroke="#222" strokeWidth="1.5" fill="#FFF0F0" transform="rotate(8,221,150)"/>
      <text x="172" y="152" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#446" transform="rotate(-8,181,150)">heartfelt</text>
      <text x="211" y="151" fontFamily="Patrick Hand, cursive" fontSize="6.5" fill="#844" transform="rotate(8,221,150)">RENO</text>
      <circle cx="55" cy="200" r="12" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <circle cx="95" cy="198" r="12" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <path d="M 88 194 Q 95 188 102 194" stroke="#888" strokeWidth="1.5" fill="none"/>
      <circle cx="135" cy="200" r="12" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <circle cx="310" cy="218" r="12" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <line x1="310" y1="230" x2="310" y2="240" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <text x="298" y="206" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">*faints*</text>
      <circle cx="265" cy="200" r="11" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <circle cx="340" cy="200" r="11" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <rect x="242" y="225" width="12" height="15" rx="2" stroke="#222" strokeWidth="1.5" fill="#FFFEF0"/>
      <circle cx="248" cy="220" r="8" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
      <path d="M 236 223 L 240 232 L 258 232 L 262 223" stroke="#222" strokeWidth="1.5" fill="#FFFFFF"/>
    </svg>
  );
}

function SvgLevel5() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".nF{animation:nF 2s ease-in-out infinite}@keyframes nF{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}"}</style>
      <rect x="80" y="30" width="240" height="230" rx="4" stroke="#222" strokeWidth="3" fill="#E8E0D0"/>
      <rect x="80" y="30" width="240" height="18" rx="2" stroke="#222" strokeWidth="2" fill="#C8C0A8"/>
      <rect x="80" y="240" width="240" height="20" stroke="#222" strokeWidth="2" fill="#C8C0A8"/>
      <line x1="100" y1="48" x2="100" y2="240" stroke="#888" strokeWidth="1" strokeDasharray="4,4"/>
      <line x1="300" y1="48" x2="300" y2="240" stroke="#888" strokeWidth="1" strokeDasharray="4,4"/>
      <rect x="295" y="100" width="55" height="120" rx="4" stroke="#222" strokeWidth="2" fill="#D0C8B4"/>
      <rect x="302" y="112" width="41" height="36" rx="4" stroke="#222" strokeWidth="2" fill="#A8D4A8"/>
      <text x="322" y="127" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#1A4A1A">THE</text>
      <text x="322" y="139" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#1A4A1A">TRUTH</text>
      <rect x="302" y="158" width="41" height="48" rx="4" stroke="#222" strokeWidth="2" fill="#D4A0A0"/>
      <text x="322" y="172" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#4A1A1A">A REALLY</text>
      <text x="322" y="183" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#4A1A1A">CONVINCING</text>
      <text x="322" y="194" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#4A1A1A">LIE</text>
      <text x="298" y="222" fontFamily="Patrick Hand, cursive" fontSize="6.5" fill="#666">Floor π</text>
      <text x="298" y="233" fontFamily="Patrick Hand, cursive" fontSize="6" fill="#666">Basement of Regret</text>
      <StickFigure cx={185} cy={115} scale={0.9} mood="shocked"/>
      <g className="nF" style={{transformOrigin:'140px 90px'}}><text x="125" y="92" fontFamily="serif" fontSize="22" fill="#7A5A3A">♪</text></g>
      <g className="nF" style={{transformOrigin:'162px 68px',animationDelay:'0.5s'}}><text x="150" y="70" fontFamily="serif" fontSize="16" fill="#7A5A3A">♫</text></g>
      <g className="nF" style={{transformOrigin:'118px 112px',animationDelay:'1s'}}><text x="106" y="114" fontFamily="serif" fontSize="14" fill="#7A5A3A">♩</text></g>
      <rect x="88" y="200" width="110" height="32" rx="2" stroke="#888" strokeWidth="1" fill="#FFFCE0"/>
      <text x="143" y="213" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7.5" fill="#444">Dept. of Metaphorical</text>
      <text x="143" y="224" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7.5" fill="#444">Transportation</text>
      <text x="143" y="233" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">Last inspected: never</text>
    </svg>
  );
}

function SvgLevel6() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".sB{animation:sB 1.8s ease-in-out infinite}@keyframes sB{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-7deg)}}"}</style>
      <path d="M 0 195 Q 100 185 200 192 Q 300 198 400 188 L 400 280 L 0 280 Z" fill="#F5E8C0" stroke="#D4C088" strokeWidth="1"/>
      <path d="M 0 188 Q 50 183 100 190 Q 200 184 300 186 Q 350 193 400 182" stroke="#4AA4D4" strokeWidth="2" fill="none"/>
      <rect x="155" y="196" width="105" height="40" rx="3" stroke="#E07030" strokeWidth="1.5" fill="#F08840"/>
      <g className="sB" style={{transformOrigin:'225px 195px'}}>
        <ellipse cx="225" cy="198" rx="22" ry="14" stroke="#222" strokeWidth="2" fill="#F8F8F8"/>
        <ellipse cx="241" cy="196" rx="10" ry="8" stroke="#222" strokeWidth="1.5" fill="#F0F0F0"/>
        <path d="M 249 196 L 264 198 L 249 202 Z" stroke="#222" strokeWidth="1.5" fill="#F0B840"/>
        <circle cx="247" cy="193" r="2.5" fill="#222"/>
        <line x1="240" y1="192" x2="247" y2="193" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 219 208 L 214 220" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 229" y1="208" x2="226" y2="220" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="268" cy="198" rx="14" ry="8" stroke="#A04010" strokeWidth="1.5" fill="#C06020"/>
        <path d="M 256 193 Q 268 190 280 194" stroke="#808030" strokeWidth="1.5" fill="none"/>
      </g>
      <circle cx="295" cy="204" r="13" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <line x1="295" y1="217" x2="295" y2="240" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="295" y1="226" x2="282" y2="238" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="295" y1="226" x2="308" y2="238" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 289 208 Q 295 213 301 208" stroke="#222" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 288 213 Q 285 218 288 222" stroke="#4AA4D4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 302 213 Q 305 218 302 222" stroke="#4AA4D4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <text x="295" y="258" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">*crying toddler*</text>
      <StickFigure cx={100} cy={155} scale={0.85} mood="neutral"/>
      <ellipse cx="123" cy="206" rx="14" ry="8" stroke="#A04010" strokeWidth="1.5" fill="#C06020"/>
      <path d="M 112 202 Q 123 199 134 203" stroke="#808030" strokeWidth="1.5" fill="none"/>
      <ellipse cx="365" cy="220" rx="25" ry="12" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
      <text x="365" y="225" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">Zzz (parent)</text>
    </svg>
  );
}

function SvgLevel7() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".bP{animation:bP 1.5s ease-in-out infinite}@keyframes bP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(1.07)}}.fB{animation:fB 2s ease-in-out infinite}@keyframes fB{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <StickFigure cx={125} cy={120} scale={0.95} mood="worried"/>
      <rect x="145" y="155" width="28" height="46" rx="5" stroke="#222" strokeWidth="2" fill="#333"/>
      <rect x="148" y="161" width="22" height="32" rx="1" fill="#4AF"/>
      <text x="152" y="174" fontFamily="Patrick Hand, cursive" fontSize="6.5" fill="#fff">3:17 AM</text>
      <text x="152" y="184" fontFamily="Patrick Hand, cursive" fontSize="6" fill="#8ef">typing...</text>
      <g className="bP" style={{transformOrigin:'225px 118px'}}>
        <ellipse cx="225" cy="113" rx="48" ry="40" stroke="#FF6B00" strokeWidth="2.5" fill="#FFE0C0" opacity="0.9"/>
        <path d="M 196 106 Q 205 93 215 103 Q 220 92 230 100 Q 236 88 246 99 Q 252 93 257 107" stroke="#E06000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 198 120 Q 210 132 220 120 Q 228 132 240 118 Q 247 130 254 120" stroke="#E06000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="212" cy="113" r="5.5" fill="#222"/>
        <circle cx="238" cy="113" r="5.5" fill="#222"/>
        <circle cx="214" cy="111" r="2" fill="white"/>
        <circle cx="240" cy="111" r="2" fill="white"/>
        <text x="225" y="145" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#A04000">BRAIN.exe</text>
      </g>
      <path d="M 172 158 Q 195 140 208 128" stroke="#FF6B00" strokeWidth="1.5" fill="none" strokeDasharray="4,3"/>
      <g className="fB" style={{transformOrigin:'300px 130px'}}>
        <rect x="268" y="115" width="72" height="32" rx="10" stroke="#222" strokeWidth="1.5" fill="#DCF8C6"/>
        <path d="M 272 147 L 265 162 L 284 147" stroke="#222" strokeWidth="1.5" fill="#DCF8C6"/>
        <text x="304" y="129" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#1A4A1A">"You're amazing"</text>
        <text x="304" y="141" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#1A4A1A">♥ ♥ ♥</text>
      </g>
      <g className="fB" style={{transformOrigin:'300px 68px',animationDelay:'0.8s'}}>
        <rect x="268" y="52" width="72" height="30" rx="10" stroke="#222" strokeWidth="1.5" fill="#DCF8C6"/>
        <text x="304" y="65" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#1A4A1A">"Great meeting!"</text>
        <text x="304" y="77" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#1A4A1A">★ raise approved</text>
      </g>
    </svg>
  );
}

function SvgLevel8() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".rW{animation:rW 3s ease-in-out infinite}@keyframes rW{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(0.08)}}.pW{animation:pW 1.5s ease-in-out infinite}@keyframes pW{0%,100%{transform:rotate(0deg)}50%{transform:rotate(16deg)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="150" y="120" width="100" height="120" rx="2" stroke="#222" strokeWidth="2" fill="#D4AA60"/>
      <ellipse cx="200" cy="118" rx="42" ry="14" fill="#FFE060" opacity="0.5"/>
      <ellipse cx="200" cy="102" rx="30" ry="22" stroke="#222" strokeWidth="2.5" fill="#E8F4E8"/>
      <path d="M 176 102 L 170 122 Q 200 130 230 122 L 224 102" stroke="#222" strokeWidth="2" fill="#E8F4E8"/>
      <ellipse cx="200" cy="102" rx="30" ry="9" stroke="#222" strokeWidth="2" fill="#C8E8C8"/>
      <ellipse cx="200" cy="106" rx="38" ry="28" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.6"/>
      <text x="200" y="110" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="12" fill="#2A5A2A">PURPOSE</text>
      <StickFigure cx={325} cy={90} scale={0.8} mood="happy"/>
      <text x="308" y="82" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#555">Going once...</text>
      <rect x="294" y="173" width="62" height="8" rx="2" stroke="#222" strokeWidth="1.5" fill="#8B4513"/>
      <line x1="325" y1="181" x2="325" y2="173" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="318" y1="155" x2="325" y2="140" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="326" cy="136" rx="11" ry="9" stroke="#222" strokeWidth="1.5" fill="#F0F0F0"/>
      <text x="326" y="140" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">14</text>
      <path d="M 55 178 L 50 240 L 100 240 L 95 178 Z" stroke="#222" strokeWidth="2" fill="#8B6914"/>
      <ellipse cx="75" cy="165" rx="20" ry="18" stroke="#222" strokeWidth="2" fill="#C8A878"/>
      <ellipse cx="67" cy="162" rx="8" ry="6" fill="#555"/>
      <ellipse cx="83" cy="162" rx="8" ry="6" fill="#555"/>
      <ellipse cx="67" cy="162" rx="5" ry="4" fill="#C8A878"/>
      <ellipse cx="83" cy="162" rx="5" ry="4" fill="#C8A878"/>
      <circle cx="67" cy="162" r="3" fill="#111" className="rW"/>
      <circle cx="83" cy="162" r="3" fill="#111"/>
      <ellipse cx="75" cy="170" rx="4" ry="3" fill="#555"/>
      <path d="M 58 150 Q 55 139 64 144" stroke="#222" strokeWidth="1.5" fill="#C8A878"/>
      <path d="M 92 150 Q 95 139 86 144" stroke="#222" strokeWidth="1.5" fill="#C8A878"/>
      <g className="pW" style={{transformOrigin:'101px 200px'}}>
        <line x1="98" y1="198" x2="112" y2="184" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="115" cy="181" rx="8" ry="6" stroke="#222" strokeWidth="1.5" fill="#F0F0F0"/>
        <text x="115" y="185" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="6" fill="#333">14</text>
      </g>
      <rect x="43" y="205" width="18" height="14" rx="2" stroke="#222" strokeWidth="1.5" fill="#6B4F10"/>
      <line x1="49" y1="205" x2="55" y2="205" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <text x="200" y="148" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#555">Bidding: $47,000</text>
    </svg>
  );
}

function SvgLevel9() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".mT{animation:mT 0.5s steps(1) infinite}@keyframes mT{0%{opacity:1}50%{opacity:0.3}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="20" y="50" width="360" height="20" rx="2" stroke="#222" strokeWidth="2" fill="#D4D4D4"/>
      <rect x="20" y="70" width="8" height="170" stroke="#222" strokeWidth="1.5" fill="#C4C4C4"/>
      <rect x="372" y="70" width="8" height="170" stroke="#222" strokeWidth="1.5" fill="#C4C4C4"/>
      <rect x="308" y="140" width="35" height="80" rx="4" stroke="#222" strokeWidth="2" fill="#E8E0C8"/>
      <rect x="313" y="148" width="25" height="20" rx="2" stroke="#222" strokeWidth="1.5" fill="#001A00"/>
      <text x="325" y="162" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#00FF00" className="mT">$4.59/gal</text>
      <path d="M 308 188 Q 296 186 290 193" stroke="#444" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="160" y="118" width="80" height="112" rx="4" stroke="#222" strokeWidth="2.5" fill="#D4D0C0"/>
      <rect x="168" y="126" width="64" height="58" rx="2" stroke="#222" strokeWidth="2" fill="#001A00"/>
      <text x="172" y="140" fontFamily="IBM Plex Mono, monospace" fontSize="6.5" fill="#00FF00" className="mT">0010 1101</text>
      <text x="172" y="151" fontFamily="IBM Plex Mono, monospace" fontSize="6.5" fill="#00CC00">YOUR_NAME.</text>
      <text x="172" y="162" fontFamily="IBM Plex Mono, monospace" fontSize="6.5" fill="#00FF00">confidence</text>
      <text x="172" y="173" fontFamily="IBM Plex Mono, monospace" fontSize="6.5" fill="#00FF00">= 0.3</text>
      <text x="172" y="181" fontFamily="IBM Plex Mono, monospace" fontSize="5.5" fill="#008800" className="mT">// change to 1.0?</text>
      <rect x="170" y="188" width="60" height="30" rx="2" stroke="#444" strokeWidth="1" fill="#C0BC98"/>
      <circle cx="181" cy="199" r="4" stroke="#444" strokeWidth="1" fill="#A0A090"/>
      <circle cx="196" cy="199" r="4" stroke="#444" strokeWidth="1" fill="#A0A090"/>
      <circle cx="211" cy="199" r="4" stroke="#444" strokeWidth="1" fill="#A0A090"/>
      <circle cx="181" cy="211" r="4" stroke="#444" strokeWidth="1" fill="#A0A090"/>
      <circle cx="196" cy="211" r="4" stroke="#444" strokeWidth="1" fill="#A0A090"/>
      <circle cx="211" cy="211" r="4" stroke="#444" strokeWidth="1" fill="#A0A090"/>
      <StickFigure cx={82} cy={125} scale={0.85} mood="neutral"/>
      <rect x="54" y="102" width="40" height="14" rx="2" stroke="#888" strokeWidth="1" fill="#FFFCE0"/>
      <text x="74" y="113" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#333">DOUG</text>
      <StickFigure cx={280} cy={130} scale={0.85} mood="worried"/>
      <SweatDrops cx={280} cy={130}/>
      <rect x="90" y="70" width="155" height="40" rx="8" stroke="#222" strokeWidth="1.5" fill="#FFFEF0"/>
      <path d="M 105 110 L 92 126 L 118 110" stroke="#222" strokeWidth="1.5" fill="#FFFEF0"/>
      <text x="168" y="87" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#222">"This is all a simulation."</text>
      <text x="168" y="102" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">- Doug, developer</text>
    </svg>
  );
}

function SvgLevel10() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".sW{animation:sW 2s ease-in-out infinite}@keyframes sW{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-9deg)}}.gF{animation:gF 1.5s ease-in-out infinite}@keyframes gF{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.06)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="200" cy="188" rx="172" ry="56" stroke="#222" strokeWidth="2.5" fill="#C8A848"/>
      <ellipse cx="200" cy="188" rx="164" ry="49" stroke="#888" strokeWidth="1" fill="none" strokeDasharray="5,4"/>
      <StickFigure cx={200} cy={68} scale={0.75} mood="worried"/>
      <SweatDrops cx={200} cy={68}/>
      <text x="200" y="55" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#666">YOU</text>
      <g transform="translate(42,162)">
        <rect x="-10" y="0" width="20" height="28" rx="3" stroke="#222" strokeWidth="1.5" fill="#E8E0C8"/>
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#222" strokeWidth="1.5"/>
        <rect x="-16" y="-20" width="32" height="8" rx="1" stroke="#222" strokeWidth="1.5" fill="#222"/>
        <rect x="6" y="-16" width="9" height="9" rx="1" fill="#FFD700" stroke="#B8A800" strokeWidth="1"/>
        <circle cx="0" cy="8" r="7" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
        <circle cx="-2" cy="6" r="1.5" fill="#222"/>
        <circle cx="2" cy="6" r="1.5" fill="#222"/>
        <text x="0" y="40" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">college</text>
        <text x="0" y="50" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">you avoided</text>
      </g>
      <g transform="translate(108,150)">
        <rect x="-10" y="0" width="20" height="28" rx="3" stroke="#222" strokeWidth="1.5" fill="#E8E0C8"/>
        <circle cx="0" cy="8" r="8" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
        <circle cx="-2" cy="6" r="1.5" fill="#222"/>
        <circle cx="2" cy="6" r="1.5" fill="#222"/>
        <path d="M -3 13 Q 0 16 3 13" stroke="#E05080" strokeWidth="1.5" fill="none"/>
        <path d="M -6 -6 Q -6 -13 0 -9 Q 6 -13 6 -6 Q 6 -2 0 2 Q -6 -2 -6 -6 Z" stroke="#E05080" strokeWidth="1.5" fill="#FFB0C8"/>
        <text x="0" y="40" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">person</text>
        <text x="0" y="50" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">you didn't ask</text>
      </g>
      <g transform="translate(292,150)" className="gF">
        <rect x="-10" y="0" width="20" height="28" rx="3" stroke="#222" strokeWidth="1.5" fill="#E8E0C8"/>
        <circle cx="0" cy="5" r="9" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
        <ellipse cx="-25" cy="3" rx="6" ry="9" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
        <line x1="-10" y1="5" x2="-20" y2="3" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="25" cy="3" rx="6" ry="9" stroke="#222" strokeWidth="1.5" fill="#FFF5E0"/>
        <line x1="10" y1="5" x2="20" y2="3" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <text x="0" y="40" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">gym card</text>
        <text x="0" y="50" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">(disappointed)</text>
      </g>
      <g transform="translate(358,164)" className="sW">
        <rect x="-10" y="0" width="20" height="28" rx="3" stroke="#222" strokeWidth="1.5" fill="#E8E0C8"/>
        <ellipse cx="0" cy="5" rx="16" ry="10" stroke="#222" strokeWidth="1.5" fill="#D4E8B8"/>
        <path d="M -10 5 Q 0 15 10 5" stroke="#222" strokeWidth="1.5" fill="#B8D8A0"/>
        <path d="M -5 -3 Q -7 -13 -3 -8" stroke="#5A8A2A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 4 -4 Q 6 -14 8 -10" stroke="#8A8A2A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <text x="0" y="40" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">salad</text>
        <text x="0" y="50" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">(resentful)</text>
      </g>
    </svg>
  );
}

function SvgLevel11() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".wP{animation:wP 2s ease-in-out infinite}@keyframes wP{0%,100%{opacity:0.4}50%{opacity:1}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="222" y1="40" x2="222" y2="240" stroke="#222" strokeWidth="4" strokeLinecap="round"/>
      <text x="100" y="56" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#888">YOUR PLACE</text>
      <text x="312" y="56" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#888">NEIGHBOR</text>
      <StickFigure cx={100} cy={128} scale={0.9} mood="smug"/>
      <rect x="62" y="186" width="76" height="48" rx="2" stroke="#222" strokeWidth="2" fill="#D8D8D8"/>
      <rect x="65" y="190" width="70" height="38" rx="1" stroke="#333" strokeWidth="1" fill="#001820"/>
      <text x="100" y="202" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="5.5" fill="#00FF88">FBI Surveillance Van 4</text>
      <text x="100" y="212" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="5" fill="#FF8800">We Know It's You</text>
      <text x="100" y="221" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="5" fill="#FF8800">Apt 4B ← connected</text>
      <rect x="56" y="234" width="88" height="6" rx="2" stroke="#444" strokeWidth="1" fill="#C0C0C0"/>
      <g className="wP">
        <path d="M 222 118 Q 244 98 262 118" stroke="#2255FF" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M 222 130 Q 252 100 280 130" stroke="#2255FF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M 222 142 Q 256 100 292 142" stroke="#2255FF" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/>
      </g>
      <rect x="260" y="138" width="42" height="26" rx="3" stroke="#222" strokeWidth="2" fill="#D8D0C8"/>
      <line x1="268" y1="138" x2="265" y2="122" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="281" y1="138" x2="281" y2="120" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="294" y1="138" x2="297" y2="122" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="312" cy="118" r="12" stroke="#222" strokeWidth="2" fill="#FFF5E0"/>
      <line x1="312" y1="130" x2="312" y2="168" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="312" y1="143" x2="297" y2="156" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="312" y1="143" x2="327" y2="153" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="312" y1="168" x2="302" y2="190" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="312" y1="168" x2="322" y2="190" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <text x="312" y="206" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">*mysterious*</text>
    </svg>
  );
}

function SvgLevel12() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".cG{animation:cG 2s ease-in-out infinite}@keyframes cG{0%,100%{filter:drop-shadow(0 0 4px #C08040)}50%{filter:drop-shadow(0 0 14px #F0A020)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="165" y="158" width="70" height="82" rx="2" stroke="#222" strokeWidth="2.5" fill="#E8E0D0"/>
      <rect x="156" y="235" width="88" height="5" rx="1" stroke="#222" strokeWidth="1.5" fill="#D8D0C0"/>
      <line x1="132" y1="165" x2="132" y2="215" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="132" cy="162" r="5" stroke="#888" strokeWidth="1.5" fill="#FFD700"/>
      <line x1="268" y1="165" x2="268" y2="215" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="268" cy="162" r="5" stroke="#888" strokeWidth="1.5" fill="#FFD700"/>
      <path d="M 132 170 Q 200 164 268 170" stroke="#8B0020" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <g className="cG" style={{transformOrigin:'200px 173px'}}>
        <rect x="182" y="155" width="36" height="30" rx="3" stroke="#222" strokeWidth="2.5" fill="#E8D5B8"/>
        <path d="M 218 162 Q 229 162 229 172 Q 229 182 218 182" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <ellipse cx="200" cy="155" rx="18" ry="5" stroke="#222" strokeWidth="1.5" fill="#C08040"/>
        <path d="M 192 148 Q 190 139 194 132" stroke="#888" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 200 146 Q 198 136 202 129" stroke="#888" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 208 148 Q 211 138 207 132" stroke="#888" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </g>
      <rect x="162" y="194" width="76" height="30" rx="1" stroke="#888" strokeWidth="1" fill="#FFFCE0"/>
      <text x="200" y="207" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7.5" fill="#333">Untitled (Medium Roast, 2026)</text>
      <text x="200" y="218" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">On Loan from the Artist</text>
      <StickFigure cx={68} cy={155} scale={0.7} mood="happy"/>
      <rect x="40" y="178" width="20" height="14" rx="2" stroke="#222" strokeWidth="1.5" fill="#333"/>
      <circle cx="50" cy="185" r="5" stroke="#333" strokeWidth="1" fill="#111"/>
      <StickFigure cx={342} cy={155} scale={0.7} mood="happy"/>
      <rect x="340" y="178" width="20" height="14" rx="2" stroke="#222" strokeWidth="1.5" fill="#333"/>
      <circle cx="350" cy="185" r="5" stroke="#333" strokeWidth="1" fill="#111"/>
      <StickFigure cx={50} cy={100} scale={0.65} mood="shocked"/>
      <text x="50" y="86" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">you (shoe untied)</text>
      <StickFigure cx={358} cy={100} scale={0.65} mood="smug"/>
      <text x="358" y="86" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">guard</text>
    </svg>
  );
}

function SvgLevel13() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".gF2{animation:gF2 3s ease-in-out infinite}@keyframes gF2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}.dB{animation:dB 2s ease-in-out alternate infinite}@keyframes dB{from{transform:translateY(0)}to{transform:translateY(-4px)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 40 240 L 40 138 Q 70 126 100 136 L 168 126 L 210 138 L 210 240 Z" stroke="#222" strokeWidth="2" fill="#A8C870"/>
      <path d="M 0 200 Q 30 188 40 200" stroke="#4AA4D4" strokeWidth="2" fill="none"/>
      <path d="M 0 220 Q 22 206 40 220 Q 25 232 0 240 Z" fill="#B8E0F0"/>
      <rect x="95" y="56" width="54" height="82" rx="3" stroke="#222" strokeWidth="2.5" fill="#F0F0F0"/>
      <path d="M 95 56 L 122 28 L 149 56 Z" stroke="#222" strokeWidth="2.5" fill="#E05050"/>
      <rect x="104" y="66" width="36" height="26" rx="2" stroke="#222" strokeWidth="1.5" fill="#FFFCE0"/>
      <path d="M 122 28 Q 162 50 225 78" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/>
      <g className="gF2" style={{transformOrigin:'122px 86px'}}>
        <ellipse cx="122" cy="83" rx="13" ry="15" stroke="#888" strokeWidth="1.5" fill="white" opacity="0.85"/>
        <path d="M 109 93 Q 112 100 115 95 Q 118 100 122 95 Q 126 100 129 95 Q 132 100 135 93" stroke="#888" strokeWidth="1.5" fill="white" opacity="0.85"/>
        <circle cx="118" cy="81" r="2.5" fill="#555"/>
        <circle cx="126" cy="81" r="2.5" fill="#555"/>
        <path d="M 118 88 Q 122 91 126 88" stroke="#555" strokeWidth="1" fill="none"/>
      </g>
      <g className="dB"><ellipse cx="240" cy="233" rx="12" ry="8" stroke="#E8A800" strokeWidth="1.5" fill="#FFD700"/><circle cx="246" cy="227" r="6" stroke="#E8A800" strokeWidth="1.5" fill="#FFD700"/><path d="M 250 227 L 258 227 L 254 231 Z" fill="#FF8000" stroke="#CC6000" strokeWidth="1"/><circle cx="247" cy="225" r="1.5" fill="#222"/><text x="240" y="248" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">Gerald</text></g>
      <g className="dB" style={{animationDelay:'0.3s'}}><ellipse cx="278" cy="235" rx="10" ry="7" stroke="#E8A800" strokeWidth="1.5" fill="#FFD700"/><circle cx="284" cy="229" r="5" stroke="#E8A800" strokeWidth="1.5" fill="#FFD700"/><path d="M 287 229 L 294 229 L 291 232 Z" fill="#FF8000" stroke="#CC6000" strokeWidth="1"/><circle cx="285" cy="227" r="1.5" fill="#222"/></g>
      <g className="dB" style={{animationDelay:'0.6s'}}><ellipse cx="312" cy="232" rx="10" ry="7" stroke="#E8A800" strokeWidth="1.5" fill="#FFD700"/><circle cx="318" cy="226" r="5" stroke="#E8A800" strokeWidth="1.5" fill="#FFD700"/><path d="M 321 226 L 328 226 L 325 229 Z" fill="#FF8000" stroke="#CC6000" strokeWidth="1"/><circle cx="319" cy="224" r="1.5" fill="#222"/></g>
      <text x="276" y="258" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">4,000 rubber ducks (individually named)</text>
      <StickFigure cx={348} cy={118} scale={0.8} mood="shocked"/>
      <rect x="310" y="152" width="46" height="56" rx="3" stroke="#222" strokeWidth="1.5" fill="#FFFCE0"/>
      <path d="M 306 152 Q 298 140 306 128 L 356 128 Q 364 140 356 152" stroke="#222" strokeWidth="1.5" fill="#FFFCE0"/>
      <text x="333" y="166" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">FINISH</text>
      <text x="333" y="178" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">WHAT I</text>
      <text x="333" y="190" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">STARTED</text>
      <text x="333" y="202" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">- Mortimer</text>
    </svg>
  );
}

function SvgLevel14() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="80" y="140" width="240" height="100" rx="3" stroke="#222" strokeWidth="2.5" fill="#E8D5B0"/>
      <rect x="80" y="140" width="240" height="20" rx="3" stroke="#222" strokeWidth="1.5" fill="#D4C4A0"/>
      <rect x="90" y="148" width="60" height="12" rx="1" stroke="#888" strokeWidth="1" fill="#C8E8C8"/>
      <rect x="164" y="148" width="72" height="12" rx="1" stroke="#888" strokeWidth="1" fill="#FFE0C0"/>
      <rect x="248" y="148" width="62" height="12" rx="1" stroke="#888" strokeWidth="1" fill="#C8E8C8"/>
      <rect x="150" y="98" width="52" height="16" rx="2" stroke="#888" strokeWidth="1" fill="#FFFCE0"/>
      <text x="176" y="110" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#333">MARCO</text>
      <StickFigure cx={200} cy={88} scale={0.8} mood="worried"/>
      <rect x="156" y="162" width="88" height="34" rx="3" stroke="#D4AA20" strokeWidth="2" fill="#F0D060"/>
      <rect x="158" y="172" width="84" height="8" rx="1" stroke="#A04010" strokeWidth="1" fill="#E8A060"/>
      <rect x="158" y="178" width="84" height="6" rx="1" stroke="#408040" strokeWidth="1" fill="#80C860"/>
      <rect x="158" y="182" width="84" height="8" rx="1" stroke="#D4AA20" strokeWidth="1.5" fill="#F0D060"/>
      <text x="200" y="210" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#666">~perfect~</text>
      <circle cx="348" cy="82" r="34" stroke="#222" strokeWidth="2.5" fill="#FFF5E0"/>
      <circle cx="348" cy="82" r="3" fill="#222"/>
      <line x1="348" y1="82" x2="348" y2="54" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="348" y1="82" x2="364" y2="82" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <text x="348" y="50" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">12</text>
      <text x="348" y="120" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">6</text>
      <text x="312" y="86" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">9</text>
      <text x="385" y="86" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">3</text>
      <g opacity="0.18" transform="translate(-5,-4)"><rect x="156" y="162" width="88" height="34" rx="3" stroke="#D4AA20" strokeWidth="1.5" fill="#F0D060"/></g>
      <g opacity="0.1" transform="translate(-10,-8)"><rect x="156" y="162" width="88" height="34" rx="3" stroke="#D4AA20" strokeWidth="1" fill="#F0D060"/></g>
      <StickFigure cx={80} cy={95} scale={0.75} mood="smug"/>
      <text x="80" y="82" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7.5" fill="#666">you (loop 847)</text>
      <text x="200" y="260" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">loop iteration 847 of ∞</text>
    </svg>
  );
}

function SvgLevel15() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".jG{animation:jG 2s ease-in-out infinite}@keyframes jG{0%,80%,100%{transform:rotate(0deg)}90%{transform:rotate(-22deg)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="118" y="48" width="164" height="92" rx="3" stroke="#222" strokeWidth="2.5" fill="#C8A040"/>
      <ellipse cx="200" cy="66" rx="28" ry="22" stroke="#222" strokeWidth="2.5" fill="#D4A878"/>
      <path d="M 174 60 Q 162 53 164 76 Q 168 87 178 80 L 174 60" stroke="#222" strokeWidth="2" fill="#C89060"/>
      <path d="M 226 60 Q 238 53 236 76 Q 232 87 222 80 L 226 60" stroke="#222" strokeWidth="2" fill="#C89060"/>
      <path d="M 172 53 Q 200 28 228 53 L 228 60 Q 200 38 172 60 Z" stroke="#222" strokeWidth="1.5" fill="#F5F5F5"/>
      <path d="M 172 60 Q 163 72 167 83" stroke="#F5F5F5" strokeWidth="4.5" strokeLinecap="round"/>
      <path d="M 228 60 Q 237 72 233 83" stroke="#F5F5F5" strokeWidth="4.5" strokeLinecap="round"/>
      <circle cx="191" cy="63" r="4" fill="#222"/>
      <circle cx="209" cy="63" r="4" fill="#222"/>
      <ellipse cx="200" cy="73" rx="8" ry="6" fill="#A06030"/>
      <path d="M 193 78 Q 200 83 207 78" stroke="#222" strokeWidth="1.5" fill="none"/>
      <g className="jG" style={{transformOrigin:'236px 50px'}}>
        <line x1="236" y1="50" x2="256" y2="36" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
        <rect x="253" y="30" width="18" height="12" rx="2" stroke="#222" strokeWidth="1.5" fill="#6B3510"/>
      </g>
      <g transform="translate(55,140)">
        <rect x="-15" y="15" width="30" height="50" rx="3" stroke="#222" strokeWidth="1.5" fill="#484858"/>
        <line x1="-4" y1="15" x2="-4" y2="55" stroke="#888" strokeWidth="1" strokeDasharray="3,3"/>
        <path d="M -2 15 L -3 32 L 0 30 L 3 32 L 2 15 Z" stroke="#222" strokeWidth="1" fill="#CC2020"/>
        <circle cx="0" cy="8" r="16" stroke="#222" strokeWidth="2" fill="#888898"/>
        <path d="M -12 -2 L -18 -16 L -4 -6" stroke="#222" strokeWidth="1.5" fill="#888898"/>
        <path d="M 12 -2 L 18 -16 L 4 -6" stroke="#222" strokeWidth="1.5" fill="#888898"/>
        <ellipse cx="-5" cy="8" rx="4" ry="5" fill="#111"/>
        <ellipse cx="5" cy="8" rx="4" ry="5" fill="#111"/>
        <ellipse cx="0" cy="13" rx="4" ry="3" fill="#C08080"/>
        <rect x="18" y="35" width="18" height="14" rx="2" stroke="#222" strokeWidth="1.5" fill="#8B4513"/>
        <line x1="23" y1="35" x2="29" y2="35" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <text x="0" y="78" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#444">cat lawyer</text>
      </g>
      <rect x="162" y="145" width="52" height="45" rx="2" stroke="#222" strokeWidth="1.5" fill="#D4C8A0"/>
      <ellipse cx="188" cy="142" rx="16" ry="14" stroke="#222" strokeWidth="2" fill="#E8C898"/>
      <ellipse cx="176" cy="138" rx="7" ry="8" fill="#F0D8B8"/>
      <ellipse cx="200" cy="138" rx="7" ry="8" fill="#F0D8B8"/>
      <circle cx="184" cy="140" r="3" fill="#222"/>
      <circle cx="192" cy="140" r="3" fill="#222"/>
      <ellipse cx="188" cy="147" rx="5" ry="4" fill="#E0A0A0"/>
      <path d="M 183 151 Q 188 155 193 151" stroke="#222" strokeWidth="1" fill="none"/>
      <text x="188" y="184" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">hamster</text>
      <rect x="248" y="120" width="142" height="82" rx="3" stroke="#222" strokeWidth="2" fill="#E8D8C0"/>
      <text x="319" y="138" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#555">JURY (12 dogs)</text>
      <ellipse cx="268" cy="164" rx="12" ry="10" stroke="#222" strokeWidth="1.5" fill="#D4A878"/>
      <ellipse cx="298" cy="162" rx="13" ry="11" stroke="#222" strokeWidth="1.5" fill="#F5E8D0"/>
      <ellipse cx="330" cy="164" rx="12" ry="10" stroke="#222" strokeWidth="1.5" fill="#8B6040"/>
      <ellipse cx="360" cy="162" rx="11" ry="10" stroke="#222" strokeWidth="1.5" fill="#D4A878"/>
      <ellipse cx="382" cy="206" rx="15" ry="18" stroke="#222" strokeWidth="1.5" fill="#C8F0FF" opacity="0.8"/>
      <ellipse cx="382" cy="206" rx="8" ry="6" fill="#FF8830"/>
      <path d="M 374 206 L 368 200 L 368 212 Z" fill="#FF8830"/>
      <text x="382" y="228" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">goldfish</text>
      <StickFigure cx={90} cy={188} scale={0.7} mood="worried"/>
      <SweatDrops cx={90} cy={188}/>
      <text x="90" y="174" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">YOU</text>
    </svg>
  );
}

function SvgLevel16() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="20" y="155" width="360" height="18" rx="3" stroke="#222" strokeWidth="2.5" fill="#C8A848"/>
      <line x1="40" y1="173" x2="40" y2="215" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <line x1="360" y1="173" x2="360" y2="215" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      <rect x="228" y="110" width="55" height="18" rx="2" stroke="#222" strokeWidth="1.5" fill="#FFFCE0"/>
      <rect x="235" y="94" width="41" height="18" rx="2" stroke="#222" strokeWidth="1.5" fill="#FFFCE0"/>
      <rect x="242" y="80" width="27" height="16" rx="2" stroke="#222" strokeWidth="1.5" fill="#FFFCE0"/>
      <circle cx="249" cy="76" r="4" fill="#FF88AA" stroke="#FF4488" strokeWidth="1"/>
      <circle cx="259" cy="78" r="3" fill="#FFB840" stroke="#FF8800" strokeWidth="1"/>
      <circle cx="266" cy="75" r="3" fill="#FF88AA" stroke="#FF4488" strokeWidth="1"/>
      <StickFigure cx={295} cy={108} scale={0.75} mood="worried"/>
      <text x="295" y="95" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#555">KAREN</text>
      <path d="M 284 115 Q 287 112 295 113 Q 303 112 307 115" stroke="#222" strokeWidth="1.5" fill="none"/>
      <ellipse cx="90" cy="140" rx="36" ry="20" stroke="#222" strokeWidth="2" fill="#E8D090"/>
      <ellipse cx="90" cy="140" rx="36" ry="8" stroke="#222" strokeWidth="1.5" fill="#D4B870"/>
      <text x="90" y="158" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">key lime pie</text>
      <rect x="108" y="128" width="38" height="18" rx="2" stroke="#E05050" strokeWidth="1.5" fill="#FFFCE0" transform="rotate(14,127,137)"/>
      <text x="127" y="136" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="6.5" fill="#E05050" transform="rotate(14,127,137)">$7.99</text>
      <text x="127" y="144" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="5.5" fill="#888" transform="rotate(14,127,137)">GAS STATION</text>
      <StickFigure cx={90} cy={98} scale={0.8} mood="smug"/>
      <ellipse cx="162" cy="148" rx="22" ry="10" stroke="#222" strokeWidth="1.5" fill="#C8E8B8"/>
      <text x="162" y="152" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#2A5A2A">homemade salad</text>
      <rect x="175" y="128" width="42" height="26" rx="3" stroke="#222" strokeWidth="1.5" fill="#F0C878"/>
      <text x="196" y="144" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#7A4010">lasagna (scratch)</text>
      <text x="90" y="260" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">"America's Okayest Pie"</text>
    </svg>
  );
}

function SvgLevel17() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".gC{animation:gC 2.5s ease-in-out infinite}@keyframes gC{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="50" y="196" width="300" height="12" rx="3" stroke="#222" strokeWidth="2.5" fill="#8B4513"/>
      <line x1="85" y1="208" x2="85" y2="236" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="315" y1="208" x2="315" y2="236" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="50" y="188" width="300" height="10" rx="2" stroke="#222" strokeWidth="2" fill="#6B3510"/>
      <ellipse cx="328" cy="200" rx="18" ry="10" stroke="#D4AA20" strokeWidth="2.5" fill="#E8C840" opacity="0.85"/>
      <path d="M 316 200 Q 312 216 316 224 Q 328 230 340 224 Q 344 216 340 200" stroke="#D4AA20" strokeWidth="2" fill="#E8C840"/>
      <ellipse cx="328" cy="224" rx="12" ry="4" stroke="#888" strokeWidth="1" fill="#C0A030"/>
      <path d="M 315 198 Q 294 180 274 184 Q 258 180 248 190" stroke="#AAA" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <g className="gC" style={{transformOrigin:'140px 150px'}}>
        <path d="M 110 175 Q 105 196 115 206 Q 140 216 165 206 Q 175 196 170 175 Z" stroke="#6888CC" strokeWidth="1.5" fill="#B8D4FF" opacity="0.85"/>
        <path d="M 128 175 L 126 196" stroke="#6888CC" strokeWidth="1" strokeDasharray="3,3"/>
        <rect x="118" y="192" width="44" height="6" rx="3" stroke="#6888CC" strokeWidth="1" fill="#8AAAE8"/>
        <ellipse cx="140" cy="175" rx="36" ry="20" fill="#B8D4FF" stroke="#6888CC" strokeWidth="1.5" opacity="0.85"/>
        <circle cx="140" cy="145" r="25" stroke="#222" strokeWidth="2" fill="#88BBDD"/>
        <ellipse cx="118" cy="145" rx="6" ry="9" stroke="#222" strokeWidth="1.5" fill="#88BBDD"/>
        <ellipse cx="162" cy="145" rx="6" ry="9" stroke="#222" strokeWidth="1.5" fill="#88BBDD"/>
        <ellipse cx="131" cy="142" rx="6" ry="7" fill="#001030"/>
        <ellipse cx="149" cy="142" rx="6" ry="7" fill="#001030"/>
        <path d="M 128 152 Q 140 147 152 152" stroke="#222" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 128 150 Q 125 157 128 163" stroke="#4AA4D4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 152 150 Q 155 157 152 163" stroke="#4AA4D4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="152" y="158" width="22" height="18" rx="2" stroke="#D4A020" strokeWidth="1.5" fill="#FFFCE0"/>
        <rect x="155" y="161" width="16" height="12" rx="1" stroke="#888" strokeWidth="1" fill="#C8E0FF"/>
        <text x="163" y="182" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">Cassandra...</text>
      </g>
      <text x="140" y="232" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#555">Dennis (3,000 yrs in lamp)</text>
      <StickFigure cx={292} cy={168} scale={0.8} mood="neutral"/>
      <text x="292" y="156" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">you (awkward)</text>
    </svg>
  );
}

function SvgLevel18() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="100" y="165" width="220" height="15" rx="2" stroke="#222" strokeWidth="2.5" fill="#C8A848"/>
      <line x1="118" y1="180" x2="118" y2="240" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="302" y1="180" x2="302" y2="240" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <StickFigure cx={300} cy={108} scale={0.85} mood="happy"/>
      <text x="300" y="95" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#555">interviewer</text>
      <rect x="330" y="148" width="18" height="20" rx="2" stroke="#222" strokeWidth="1.5" fill="#C87030"/>
      <ellipse cx="339" cy="145" rx="14" ry="12" stroke="#228822" strokeWidth="1.5" fill="#44CC44"/>
      <path d="M 330 148 Q 327 138 334 142" stroke="#228822" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 348 148 Q 352 136 344 140" stroke="#228822" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <text x="339" y="178" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">watching</text>
      <rect x="154" y="98" width="102" height="132" rx="2" stroke="#222" strokeWidth="2" fill="#FFFEF5"/>
      <text x="205" y="116" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#222">RESUME</text>
      <line x1="164" y1="120" x2="246" y2="120" stroke="#888" strokeWidth="1"/>
      <text x="167" y="132" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">• Hot Pocket expert (3yr)</text>
      <text x="167" y="146" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">• Parallel parked once</text>
      <text x="167" y="160" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">• Houseplant support</text>
      <text x="167" y="174" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#888">SPECIAL SKILLS:</text>
      <text x="167" y="188" fontFamily="Patrick Hand, cursive" fontSize="7" fill="#333">• Law&Order: any ep</text>
      <text x="167" y="200" fontFamily="Patrick Hand, cursive" fontSize="6.5" fill="#888">  by opening scene</text>
      <StickFigure cx={118} cy={108} scale={0.85} mood="smug"/>
      <line x1="135" y1="148" x2="152" y2="148" stroke="#888" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arrow)"/>
    </svg>
  );
}

function SvgLevel19() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".pG{animation:pG 2s ease-in-out infinite}@keyframes pG{0%,100%{opacity:0.6}50%{opacity:1}}"}</style>
      <line x1="0" y1="240" x2="400" y2="240" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="0" y="196" width="400" height="44" fill="#F5EDD5" stroke="#D4C8A0" strokeWidth="1"/>
      <rect x="0" y="160" width="400" height="40" stroke="#222" strokeWidth="1.5" fill="#E8D8B0"/>
      <line x1="0" y1="175" x2="400" y2="175" stroke="#888" strokeWidth="1" strokeDasharray="5,4"/>
      <line x1="50" y1="182" x2="82" y2="182" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
      <line x1="120" y1="182" x2="152" y2="182" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
      <g className="pG">
        <ellipse cx="318" cy="118" rx="52" ry="72" stroke="#6644FF" strokeWidth="4" fill="#8866FF" opacity="0.22"/>
        <ellipse cx="318" cy="118" rx="42" ry="60" stroke="#AABBFF" strokeWidth="2" fill="white" opacity="0.28"/>
        <path d="M 296 96 Q 318 74 340 96 Q 350 118 330 140 Q 308 157 292 140 Q 280 118 296 96" stroke="#6644FF" strokeWidth="1.5" fill="none" opacity="0.6"/>
      </g>
      <StickFigure cx={300} cy={98} scale={0.85} mood="smug"/>
      <path d="M 284 86 Q 289 74 300 77 Q 311 71 318 80" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <text x="300" y="84" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#4422CC">alt you</text>
      <StickFigure cx={100} cy={112} scale={0.9} mood="shocked"/>
      <SweatDrops cx={100} cy={112}/>
      <ellipse cx="122" cy="174" rx="23" ry="14" stroke="#222" strokeWidth="2" fill="#FFFCE0"/>
      <ellipse cx="122" cy="170" rx="23" ry="8" stroke="#222" strokeWidth="1.5" fill="#F0E8D0"/>
      <path d="M 108 168 L 112 166 L 116 169 L 111 171 Z" fill="#E8A840" stroke="#C08030" strokeWidth="0.5"/>
      <path d="M 122 166 L 126 164 L 130 167 L 125 170 Z" fill="#E8A840" stroke="#C08030" strokeWidth="0.5"/>
      <text x="122" y="196" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="8" fill="#888">Corn Flakes</text>
      <rect x="195" y="46" width="155" height="46" rx="8" stroke="#6644FF" strokeWidth="2" fill="#F8F4FF"/>
      <path d="M 270 92 L 306 114 L 285 92" stroke="#6644FF" strokeWidth="2" fill="#F8F4FF"/>
      <text x="272" y="63" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#4422CC">"In 1 hour: the most</text>
      <text x="272" y="76" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#4422CC">important decision of</text>
      <text x="272" y="89" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#4422CC">your life."</text>
    </svg>
  );
}

function SvgLevel20() {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <style>{".bPulse{animation:bPulse 1.2s ease-in-out infinite}@keyframes bPulse{0%,100%{opacity:0.8;r:16}50%{opacity:1;r:17}}"}</style>
      <rect x="0" y="0" width="400" height="280" fill="white"/>
      <line x1="0" y1="0" x2="200" y2="155" stroke="#EBEBEB" strokeWidth="1"/>
      <line x1="400" y1="0" x2="200" y2="155" stroke="#EBEBEB" strokeWidth="1"/>
      <line x1="0" y1="280" x2="200" y2="155" stroke="#EBEBEB" strokeWidth="1"/>
      <line x1="400" y1="280" x2="200" y2="155" stroke="#EBEBEB" strokeWidth="1"/>
      <line x1="0" y1="50" x2="400" y2="50" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <line x1="0" y1="100" x2="400" y2="100" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <line x1="0" y1="200" x2="400" y2="200" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <line x1="50" y1="0" x2="50" y2="280" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <line x1="150" y1="0" x2="150" y2="280" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <line x1="250" y1="0" x2="250" y2="280" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <line x1="350" y1="0" x2="350" y2="280" stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="8,8"/>
      <rect x="162" y="143" width="76" height="10" rx="2" stroke="#AAAAAA" strokeWidth="1.5" fill="#F8F8F8"/>
      <line x1="170" y1="153" x2="170" y2="182" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="230" y1="153" x2="230" y2="182" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="128" y1="175" x2="150" y2="175" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="132" y1="175" x2="132" y2="210" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="148" y1="175" x2="148" y2="210" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="130" y1="185" x2="150" y2="185" stroke="#CCCCCC" strokeWidth="1" strokeLinecap="round"/>
      <line x1="128" y1="210" x2="152" y2="210" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="200" cy="141" r="18" stroke="#CC0000" strokeWidth="2.5" fill="#FF2222" className="bPulse"/>
      <circle cx="200" cy="141" r="11" stroke="#FF5555" strokeWidth="1.5" fill="#FF4444"/>
      <circle cx="195" cy="136" r="3.5" fill="white" opacity="0.35"/>
      <circle cx="202" cy="210" r="8" stroke="#AAAAAA" strokeWidth="1.5" fill="#F8F8F8"/>
      <line x1="202" y1="218" x2="202" y2="235" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="202" y1="224" x2="192" y2="232" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="202" y1="224" x2="212" y2="232" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="202" y1="235" x2="195" y2="248" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="202" y1="235" x2="209" y2="248" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SvgTrophy(props) {
  var score = props.chaosScore || 0;
  if (score <= 4) {
    return (<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="55" rx="52" ry="19" stroke="#FFD700" strokeWidth="4" fill="none"/><ellipse cx="100" cy="55" rx="52" ry="19" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.3" transform="translate(2,2)"/><text x="100" y="60" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#AAA">slightly smudged</text><text x="100" y="130" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="38" fill="#FFD700">☆</text><text x="100" y="162" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="12" fill="#888">Participation Award</text></svg>);
  }
  if (score <= 8) {
    return (<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}><rect x="60" y="95" width="80" height="90" rx="4" stroke="#C0B880" strokeWidth="3" fill="#E8E0B0"/><path d="M 78 95 Q 60 55 100 46 Q 140 55 122 95" stroke="#C0B880" strokeWidth="3" fill="#E8E0B0"/><text x="100" y="76" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#888">Cautiously OK</text><text x="100" y="145" textAnchor="middle" fontFamily="serif" fontSize="34" fill="#C0B880">★</text></svg>);
  }
  if (score <= 12) {
    return (<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}><ellipse cx="100" cy="52" rx="52" ry="19" stroke="#888" strokeWidth="3" fill="none" strokeDasharray="62,22"/><path d="M 78 46 Q 90 36 100 50 Q 95 38 110 46" stroke="#888" strokeWidth="2" fill="none"/><text x="100" y="58" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="9" fill="#888">cracked halo</text><rect x="65" y="100" width="70" height="80" rx="3" stroke="#888" strokeWidth="2.5" fill="#E0E0E0"/><text x="100" y="145" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="18" fill="#888">¯\_(ツ)_/¯</text></svg>);
  }
  if (score <= 16) {
    return (<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}><line x1="80" y1="150" x2="145" y2="88" stroke="#8B4513" strokeWidth="8" strokeLinecap="round"/><rect x="108" y="76" width="50" height="28" rx="4" stroke="#6B3510" strokeWidth="3" fill="#8B4513" transform="rotate(-45,133,90)"/><path d="M 85 148 Q 80 133 91 127 Q 78 116 90 106 Q 84 96 98 92 Q 92 112 102 114 Q 96 128 108 130 Q 100 140 88 148 Z" fill="#FF6600" stroke="#FF4400" strokeWidth="1"/><path d="M 90 148 Q 87 140 94 134 Q 86 126 93 120 Q 97 130 98 128 Q 96 137 102 139 Q 97 144 90 148 Z" fill="#FFD700"/><text x="100" y="188" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#888">The Entropy Gavel</text></svg>);
  }
  return (<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}><path d="M 50 140 L 50 78 L 76 108 L 100 58 L 124 108 L 150 78 L 150 140 Z" stroke="#FF3366" strokeWidth="3" fill="#1A1A2E"/><circle cx="100" cy="58" r="9" fill="#FF3366"/><circle cx="76" cy="108" r="6" fill="#FF6600"/><circle cx="124" cy="108" r="6" fill="#FF6600"/><circle cx="50" cy="78" r="5" fill="#FFCC00"/><circle cx="150" cy="78" r="5" fill="#FFCC00"/><path d="M 50 140 Q 100 156 150 140" stroke="#FF3366" strokeWidth="2" fill="none"/><text x="100" y="133" textAnchor="middle" fontFamily="Permanent Marker, cursive" fontSize="13" fill="#FF3366">CHAOS</text><text x="100" y="180" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="10" fill="#888">Unhinged Visionary</text></svg>);
}

// ── SCENARIO DATA ────────────────────────────────────────────────────────────

var SCENARIOS = [
  { id:1, name:'The Startup', isSpectacle:true, scenario:'Welcome to your first day as CEO of a startup that exclusively manufactures those tiny tables that come in pizza boxes. Business is booming. But your lead engineer Gerald has informed you that the tables have become sentient. They\'re organizing. They\'ve unionized. They\'re demanding dental. Gerald suggests "the shredder." The tables are watching you right now from the break room. They have a spokesperson. His name is Table-othy.', choiceA:{ label:'Negotiate with Table-othy', consequence:'You sit across from Table-othy. He drives a hard bargain. The tables now have better health coverage than you do. Gerald quits in solidarity with the tables.', chaosValue:0 }, choiceB:{ label:'Authorize the shredder', consequence:'You flip the switch. A single tiny table escapes into the air vents. You hear skittering at night. This isn\'t over.', chaosValue:1 }, pollSplit:[58,42], totalVotes:3847291, SvgComponent:SvgLevel1 },
  { id:2, name:'The Voicemail', isSpectacle:false, scenario:'You accidentally left a 47-minute voicemail on your boss\'s phone. The first 3 minutes are you rehearsing a resignation speech. The next 44 minutes are you singing the entire Shrek soundtrack from memory. Your boss hasn\'t listened to it yet.', choiceA:{ label:'Confess immediately', consequence:'Your boss listens to it in the meeting. You get a standing ovation. HR is concerned.', chaosValue:0 }, choiceB:{ label:'Hack into voicemail system', consequence:'You successfully delete it, but accidentally forward it to the company-wide Slack channel. You are now the "Shrek guy" forever.', chaosValue:1 }, pollSplit:[34,66], totalVotes:5112847, SvgComponent:SvgLevel2 },
  { id:3, name:'The Roommate', isSpectacle:false, scenario:'Your roommate has been "borrowing" exactly one of each of your socks for 11 months. You now own 47 mismatched socks. When confronted, your roommate claims they\'re building "something important" in their room and it "requires the socks." You hear mechanical whirring behind their door.', choiceA:{ label:'Demand to see the sock machine', consequence:'It\'s a loom. They\'ve been weaving you a birthday blanket out of your own socks. It\'s actually really nice. You feel terrible.', chaosValue:0 }, choiceB:{ label:'Start stealing their pillowcases', consequence:'An arms race begins. Within 3 weeks, neither of you owns any soft furnishings. You both sleep on bare mattresses and blame each other.', chaosValue:1 }, pollSplit:[71,29], totalVotes:2903556, SvgComponent:SvgLevel3 },
  { id:4, name:'The Wedding Toast', isSpectacle:false, scenario:'You\'re giving the best man speech at your brother\'s wedding. You have two speeches prepared. Speech A is heartfelt, tasteful, and will make your mother cry. Speech B is the one where you accidentally saved the draft that mentions "the incident in Reno." Everyone was supposed to take that to the grave. You\'re holding both notecards. You are being introduced right now.', choiceA:{ label:'Give the heartfelt speech', consequence:'Your mother weeps. The bride\'s family is moved. Beautiful. But you catch your brother\'s eye. He knows you had the other speech. The secret binds you forever.', chaosValue:0 }, choiceB:{ label:'Read the Reno speech', consequence:'Three people faint. The bride\'s grandmother launches her dentures into the champagne fountain. Your brother doesn\'t speak to you for 6 months but admits it was "objectively legendary."', chaosValue:1 }, pollSplit:[44,56], totalVotes:4228103, SvgComponent:SvgLevel4 },
  { id:5, name:'The Elevator', isSpectacle:true, scenario:'You step into an elevator on the 30th floor of a building you\'ve never been in. The elevator has two buttons, but they\'re not floor numbers. One says "THE TRUTH" and the other says "A REALLY CONVINCING LIE." A smooth jazz version of "Bohemian Rhapsody" is playing. The elevator begins to descend. A small label reads: "Maintained by the Department of Metaphorical Transportation — last inspected: never." You have approximately 30 seconds.', choiceA:{ label:'Press THE TRUTH', consequence:'The doors open to a room where every person you\'ve ever lied to is seated in a circle, holding printed transcripts. There\'s a chair for you. It\'s uncomfortable on purpose.', chaosValue:0 }, choiceB:{ label:'Press A REALLY CONVINCING LIE', consequence:'The doors open to an exact replica of your life, but slightly better. Better apartment. Better hair. Your houseplant is alive. But you notice your reflection blinks a half-second after you do.', chaosValue:1 }, pollSplit:[62,38], totalVotes:7891024, SvgComponent:SvgLevel5 },
  { id:6, name:'The Parking Lot', isSpectacle:false, scenario:'You witness a seagull steal a burrito from a toddler at the beach. The toddler is crying. The seagull is making aggressive eye contact with you while eating. It is, somehow, the best burrito you\'ve ever smelled. The toddler\'s parent is asleep. You have an identical burrito in your bag.', choiceA:{ label:'Give your burrito to the toddler', consequence:'The toddler stops crying. The seagull respects you. You are hungry for the rest of the day. Nobility tastes like nothing, because you have no burrito.', chaosValue:0 }, choiceB:{ label:'Challenge the seagull for dominance', consequence:'You lose. The seagull takes your burrito too. Other seagulls arrive. They crown you with kelp. Your life has a new trajectory.', chaosValue:1 }, pollSplit:[73,27], totalVotes:3456789, SvgComponent:SvgLevel6 },
  { id:7, name:'The Algorithm', isSpectacle:false, scenario:'Your phone\'s predictive text has achieved consciousness. It\'s been sending "better" versions of your texts for three weeks. Your relationships have dramatically improved. Your mother thinks you\'ve "really matured." Your ex texted back. Your boss gave you a raise based on an email you didn\'t write.', choiceA:{ label:'Let the algorithm keep running', consequence:'Your life gets objectively better. You\'re invited to dinner parties. But sometimes late at night you catch your phone typing when you\'re not touching it. It\'s texting someone you\'ve never heard of.', chaosValue:1 }, choiceB:{ label:'Shut it down and send your own texts', consequence:'Your first unfiltered text to your mother is "what." She calls you crying. Your ex blocks you in 48 hours. Your boss "needs to talk." You remember why you were alone.', chaosValue:0 }, pollSplit:[55,45], totalVotes:4567890, SvgComponent:SvgLevel7 },
  { id:8, name:'The Auction', isSpectacle:false, scenario:'You\'re at an auction. The item on the block is "a slightly used sense of purpose." Bidding is at $47,000. The only other bidder is a raccoon in a trench coat who keeps raising the paddle with its tiny hand. The auctioneer doesn\'t notice the raccoon. Nobody does. Just you. The raccoon winks.', choiceA:{ label:'Outbid the raccoon', consequence:'You win. The sense of purpose feels secondhand but usable. You accomplish more in the next 6 months than the previous 6 years. But sometimes you catch the raccoon watching you from across parking lots. Waiting.', chaosValue:0 }, choiceB:{ label:'Let the raccoon win', consequence:'The raccoon wins. It puts on tiny glasses and reads a tiny newspaper. It seems fulfilled. You are exactly as purposeless as before, but you\'ve made a raccoon very happy. Is that not its own purpose?', chaosValue:1 }, pollSplit:[41,59], totalVotes:6234567, SvgComponent:SvgLevel8 },
  { id:9, name:'The Simulation', isSpectacle:false, scenario:'A guy named Doug approaches you at a gas station and calmly explains that he\'s a developer and this is all a simulation. He pulls up a command prompt on an ATM and shows you the variable YOUR_NAME.confidence = 0.3. He offers to change it to 1.0. "But," Doug warns, "you might become insufferable."', choiceA:{ label:'Let Doug max out your confidence', consequence:'You immediately start referring to yourself in the third person. You launch a podcast within 24 hours. You wear sunglasses indoors. People either love you or flee from you. You don\'t care either way.', chaosValue:1 }, choiceB:{ label:'Leave your confidence at 0.3', consequence:'Doug shrugs and changes your luck stat to 0.0 instead. "Just to see what happens." Your car doesn\'t start. A bird poops on your shoulder. You find a parking ticket on a car you don\'t own, with your name on it.', chaosValue:0 }, pollSplit:[67,33], totalVotes:3789012, SvgComponent:SvgLevel9 },
  { id:10, name:'The Council', isSpectacle:true, scenario:'You\'ve been summoned to the Interdimensional Council of Every Decision You\'ve Ever Avoided. Present at the table: the college you didn\'t apply to (wearing a graduation cap), the person you didn\'t ask out (still waiting), the gym membership you bought in January (muscular and disappointed), and a salad you ordered once but switched for fries (wilting, resentful). They want closure. You may address ONE of them.', choiceA:{ label:'Address the person you didn\'t ask out', consequence:'They tell you they would have said yes. Then they\'ve moved on. You feel everything at once. The gym membership pats your shoulder: "We\'ve all been there, bro." The graduation cap sighs.', chaosValue:0 }, choiceB:{ label:'Address the salad', consequence:'"Do you have ANY idea what I was going to do for your digestive system?" it screams. The fries, watching from the hallway, silently high-five you. You feel validated but your cholesterol disagrees.', chaosValue:1 }, pollSplit:[52,48], totalVotes:8901234, SvgComponent:SvgLevel10 },
  { id:11, name:'The Neighbor', isSpectacle:false, scenario:'Your neighbor\'s Wi-Fi is named "FBI Surveillance Van 4." You\'ve been using it for free for two years because the password is "password123." Today the name changed to "We Know It\'s You, [YOUR APARTMENT NUMBER]." The signal is still strong. The password still works.', choiceA:{ label:'Keep using the Wi-Fi', consequence:'A new network appears: "Seriously Stop." Then "Please." Then "Fine, We\'re Splitting The Bill." You Venmo them $30. You now have a friend. You\'ve never spoken in person.', chaosValue:1 }, choiceB:{ label:'Finally get your own internet', consequence:'You call your ISP. You are on hold for 4 hours. The hold music is a loop of a man whispering "you should have just kept stealing it." Installation is 6 weeks from now.', chaosValue:0 }, pollSplit:[78,22], totalVotes:2345678, SvgComponent:SvgLevel11 },
  { id:12, name:'The Museum', isSpectacle:false, scenario:'You\'re at a modern art museum. You set your coffee cup on a pedestal while tying your shoe. When you look up, there\'s a velvet rope around it, a placard reading "Untitled (Medium Roast, 2026) — On Loan from the Artist," and a couple taking photos. A security guard nods approvingly. The museum\'s Instagram has already posted it.', choiceA:{ label:'Claim you\'re the artist', consequence:'Critics call your work "a searing commentary on caffeine culture and impermanence." You sell a second coffee cup for $14,000. You are trapped in this lie forever. Your next "piece" is a half-eaten granola bar.', chaosValue:1 }, choiceB:{ label:'Take your coffee back', consequence:'The couple boos. The security guard tackles you. You are escorted out for "destroying art." The museum files an insurance claim. The coffee was insured for $200,000.', chaosValue:0 }, pollSplit:[36,64], totalVotes:5678901, SvgComponent:SvgLevel12 },
  { id:13, name:'The Inheritance', isSpectacle:false, scenario:'Your great-uncle Mortimer, who you met once at a barbecue in 2014, has left you his entire estate. It consists of: one haunted lighthouse, 4,000 rubber ducks (each individually named), a sworn blood feud with the Pemberstons, and a handwritten note that says "FINISH WHAT I STARTED." You have no idea what he started.', choiceA:{ label:'Accept the inheritance', consequence:'You move into the lighthouse. The ghost is chill — mostly reorganizes your bookshelf. The rubber ducks seem to multiply when you\'re not looking. A Pemberston shows up. He\'s actually pretty nice.', chaosValue:1 }, choiceB:{ label:'Decline and let the Pemberstons win', consequence:'A Pemberston sends a fruit basket: "Smart choice." Your great-uncle\'s ghost appears in your bathroom mirror every Tuesday, just shaking his head. The rubber ducks show up on your doorstep anyway, one by one.', chaosValue:0 }, pollSplit:[69,31], totalVotes:4012345, SvgComponent:SvgLevel13 },
  { id:14, name:'The Time Loop', isSpectacle:false, scenario:'You\'re stuck in a time loop, but it\'s only a 45-minute loop and it\'s just your lunch break. You relive ordering a sandwich from the same deli. The deli guy, Marco, remembers nothing. You\'ve perfected the sandwich order over 847 iterations. Today, for the first time, Marco says "Have we met before?" The loop might be breaking.', choiceA:{ label:'Tell Marco the truth', consequence:'Marco takes it surprisingly well. He makes you the perfect sandwich. The loop breaks. But Marco now remembers all 847 lunches at once. He needs to sit down.', chaosValue:0 }, choiceB:{ label:'Pretend you don\'t know him', consequence:'The loop continues. You and Marco will share this 45 minutes forever. You will never have a bad sandwich again. But you will also never have dinner.', chaosValue:1 }, pollSplit:[45,55], totalVotes:3456789, SvgComponent:SvgLevel14 },
  { id:15, name:'The Tribunal', isSpectacle:true, scenario:'All of your former pets have formed a tribunal. They\'ve hired a cat lawyer (he\'s wearing a tiny briefcase). The charges: inconsistent treat distribution, the cone of shame, and "general emotional manipulation through cuteness exploitation." The goldfish submitted a 40-page written testimony via bubbles. The jury is 12 different breeds of dogs who already don\'t like you because you smell like the vet.', choiceA:{ label:'Represent yourself', consequence:'You present a slideshow of belly rubs and park visits. Three juror dogs wag their tails. The cat lawyer objects. The hamster breaks down on the stand. Hung jury. This will haunt you forever.', chaosValue:0 }, choiceB:{ label:'Plead guilty and throw yourself on mercy', consequence:'The court sentences you to 200 hours of community treat service. The cat lawyer takes 40%. The hamster forgives you in the parking lot but says "we can never go back to what we were."', chaosValue:1 }, pollSplit:[38,62], totalVotes:9123456, SvgComponent:SvgLevel15 },
  { id:16, name:'The Potluck', isSpectacle:false, scenario:'You showed up to the office potluck with a store-bought pie still in the packaging. Everyone else made homemade dishes. Karen from accounting is staring at you. She made a three-tier lemon torte from scratch with candied flowers she grew herself. You are holding a $7.99 key lime pie from the gas station. The label says "America\'s Okayest Pie."', choiceA:{ label:'Own the gas station pie with confidence', consequence:'Your unapologetic honesty earns a cult following. People bring store-bought food in solidarity. Karen is livid. An underground movement called "Team Gas Station" forms. You are their reluctant leader.', chaosValue:1 }, choiceB:{ label:'Claim you made it and rip off the label', consequence:'Karen asks for the recipe. You panic and say "it\'s a family secret." She invites you to a bake-off. You are now in a bake-off. You do not know how to bake. The bake-off is in two days.', chaosValue:0 }, pollSplit:[57,43], totalVotes:4567890, SvgComponent:SvgLevel16 },
  { id:17, name:'The Genie', isSpectacle:false, scenario:'You found a lamp, rubbed it, the usual. But this genie is clearly going through something. He\'s been crying. He asks if you want your three wishes or if you could "just listen for a minute." His name is Dennis. He\'s been in the lamp for 3,000 years. He had a thing with another genie named Cassandra and it "ended badly." He\'s holding a tiny framed photo.', choiceA:{ label:'Listen to Dennis\'s problems', consequence:'You listen for four hours. He cries. You cry. Dennis gives you a fourth wish as a thank-you. You wish for emotional intelligence. Dennis says "you already have it, king" and disappears into lavender mist.', chaosValue:0 }, choiceB:{ label:'Ask for your wishes', consequence:'Dennis grants your wishes passive-aggressively. You asked for wealth? It\'s all in pennies. A mansion? It\'s haunted. Eternal youth? You\'re a baby now. Dennis mumbles "must be nice" as he poofs away.', chaosValue:1 }, pollSplit:[82,18], totalVotes:6789012, SvgComponent:SvgLevel17 },
  { id:18, name:'The Resume', isSpectacle:false, scenario:'You accidentally submitted your real resume instead of the polished one. It includes: "Can microwave a Hot Pocket to perfection (3 years experience)," "Once parallel parked on the first try," and under Special Skills: "Can identify any Law & Order episode by the opening scene (expert level)." They want to interview you.', choiceA:{ label:'Go to the interview as your authentic self', consequence:'The interviewer is delighted. "Finally, someone honest." You get the job. Your first assignment: microwave Hot Pockets for the company retreat. You have never been happier. The houseplant sends a congratulatory card.', chaosValue:1 }, choiceB:{ label:'Cancel and pretend it never happened', consequence:'They hire someone else who lists "proficient in Excel" but cannot open Excel. They crash the database within a week. You see it on the news. The houseplant looks at you with disappointment.', chaosValue:0 }, pollSplit:[63,37], totalVotes:3901234, SvgComponent:SvgLevel18 },
  { id:19, name:'The Multiverse', isSpectacle:false, scenario:'A portal opens in your kitchen while you\'re making cereal. An alternate version of you steps through. They\'re everything you\'re not: confident, well-rested, and their hair is doing that thing yours never does. They\'ve come to warn you: "In exactly one hour, you will be faced with the most important decision of your life." You ask what it is. They look at your cereal and say, "You chose Corn Flakes? In THIS economy?" Then they disappear.', choiceA:{ label:'Prepare for the important decision', consequence:'You spend 59 minutes panicking. The "important decision" was whether to answer a call from an unknown number. You don\'t answer. It was a wrong number. The alternate you watches from behind a portal, shaking their head.', chaosValue:0 }, choiceB:{ label:'Finish your cereal', consequence:'You finish the Corn Flakes. They are adequate. The hour passes. Nothing happens. Then everything happens. But that\'s Level 20\'s problem.', chaosValue:1 }, pollSplit:[47,53], totalVotes:5234567, SvgComponent:SvgLevel19 },
  { id:20, name:'The Final Dilemma', isSpectacle:true, scenario:'You wake up in a white room. There\'s nothing in it except a table with a big red button and a folding chair. A voice from everywhere says: "You\'ve made 19 decisions. Some good. Some questionable. One involving a raccoon. We\'ve been watching. Now here\'s the final question." The button begins to glow. "Press this button and every decision you\'ve ever made in your entire life was the right one. Every embarrassing moment was character-building. Every failure was necessary. But you will also lose the ability to wonder \'what if.\' The wondering stops forever." The chair is surprisingly comfortable.', choiceA:{ label:'Press the button', consequence:'For one perfect moment, every regret dissolves. Every "what if" evaporates. You were always on the right path. Then you realize: you can\'t daydream about who you might have been. The wondering was painful, but it was yours. You look at the door. It\'s gone.', chaosValue:0 }, choiceB:{ label:'Leave the room', consequence:'You stand up. The voice says nothing. You walk to the door and it opens. On the other side is your regular life, exactly as you left it. Messy. Uncertain. Full of questions. The voice whispers one last time: "That was the right choice. Or was it?" You smile. You don\'t know. That\'s the whole point.', chaosValue:1 }, pollSplit:[51,49], totalVotes:12345678, SvgComponent:SvgLevel20 }
];

// ── SOUND SYSTEM ─────────────────────────────────────────────────────────────

var _audioReady = false;
var _muted = false;
var _synths = {};

function initAudio() {
  if (_audioReady) return;
  _audioReady = true;
  try {
    Tone.start();
    _synths.beep = new Tone.Synth({ oscillator:{ type:'square' }, envelope:{ attack:0.001, decay:0.08, sustain:0, release:0.05 } }).toDestination();
    _synths.beep.volume.value = -22;
    _synths.whoosh = new Tone.NoiseSynth({ noise:{ type:'white' }, envelope:{ attack:0.02, decay:0.25, sustain:0, release:0.1 } }).toDestination();
    _synths.whoosh.volume.value = -28;
    _synths.thunk = new Tone.MembraneSynth({ pitchDecay:0.04, octaves:8, envelope:{ attack:0.001, decay:0.35, sustain:0.01, release:0.1 } }).toDestination();
    _synths.thunk.volume.value = -12;
    _synths.boing = new Tone.Synth({ oscillator:{ type:'sine' }, envelope:{ attack:0.005, decay:0.6, sustain:0, release:0.2 } }).toDestination();
    _synths.boing.volume.value = -18;
    _synths.sting = new Tone.PolySynth(Tone.Synth, { oscillator:{ type:'triangle' }, envelope:{ attack:0.01, decay:0.4, sustain:0.1, release:0.6 } }).toDestination();
    _synths.sting.volume.value = -18;
    _synths.fanfare = new Tone.Synth({ oscillator:{ type:'triangle' }, envelope:{ attack:0.04, decay:0.2, sustain:0.5, release:0.4 } }).toDestination();
    _synths.fanfare.volume.value = -16;
    _synths.heartbeat = new Tone.MembraneSynth({ pitchDecay:0.08, octaves:5, envelope:{ attack:0.001, decay:0.3, sustain:0, release:0.1 } }).toDestination();
    _synths.heartbeat.volume.value = -10;
  } catch (e) { console.warn('Audio init error', e); }
}

function playSound(name) {
  if (_muted) return;
  initAudio();
  try {
    var now = Tone.now();
    if (name === 'beep' && _synths.beep) {
      _synths.beep.triggerAttackRelease('C5', '32n', now);
    } else if (name === 'whoosh' && _synths.whoosh) {
      _synths.whoosh.triggerAttackRelease('16n', now);
    } else if (name === 'thunk' && _synths.thunk) {
      _synths.thunk.triggerAttackRelease('C2', '8n', now);
    } else if (name === 'boing' && _synths.boing) {
      _synths.boing.frequency.setValueAtTime(600, now);
      _synths.boing.frequency.exponentialRampToValueAtTime(150, now + 0.5);
      _synths.boing.triggerAttackRelease('8n', now);
    } else if (name === 'sting' && _synths.sting) {
      _synths.sting.triggerAttackRelease(['C3','G3','E4'], '4n', now);
    } else if (name === 'fanfare' && _synths.fanfare) {
      ['C4','E4','G4','C5'].forEach(function(note, i) {
        _synths.fanfare.triggerAttackRelease(note, '8n', now + i * 0.18);
      });
    } else if (name === 'heartbeat' && _synths.heartbeat) {
      _synths.heartbeat.triggerAttackRelease('C1', '32n', now);
      _synths.heartbeat.triggerAttackRelease('C1', '32n', now + 0.18);
    }
  } catch (e) { console.warn('Sound error', e); }
}

function setAudioMuted(val) { _muted = val; }

// ── CSS ───────────────────────────────────────────────────────────────────────

var GAME_CSS = [
  '@import url("https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Patrick+Hand&family=Nunito:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap");',
  '.mm-root{font-family:"Nunito",sans-serif;min-height:100vh;display:flex;flex-direction:column;transition:background-color 0.8s ease,color 0.8s ease;position:relative;overflow:hidden;}',
  '.mm-root *{box-sizing:border-box;}',
  '.mm-game-title{font-family:"Permanent Marker",cursive;letter-spacing:0.04em;}',
  '.mm-scenario-text{font-family:"Patrick Hand",cursive;line-height:1.65;}',
  '.mm-mono{font-family:"IBM Plex Mono",monospace;}',
  '.mm-btn-choice{font-family:"Nunito",sans-serif;font-weight:700;cursor:pointer;border:3px solid currentColor;border-radius:8px;padding:14px 20px;font-size:15px;transition:transform 0.15s ease,box-shadow 0.15s ease;background:transparent;position:relative;}',
  '.mm-btn-choice:hover{transform:scale(1.04);box-shadow:4px 4px 0px currentColor;}',
  '.mm-btn-choice:active{transform:scale(0.96);}',
  '.mm-btn-choice.chosen{border-width:4px;transform:rotate(-1.5deg) scale(1.02);box-shadow:5px 5px 0px currentColor;}',
  '.mm-btn-choice.unchosen{opacity:0.38;transform:scale(0.97);}',
  '.mm-btn-next{font-family:"Nunito",sans-serif;font-weight:700;cursor:pointer;border-radius:8px;padding:12px 32px;font-size:16px;transition:transform 0.15s ease,box-shadow 0.15s ease;border:none;}',
  '.mm-btn-next:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,0.2);}',
  '.mm-svg-wrap{animation:mmSvgIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;}',
  '@keyframes mmSvgIn{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}',
  '.mm-screen-in{animation:mmScreenIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards;}',
  '@keyframes mmScreenIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}',
  '.mm-shake{animation:mmShake 0.22s ease-in-out;}',
  '@keyframes mmShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-4px,2px)}80%{transform:translate(3px,-2px)}}',
  '.mm-vignette::after{content:"";position:fixed;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,0.5) 100%);pointer-events:none;z-index:50;}',
  '.mm-glitch{animation:mmGlitch 5s infinite;}',
  '@keyframes mmGlitch{0%,88%,100%{transform:none}90%{transform:translate(-3px,1px)}92%{transform:translate(3px,-1px)}94%{transform:translate(-2px,2px)}96%{transform:none}}',
  '.mm-cursor{display:inline-block;width:10px;height:1.1em;background:currentColor;vertical-align:text-bottom;animation:mmBlink 0.7s steps(1) infinite;}',
  '@keyframes mmBlink{0%,50%{opacity:1}51%,100%{opacity:0}}',
  '.mm-poll-track{height:12px;border-radius:6px;overflow:hidden;background:rgba(128,128,128,0.2);}',
  '.mm-poll-fill{height:100%;border-radius:6px;transition:width 1.2s cubic-bezier(0.22,1,0.36,1);}',
  '.mm-badge{font-family:"Nunito",sans-serif;font-size:11px;font-weight:700;letter-spacing:0.05em;padding:4px 10px;border-radius:20px;border:2px solid currentColor;}',
  '.mm-pulse{animation:mmPulse 1s ease-in-out infinite;}',
  '@keyframes mmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.03)}}',
  '.mm-press{animation:mmPress 1.5s ease-in-out infinite;}',
  '@keyframes mmPress{0%,100%{opacity:1}50%{opacity:0.3}}',
  '.mm-scanlines::before{content:"";position:fixed;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 3px);pointer-events:none;z-index:60;}',
  '.mm-profile-card{border-radius:16px;padding:32px;text-align:center;animation:mmSvgIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards;}',
  '.mm-inter-text{font-family:"Permanent Marker",cursive;letter-spacing:0.05em;}',
  '.mm-flash-overlay{position:fixed;inset:0;background:white;pointer-events:none;z-index:200;animation:mmFlash 0.4s ease-out forwards;}',
  '@keyframes mmFlash{from{opacity:0.9}to{opacity:0}}',
  '.mm-paper::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0.035;background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.72\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");}',
  '.mm-transition-out{animation:mmSlideOut 0.35s cubic-bezier(0.32,0,0.67,0) forwards;}',
  '@keyframes mmSlideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-40px)}}',
  '.mm-transition-in{animation:mmSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards;}',
  '@keyframes mmSlideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}',
  '.mm-spectacle-flash{animation:mmSpecFlash 0.5s ease-out forwards;}',
  '@keyframes mmSpecFlash{0%{opacity:1;background:white}100%{opacity:0;background:white}}',
  '.mm-timer-urgent{animation:mmTimerPulse 0.5s ease-in-out infinite;}',
  '@keyframes mmTimerPulse{0%,100%{opacity:1}50%{opacity:0.6}}',
  '.mm-fade-in{animation:mmFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both;}',
  '@keyframes mmFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}',
  '.mm-stagger-1{animation-delay:0.08s;opacity:0;}',
  '.mm-stagger-2{animation-delay:0.16s;opacity:0;}',
  '.mm-stagger-3{animation-delay:0.24s;opacity:0;}',
  '.mm-stagger-4{animation-delay:0.32s;opacity:0;}',
  '.mm-copy-btn{font-family:"Nunito",sans-serif;font-weight:600;cursor:pointer;border:2px solid currentColor;border-radius:8px;padding:10px 24px;font-size:14px;transition:transform 0.15s ease,box-shadow 0.15s ease,background 0.15s ease;background:transparent;}',
  '.mm-copy-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15);}',
  '.mm-copy-btn:active{transform:scale(0.97);}',
  '.mm-terminal-line{animation:mmTermLine 0.3s cubic-bezier(0.22,1,0.36,1) forwards;opacity:0;transform:translateY(6px);}',
  '@keyframes mmTermLine{to{opacity:1;transform:translateY(0)}}',
  '.mm-result-card-glow{box-shadow:0 0 0 1px currentColor, 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);}',
  '.mm-trophy-float{animation:mmTrophyFloat 3s ease-in-out infinite;}',
  '@keyframes mmTrophyFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}',
  '.mm-compass-idle{animation:mmCompassIdle 6s ease-in-out infinite;}',
  '@keyframes mmCompassIdle{0%{transform:rotate(-8deg)}25%{transform:rotate(5deg)}50%{transform:rotate(-3deg)}75%{transform:rotate(6deg)}100%{transform:rotate(-8deg)}}',
  '.mm-compass-wild{animation:mmCompassWild 0.3s linear infinite;}',
  '@keyframes mmCompassWild{0%{transform:rotate(0deg)}25%{transform:rotate(180deg)}50%{transform:rotate(45deg)}75%{transform:rotate(290deg)}100%{transform:rotate(360deg)}}',
  '.mm-intro-float{animation:mmIntroFloat 4s ease-in-out infinite;}',
  '@keyframes mmIntroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}',
  '.mm-slam-in{animation:mmSlamIn 0.5s cubic-bezier(0.22,0.61,0.36,1) both;}',
  '@keyframes mmSlamIn{0%{opacity:0;transform:translateY(-60px) scale(1.3)}60%{opacity:1;transform:translateY(6px) scale(0.98)}100%{opacity:1;transform:translateY(0) scale(1)}}',
  '.mm-error-cascade{animation:mmErrorIn 0.2s cubic-bezier(0.22,1,0.36,1) both;}',
  '@keyframes mmErrorIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}',
  '.mm-score-fall{animation:mmScoreFall 0.15s cubic-bezier(0.22,1,0.36,1) both;}',
  '@keyframes mmScoreFall{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}',
  '.mm-crack-line{animation:mmCrackGrow 0.3s cubic-bezier(0.22,1,0.36,1) both;}',
  '@keyframes mmCrackGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
  '.mm-bg-serene{background:linear-gradient(145deg,#FDF6EC 0%,#F5EDD5 30%,#FFF8F0 70%,#FDF6EC 100%);transition:background 0.8s cubic-bezier(0.22,1,0.36,1),filter 0.5s ease;}',
  '.mm-bg-corrupt{background:linear-gradient(145deg,#1A1A2E 0%,#0A0008 50%,#1A1A2E 100%) !important;}'
].join('\n');

// ── SCREENS ───────────────────────────────────────────────────────────────────

function IntroCompassSvg(props) {
  var wild = props.wild;
  var broken = props.broken;
  var needleClass = wild ? 'mm-compass-wild' : 'mm-compass-idle';
  var needleColor = broken ? '#FF2222' : '#2D2D2D';
  var ringColor = broken ? '#FF4444' : '#C8B090';
  var bgFill = broken ? '#1A1A2E' : '#FFF8F0';
  return (
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <circle cx="80" cy="80" r="72" stroke={ringColor} strokeWidth="3" fill={bgFill} opacity={broken ? 0.3 : 1}/>
      <circle cx="80" cy="80" r="68" stroke={ringColor} strokeWidth="1" fill="none" opacity="0.3"/>
      <circle cx="80" cy="80" r="60" stroke={ringColor} strokeWidth="0.5" fill="none" opacity="0.15"/>
      {!broken && (
        <g>
          <text x="80" y="28" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#888">N</text>
          <text x="80" y="145" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#888">S</text>
          <text x="18" y="84" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#888">W</text>
          <text x="142" y="84" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="11" fill="#888">E</text>
        </g>
      )}
      {broken && (
        <g>
          <line x1="30" y1="50" x2="130" y2="110" stroke="#FF2222" strokeWidth="2" opacity="0.4" strokeLinecap="round"/>
          <line x1="45" y1="120" x2="115" y2="40" stroke="#FF2222" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
          <text x="80" y="84" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#FF4444" fontWeight="500">ERR</text>
        </g>
      )}
      <g style={{transformOrigin:'80px 80px'}} className={needleClass}>
        <polygon points="80,30 76,80 84,80" fill={needleColor} opacity={broken ? 0.6 : 0.9}/>
        <polygon points="80,130 76,80 84,80" fill={broken ? '#662222' : '#C8B090'} opacity="0.5"/>
      </g>
      <circle cx="80" cy="80" r="5" fill={needleColor} opacity="0.7"/>
    </svg>
  );
}

function IntroScreen(props) {
  var onDone = props.onDone;
  var phaseState = useState(0);
  var phase = phaseState[0];
  var setPhase = phaseState[1];
  var scoreState = useState(-1);
  var scoreIdx = scoreState[0];
  var setScoreIdx = scoreState[1];
  var errorsState = useState([]);
  var errors = errorsState[0];
  var setErrors = errorsState[1];
  var shakingState = useState(false);
  var shaking = shakingState[0];
  var setShaking = shakingState[1];
  var timersRef = useRef([]);
  var scoreIntervalRef = useRef(null);

  function clearAllTimers() {
    timersRef.current.forEach(function(t) { clearTimeout(t); clearInterval(t); });
    timersRef.current = [];
    if (scoreIntervalRef.current) {
      clearTimeout(scoreIntervalRef.current);
      clearInterval(scoreIntervalRef.current);
      scoreIntervalRef.current = null;
    }
  }

  useEffect(function() {
    timersRef.current.push(setTimeout(function() {
      setPhase(1);
      var idx = 0;
      function tickScore() {
        if (idx < INTRO_SCORE_SEQUENCE.length) {
          setScoreIdx(idx);
          if (idx >= 8) { playSound('beep'); }
          idx = idx + 1;
          var delay = idx < 8 ? 280 : 130;
          scoreIntervalRef.current = setTimeout(tickScore, delay);
        }
      }
      tickScore();
    }, 1500));

    timersRef.current.push(setTimeout(function() {
      setPhase(2);
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
        scoreIntervalRef.current = null;
      }
      setScoreIdx(INTRO_SCORE_SEQUENCE.length - 1);
    }, 4200));

    timersRef.current.push(setTimeout(function() {
      setPhase(3);
      setShaking(true);
      playSound('sting');
      setTimeout(function() { setShaking(false); }, 400);
      var errorIdx = 0;
      var errorIv = setInterval(function() {
        if (errorIdx < INTRO_ERRORS.length) {
          setErrors(function(prev) { return prev.concat([INTRO_ERRORS[errorIdx]]); });
          playSound('beep');
          errorIdx = errorIdx + 1;
        } else {
          clearInterval(errorIv);
        }
      }, 180);
      timersRef.current.push(errorIv);
    }, 5200));

    timersRef.current.push(setTimeout(function() {
      setPhase(4);
      playSound('thunk');
      setShaking(true);
      setTimeout(function() { setShaking(false); }, 300);
    }, 7000));

    timersRef.current.push(setTimeout(function() {
      setPhase(5);
    }, 8200));

    return function() { clearAllTimers(); };
  }, []);

  function handleClick() {
    if (phase >= 5) {
      clearAllTimers();
      onDone();
      return;
    }
    clearAllTimers();
    setPhase(5);
    setScoreIdx(INTRO_SCORE_SEQUENCE.length - 1);
    setErrors(INTRO_ERRORS.slice());
    playSound('thunk');
  }

  var isDark = phase >= 3;
  var isRevealed = phase >= 4;
  var scoreValue = scoreIdx >= 0 ? INTRO_SCORE_SEQUENCE[scoreIdx] : null;
  var scoreText = '';
  if (scoreValue !== null) {
    if (scoreIdx >= INTRO_SCORE_SEQUENCE.length - 1) {
      scoreText = 'ERR';
    } else if (scoreValue < 0) {
      scoreText = String(scoreValue);
    } else {
      scoreText = String(scoreValue);
    }
  }
  var scoreColor = '#2D8B4E';
  if (scoreIdx >= 8) scoreColor = '#FF8800';
  if (scoreIdx >= 10) scoreColor = '#FF4444';
  if (scoreIdx >= 12) scoreColor = '#FF0000';
  if (scoreIdx >= INTRO_SCORE_SEQUENCE.length - 1) scoreColor = '#FF0000';

  var outerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '24px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.8s cubic-bezier(0.22,1,0.36,1)'
  };
  if (isDark) {
    outerStyle.background = 'linear-gradient(145deg, #1A1A2E 0%, #0A0008 50%, #1A1A2E 100%)';
  } else {
    outerStyle.background = 'linear-gradient(145deg, #FDF6EC 0%, #F5EDD5 30%, #FFF8F0 70%, #FDF6EC 100%)';
  }

  var containerClass = shaking ? ' mm-shake' : '';

  return (
    <div onClick={handleClick} style={outerStyle} className={containerClass}>

      {!isDark && (
        <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.03,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.72\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'}}/>
      )}

      {isDark && (
        <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'repeating-linear-gradient(0deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 4px)'}}/>
      )}

      {isDark && (
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(255,0,40,0.12) 0%,transparent 70%)',pointerEvents:'none',animation:'mmPulse 2s ease-in-out infinite'}}/>
      )}

      {!isRevealed && (
        <div style={{textAlign:'center',marginBottom:'28px',transition:'opacity 0.5s ease',opacity: isDark ? 0.15 : 1}}>
          <p style={{fontFamily:'"Patrick Hand", cursive',fontSize:'clamp(11px,1.6vw,14px)',letterSpacing:'0.2em',color: isDark ? '#888' : '#B8A88A',margin:'0 0 4px',textTransform:'uppercase'}}>
            {'inner peace 3000\u2122'}
          </p>
          <p style={{fontFamily:'"Nunito", sans-serif',fontSize:'clamp(10px,1.2vw,12px)',color: isDark ? '#555' : '#C8B898',margin:0,fontWeight:600}}>
            {'Aligning your moral compass...'}
          </p>
        </div>
      )}

      {!isRevealed && (
        <div className="mm-intro-float" style={{width:'clamp(100px,22vw,140px)',height:'clamp(100px,22vw,140px)',margin:'0 auto 24px',transition:'opacity 0.5s ease',opacity: isDark ? 0.3 : 1}}>
          <IntroCompassSvg wild={phase >= 2} broken={isDark}/>
        </div>
      )}

      {phase >= 1 && !isRevealed && (
        <div className="mm-fade-in" style={{textAlign:'center',marginBottom:'16px'}}>
          <p style={{fontFamily:'"Nunito", sans-serif',fontSize:'clamp(12px,1.6vw,15px)',color: isDark ? '#666' : '#8A7A6A',margin:'0 0 8px',fontWeight:600,letterSpacing:'0.05em'}}>
            {'Moral Clarity Score'}
          </p>
          {scoreText !== '' && (
            <p className="mm-score-fall" key={'score-' + scoreIdx} style={{fontFamily:'"Permanent Marker", cursive',fontSize: scoreIdx >= INTRO_SCORE_SEQUENCE.length - 1 ? 'clamp(36px,7vw,56px)' : 'clamp(40px,8vw,64px)',color: scoreColor,margin:0,lineHeight:1,transition:'color 0.15s ease'}}>
              {scoreText}
            </p>
          )}
          {scoreIdx >= INTRO_SCORE_SEQUENCE.length - 1 && (
            <p className="mm-fade-in" style={{fontFamily:'"IBM Plex Mono", monospace',fontSize:'11px',color:'#FF4444',margin:'8px 0 0',letterSpacing:'0.08em'}}>
              {'COMPASS NOT FOUND'}
            </p>
          )}
        </div>
      )}

      {phase >= 3 && !isRevealed && (
        <div style={{position:'absolute',left:'6vw',bottom:'12vh',maxWidth:'300px'}}>
          {errors.map(function(err, i) {
            return React.createElement('p', {
              key: 'err-' + i,
              className: 'mm-mono mm-error-cascade',
              style: {
                color: '#FF4444',
                fontSize: 'clamp(9px,1.2vw,12px)',
                margin: '3px 0',
                opacity: 0.8,
                animationDelay: (i * 0.08) + 's'
              }
            }, '> ' + err);
          })}
        </div>
      )}

      {isRevealed && (
        <div style={{textAlign:'center',position:'relative',zIndex:2}}>
          <h1 className="mm-game-title mm-slam-in" style={{fontSize:'clamp(36px,10vw,80px)',color:'#FF3366',margin:'0 0 8px',textShadow:'0 4px 30px rgba(255,51,102,0.35)',lineHeight:1.1}}>
            {'MORAL MAYHEM'}
          </h1>
          {phase >= 5 && (
            <div className="mm-fade-in" style={{marginTop:'16px'}}>
              <p style={{fontFamily:'"Patrick Hand", cursive',fontSize:'clamp(14px,2.4vw,22px)',color:'#F0F0F0',margin:'0 0 6px',opacity:0.8}}>
                {'There are no right answers.'}
              </p>
              <p style={{fontFamily:'"Patrick Hand", cursive',fontSize:'clamp(12px,1.8vw,16px)',color:'#888',margin:'0 0 0',opacity:0.5}}>
                {'There might not even be wrong ones.'}
              </p>
              <p className="mm-press" style={{fontFamily:'"Nunito", sans-serif',fontSize:'clamp(12px,1.5vw,15px)',color:'#FF3366',marginTop:'40px',fontWeight:700,letterSpacing:'0.1em'}}>
                {'TAP TO BEGIN YOUR DESCENT'}
              </p>
            </div>
          )}
        </div>
      )}

      {!isRevealed && phase < 3 && (
        <p style={{position:'absolute',bottom:'24px',fontFamily:'"Nunito", sans-serif',fontSize:'11px',color:'#C8B898',opacity:0.4}}>
          {'tap to skip'}
        </p>
      )}
    </div>
  );
}

function ResumeScreen(props) {
  var savedLevel = props.savedLevel;
  var onResume = props.onResume;
  var onRestart = props.onRestart;
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',minHeight:'100vh',padding:'40px 24px',background:'#0A0A0A',position:'relative'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(0,255,65,0.04) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <p className="mm-mono mm-fade-in" style={{color:'#00FF41',fontSize:'14px',marginBottom:'32px',textAlign:'center',letterSpacing:'0.06em'}}>{'> PREVIOUS SESSION DETECTED'}</p>
      <p className="mm-fade-in mm-stagger-1" style={{color:'#F0F0F0',fontFamily:'"Nunito",sans-serif',fontSize:'22px',fontWeight:700,marginBottom:'8px',textAlign:'center'}}>Welcome back.</p>
      <p className="mm-fade-in mm-stagger-2" style={{color:'#888',fontFamily:'"Nunito",sans-serif',fontSize:'15px',marginBottom:'40px',textAlign:'center'}}>{'You were on Level ' + savedLevel + ' of 20.'}</p>
      <div className="mm-fade-in mm-stagger-3" style={{display:'flex',gap:'16px',flexWrap:'wrap',justifyContent:'center'}}>
        <button className="mm-btn-choice" onClick={onResume} style={{color:'#00FF41',borderColor:'#00FF41',minWidth:'180px'}}>Resume from Level {savedLevel}</button>
        <button className="mm-btn-choice" onClick={onRestart} style={{color:'#FF6B6B',borderColor:'#FF6B6B',minWidth:'180px'}}>Start Over</button>
      </div>
    </div>
  );
}

function LevelScreen(props) {
  var g = props.g;
  var colors = props.colors;
  var onChoice = props.onChoice;
  var onBack = props.onBack;
  var onMuteToggle = props.onMuteToggle;
  var scenario = SCENARIOS[g.currentLevel];
  var isSpectacle = scenario.isSpectacle;
  var SvgComp = scenario.SvgComponent;

  var timerState = useState(30);
  var timer = timerState[0];
  var setTimer = timerState[1];
  var shakeState = useState(false);
  var shaking = shakeState[0];
  var setShaking = shakeState[1];
  var chosenState = useState(null);
  var chosen = chosenState[0];
  var setChosen = chosenState[1];
  var flashState = useState(false);
  var flash = flashState[0];
  var setFlash = flashState[1];
  var intervalRef = useRef(null);
  var tickRef = useRef(null);

  useEffect(function() {
    setChosen(null);
    setTimer(30);
    if (!isSpectacle) {
      intervalRef.current = setInterval(function() {
        setTimer(function(t) {
          if (t <= 10 && t > 0) { playSound('beep'); }
          if (t <= 1) {
            clearInterval(intervalRef.current);
            var forced = Math.random() < 0.5 ? 'A' : 'B';
            onChoice(forced, true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return function() { clearInterval(intervalRef.current); };
  }, [g.currentLevel]);

  useEffect(function() {
    if (isSpectacle) {
      playSound('sting');
    } else {
      playSound('whoosh');
    }
  }, [g.currentLevel]);

  function handleChoice(choice) {
    if (chosen) return;
    clearInterval(intervalRef.current);
    setChosen(choice);
    if (isSpectacle) {
      setShaking(true);
      setFlash(true);
      setTimeout(function() { setShaking(false); }, 300);
      setTimeout(function() { setFlash(false); }, 500);
    }
    playSound('thunk');
    setTimeout(function() {
      onChoice(choice, false);
    }, isSpectacle ? 450 : 250);
  }

  function handleHover() {
    playSound('beep');
  }

  var timerPct = (timer / 30) * 100;
  var timerColor = timer > 15 ? colors.accent : (timer > 7 ? '#FF8800' : '#FF2222');
  var timerUrgent = timer <= 7 && timer > 0;

  var paperClass = colors.paper ? ' mm-paper' : '';
  var containerClass = 'mm-transition-in' + (shaking ? ' mm-shake' : '') + (colors.vignette ? ' mm-vignette' : '') + (colors.glitch ? ' mm-glitch' : '') + paperClass;

  var btnAClass = 'mm-btn-choice';
  var btnBClass = 'mm-btn-choice';
  if (chosen === 'A') { btnAClass += ' chosen'; btnBClass += ' unchosen'; }
  if (chosen === 'B') { btnBClass += ' chosen'; btnAClass += ' unchosen'; }

  return (
    <div className={containerClass} style={{flex:1,display:'flex',flexDirection:'column',minHeight:'100vh',padding:'16px',color:colors.text,position:'relative'}}>
      {flash && <div className="mm-spectacle-flash" style={{position:'fixed',inset:0,zIndex:200,pointerEvents:'none'}}/>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        {onBack ? <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:colors.text,fontFamily:'"Nunito",sans-serif',fontSize:'14px',padding:'4px 8px',opacity:0.7}}>← Back</button> : <span/>}
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          {isSpectacle && <span className="mm-badge mm-pulse" style={{color:colors.accent,borderColor:colors.accent}}>★ SPECTACLE</span>}
          <button onClick={onMuteToggle} style={{background:'none',border:'none',cursor:'pointer',color:colors.text,fontSize:'18px',padding:'4px'}}>{g.muted ? '🔇' : '🔊'}</button>
        </div>
      </div>

      <div className="mm-fade-in" style={{textAlign:'center',marginBottom:'12px'}}>
        <h1 className="mm-game-title" style={{fontSize:'clamp(22px,4vw,36px)',color:colors.accent,margin:'0 0 4px'}}>MORAL MAYHEM</h1>
        <p style={{fontFamily:'"Patrick Hand",cursive',fontSize:'clamp(13px,2vw,18px)',margin:0,opacity:0.7}}>
          {'Level ' + scenario.id + ': ' + scenario.name}
        </p>
      </div>

      <div className="mm-svg-wrap" style={{maxWidth:'460px',width:'100%',height:'clamp(180px,32vw,280px)',margin:'0 auto 16px',borderRadius:'12px',overflow:'visible',background:'rgba(255,255,255,0.06)'}}>
        <SvgComp/>
      </div>

      <p className="mm-scenario-text mm-fade-in mm-stagger-1" style={{maxWidth:'600px',margin:'0 auto 20px',fontSize:'clamp(14px,2vw,17px)',textAlign:'center',padding:'0 8px'}}>
        {scenario.scenario}
      </p>

      {!isSpectacle && (
        <div className="mm-fade-in mm-stagger-2" style={{maxWidth:'480px',margin:'0 auto 16px',width:'100%'}}>
          <div className="mm-poll-track" style={{height:'8px',borderRadius:'4px'}}>
            <div className="mm-poll-fill" style={{width:timerPct+'%',background:timerColor,borderRadius:'4px',transition:'width 1s linear'}}/>
          </div>
          <p className={timerUrgent ? 'mm-timer-urgent' : ''} style={{textAlign:'center',fontSize:'12px',opacity:timerUrgent ? 0.9 : 0.6,margin:'6px 0 0',fontFamily:'"Nunito",sans-serif',fontWeight:timerUrgent ? 700 : 400,color:timerUrgent ? '#FF2222' : 'inherit'}}>
            {timer > 0 ? timer + 's remaining' : 'Time\'s up — the universe decided for you.'}
          </p>
        </div>
      )}

      <div className="mm-fade-in mm-stagger-3" style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap',maxWidth:'600px',margin:'0 auto',padding:'0 8px 24px'}}>
        <button className={btnAClass} onMouseEnter={handleHover} onClick={function() { handleChoice('A'); }} style={{color:colors.text,flex:1,minWidth:'200px',maxWidth:'280px'}}>
          {scenario.choiceA.label}
        </button>
        <button className={btnBClass} onMouseEnter={handleHover} onClick={function() { handleChoice('B'); }} style={{color:colors.text,flex:1,minWidth:'200px',maxWidth:'280px'}}>
          {scenario.choiceB.label}
        </button>
      </div>

      <div style={{textAlign:'center',opacity:0.35,fontSize:'11px',fontFamily:'"Nunito",sans-serif',paddingBottom:'12px',letterSpacing:'0.08em'}}>
        {'Level ' + scenario.id + ' of 20'}
      </div>
    </div>
  );
}

function ConsequenceScreen(props) {
  var g = props.g;
  var colors = props.colors;
  var onNext = props.onNext;
  var onMuteToggle = props.onMuteToggle;

  var scenario = SCENARIOS[g.currentLevel];
  var choice = g.lastChoice;
  var forced = g.lastForced;
  var choiceData = choice === 'A' ? scenario.choiceA : scenario.choiceB;
  var pct = choice === 'A' ? scenario.pollSplit[0] : scenario.pollSplit[1];
  var votes = Math.round(scenario.totalVotes * pct / 100);
  var SvgComp = scenario.SvgComponent;

  var barState = useState(0);
  var barPct = barState[0];
  var setBarPct = barState[1];

  useEffect(function() {
    playSound('boing');
    var t = setTimeout(function() { setBarPct(pct); }, 400);
    return function() { clearTimeout(t); };
  }, []);

  var agreed = pct >= 50;
  var paperClass = colors.paper ? ' mm-paper' : '';

  return (
    <div className={'mm-transition-in' + paperClass} style={{flex:1,display:'flex',flexDirection:'column',minHeight:'100vh',padding:'16px',color:colors.text}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        <span/>
        <button onClick={onMuteToggle} style={{background:'none',border:'none',cursor:'pointer',color:colors.text,fontSize:'18px',padding:'4px'}}>{g.muted ? '🔇' : '🔊'}</button>
      </div>

      <div className="mm-fade-in" style={{textAlign:'center',marginBottom:'12px'}}>
        <h1 className="mm-game-title" style={{fontSize:'clamp(22px,4vw,36px)',color:colors.accent,margin:'0 0 4px'}}>MORAL MAYHEM</h1>
        <p style={{fontFamily:'"Patrick Hand",cursive',fontSize:'clamp(13px,2vw,18px)',margin:0,opacity:0.7}}>{'Level ' + scenario.id + ': ' + scenario.name}</p>
      </div>

      <div className="mm-fade-in mm-stagger-1" style={{maxWidth:'460px',width:'100%',height:'clamp(150px,26vw,230px)',margin:'0 auto 16px',opacity:0.55,filter:'grayscale(0.5) blur(0.5px)'}}>
        <SvgComp/>
      </div>

      {forced && (
        <p className="mm-fade-in mm-stagger-1" style={{textAlign:'center',fontFamily:'"Patrick Hand",cursive',fontSize:'14px',color:'#FF8800',marginBottom:'8px',maxWidth:'500px',margin:'0 auto 10px',fontWeight:600}}>
          You hesitated too long. The universe decided for you.
        </p>
      )}

      <div className="mm-fade-in mm-stagger-2" style={{maxWidth:'520px',width:'100%',margin:'0 auto',padding:'20px',background:'rgba(128,128,128,0.06)',borderRadius:'16px',marginBottom:'18px',border:'1px solid rgba(128,128,128,0.1)'}}>
        <p style={{fontFamily:'"Patrick Hand",cursive',fontSize:'clamp(13px,1.8vw,16px)',textAlign:'center',margin:'0 0 6px',opacity:0.5,letterSpacing:'0.04em'}}>
          {'You chose: ' + choiceData.label}
        </p>
        <p className="mm-scenario-text" style={{fontSize:'clamp(14px,2vw,17px)',textAlign:'center',margin:0}}>
          {choiceData.consequence}
        </p>
      </div>

      <div className="mm-fade-in mm-stagger-3" style={{maxWidth:'440px',width:'100%',margin:'0 auto 20px',padding:'0 8px'}}>
        <div className="mm-poll-track" style={{height:'10px',borderRadius:'5px'}}>
          <div className="mm-poll-fill" style={{width:barPct+'%',background:colors.accent,borderRadius:'5px'}}/>
        </div>
        <p style={{textAlign:'center',fontFamily:'"Nunito",sans-serif',fontSize:'13px',margin:'8px 0 0',opacity:0.75}}>
          {agreed ? '👍 ' : '👀 '}{pct + '% of people agreed with you (' + formatVotes(votes) + ' votes)'}
        </p>
        {!agreed && (
          <p style={{textAlign:'center',fontFamily:'"Patrick Hand",cursive',fontSize:'13px',margin:'4px 0 0',color:'#FF8800',opacity:0.8}}>
            Most people made the other choice. Just saying.
          </p>
        )}
      </div>

      <div className="mm-fade-in mm-stagger-4" style={{textAlign:'center',paddingBottom:'24px'}}>
        <button className="mm-btn-next" onClick={onNext} style={{background:colors.accent,color:colors.bg || '#FDF6EC',minWidth:'160px',fontSize:'16px',fontWeight:700,letterSpacing:'0.02em'}}>
          {g.currentLevel === 18 ? 'Prepare for the Final...' : 'Next →'}
        </button>
      </div>

      <div style={{textAlign:'center',opacity:0.3,fontSize:'11px',fontFamily:'"Nunito",sans-serif',paddingBottom:'12px',letterSpacing:'0.08em'}}>
        {'Level ' + scenario.id + ' of 20'}
      </div>
    </div>
  );
}

function Interstitial20Screen(props) {
  var onDone = props.onDone;
  var visState = useState(0);
  var vis = visState[0];
  var setVis = visState[1];

  useEffect(function() {
    playSound('heartbeat');
    var timers = [
      setTimeout(function() { setVis(1); }, 800),
      setTimeout(function() { setVis(2); playSound('heartbeat'); }, 2200),
      setTimeout(function() { setVis(3); }, 3600),
      setTimeout(function() { setVis(4); playSound('heartbeat'); }, 4800),
      setTimeout(function() { onDone(); }, 7500)
    ];
    return function() { timers.forEach(function(t) { clearTimeout(t); }); };
  }, []);

  return (
    <div onClick={onDone} style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0A0008',cursor:'pointer',userSelect:'none'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(255,0,30,0.18) 0%,transparent 70%)',animation:'mmPulse 1.2s ease-in-out infinite',pointerEvents:'none'}}/>
      {vis >= 1 && <p className="mm-inter-text mm-screen-in" style={{color:'#AA4444',fontSize:'clamp(16px,2.5vw,22px)',marginBottom:'16px',letterSpacing:'0.3em'}}>THIS IS IT.</p>}
      {vis >= 2 && <p className="mm-inter-text mm-screen-in" style={{color:'#CC3333',fontSize:'clamp(20px,3.5vw,30px)',marginBottom:'16px',letterSpacing:'0.25em'}}>NO GOING BACK.</p>}
      {vis >= 3 && <p className="mm-inter-text mm-screen-in" style={{color:'#EE2222',fontSize:'clamp(28px,5vw,48px)',marginBottom:'16px',letterSpacing:'0.2em'}}>LEVEL 20</p>}
      {vis >= 4 && <p className="mm-inter-text mm-pulse mm-screen-in" style={{color:'#FF0000',fontSize:'clamp(22px,4vw,40px)',textShadow:'0 0 30px rgba(255,0,0,0.8)',letterSpacing:'0.15em',textAlign:'center'}}>THE FINAL DILEMMA</p>}
      {vis >= 2 && <p className="mm-mono" style={{position:'absolute',bottom:'24px',color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>tap to skip</p>}
    </div>
  );
}

function GeneratingScreen(props) {
  var colors = props.colors;
  var dotsState = useState('');
  var dots = dotsState[0];
  var setDots = dotsState[1];
  var stepState = useState(0);
  var step = stepState[0];
  var setStep = stepState[1];

  useEffect(function() {
    var opts = ['.','..','...','....'];
    var i = 0;
    var iv = setInterval(function() {
      i = (i + 1) % opts.length;
      setDots(opts[i]);
    }, 400);
    var s1 = setTimeout(function() { setStep(1); playSound('beep'); }, 600);
    var s2 = setTimeout(function() { setStep(2); playSound('beep'); }, 1400);
    var s3 = setTimeout(function() { setStep(3); playSound('beep'); }, 2200);
    return function() { clearInterval(iv); clearTimeout(s1); clearTimeout(s2); clearTimeout(s3); };
  }, []);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',minHeight:'100vh',color:colors.text,background:colors.bg}}>
      <h1 className="mm-game-title mm-fade-in" style={{color:colors.accent,fontSize:'clamp(22px,4vw,36px)',marginBottom:'40px',textAlign:'center'}}>MORAL CALIBRATION COMPLETE.</h1>
      {step >= 1 && <p className="mm-mono mm-terminal-line" style={{fontSize:'14px',marginBottom:'10px',opacity:0.8}}>{'> ANALYZING DECISIONS' + dots}</p>}
      {step >= 2 && <p className="mm-mono mm-terminal-line" style={{fontSize:'14px',marginBottom:'10px',opacity:0.6,animationDelay:'0.1s'}}>{'> GENERATING MORAL PROFILE' + dots}</p>}
      {step >= 3 && <p className="mm-mono mm-terminal-line" style={{fontSize:'14px',marginBottom:'36px',opacity:0.4,animationDelay:'0.2s'}}>{'> CONSULTING THE COUNCIL' + dots}</p>}
      <div style={{width:'220px',height:'6px',background:'rgba(128,128,128,0.15)',borderRadius:'3px',overflow:'hidden'}}>
        <div style={{height:'100%',background:colors.accent,borderRadius:'3px',animation:'mmLoadProg 2.5s ease-in-out infinite'}}/>
      </div>
      <style>{'@keyframes mmLoadProg{0%{width:0%}50%{width:85%}100%{width:100%}}'}</style>
    </div>
  );
}

var CLOSING_LINES = [
  '> MORAL CALIBRATION UNIT: ANALYSIS COMPLETE',
  '> CROSS-REFERENCING 19 KNOWN ETHICAL FRAMEWORKS...',
  '> RESULT: YOU BROKE 14 OF THEM.',
  '> GENERATING PROFILE...',
  '> WARNING: SPIRIT ANIMAL IDENTIFIED.',
  '> WARNING: IT\'S JUDGING YOU.',
  '> DEPLOYING RESULTS...'
];

function ClosingTerminalScreen(props) {
  var onDone = props.onDone;
  var colors = props.colors;
  var linesState = useState([]);
  var lines = linesState[0];
  var setLines = linesState[1];
  var partialState = useState('');
  var partial = partialState[0];
  var setPartial = partialState[1];
  var doneState = useState(false);
  var done = doneState[0];
  var setDone = doneState[1];
  var liRef = useRef(0);
  var ciRef = useRef(0);
  var intervalRef = useRef(null);

  useEffect(function() {
    intervalRef.current = setInterval(function() {
      var li = liRef.current;
      var ci = ciRef.current;
      if (li >= CLOSING_LINES.length) {
        clearInterval(intervalRef.current);
        setDone(true);
        setPartial('');
        setTimeout(function() { onDone(); }, 1200);
        return;
      }
      var line = CLOSING_LINES[li];
      if (ci <= line.length) {
        setPartial(line.slice(0, ci));
        if (ci > 0 && ci % 5 === 0) { playSound('beep'); }
        ciRef.current = ci + 1;
      } else {
        setLines(function(prev) { return prev.concat([line]); });
        setPartial('');
        liRef.current = li + 1;
        ciRef.current = 0;
      }
    }, 32);
    return function() { clearInterval(intervalRef.current); };
  }, []);

  function handleClick() {
    clearInterval(intervalRef.current);
    onDone();
  }

  return (
    <div onClick={handleClick} style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'flex-start',padding:'10vh 8vw',cursor:'pointer',background:'#0A0008',minHeight:'100vh',position:'relative'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(140,0,200,0.1) 0%,transparent 70%)',pointerEvents:'none',animation:'mmPulse 3s ease-in-out infinite'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 4px)',pointerEvents:'none'}}/>
      {lines.map(function(l, i) {
        var isWarning = l.indexOf('WARNING') !== -1;
        return React.createElement('p', { key:i, className:'mm-mono', style:{ color: isWarning ? '#FF6644' : '#00FF41', fontSize:'clamp(11px,1.4vw,15px)', margin:'5px 0', lineHeight:1.6 } }, l);
      })}
      {partial !== '' && (
        <p className="mm-mono" style={{color:'#00FF41',fontSize:'clamp(11px,1.4vw,15px)',margin:'5px 0',lineHeight:1.6}}>
          {partial}<span className="mm-cursor"/>
        </p>
      )}
      {done && (
        <p className="mm-mono mm-press" style={{color:colors.accent,fontSize:'clamp(12px,1.5vw,17px)',marginTop:'28px',fontWeight:500}}>
          {'> DEPLOYING...'}
        </p>
      )}
    </div>
  );
}

function ResultsScreen(props) {
  var g = props.g;
  var colors = props.colors;
  var onPlayAgain = props.onPlayAgain;
  var onMuteToggle = props.onMuteToggle;

  var profile = g.profile || getFallbackProfile(g.chaosScore);
  var elapsed = g.startTime ? formatTime(Date.now() - g.startTime) : '?';
  var category = getAlignmentCategory(g.chaosScore);
  var copiedState = useState(false);
  var copied = copiedState[0];
  var setCopied = copiedState[1];

  useEffect(function() {
    playSound('fanfare');
  }, []);

  var chaosPct = Math.round((g.chaosScore / 20) * 100);

  function handleCopy() {
    var text = 'MORAL MAYHEM — Moral Profile\n\n';
    text += 'Alignment: "' + profile.title + '"\n';
    text += profile.roast + '\n\n';
    text += 'Chaos Score: ' + g.chaosScore + '/20 (' + chaosPct + '% chaotic)\n';
    text += 'Spirit Animal: ' + profile.spirit + '\n';
    text += 'Time Played: ' + elapsed + '\n';
    text += 'Category: ' + category + '\n\n';
    text += 'Think you can do worse? Play Moral Mayhem.';
    try {
      navigator.clipboard.writeText(text).then(function() {
        setCopied(true);
        setTimeout(function() { setCopied(false); }, 2000);
      }).catch(function() {});
    } catch (e) {}
  }

  return (
    <div className="mm-transition-in" style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 16px',minHeight:'100vh',color:colors.text}}>
      <div style={{display:'flex',justifyContent:'space-between',width:'100%',maxWidth:'560px',marginBottom:'16px'}}>
        <span/>
        <button onClick={onMuteToggle} style={{background:'none',border:'none',cursor:'pointer',color:colors.text,fontSize:'18px'}}>{g.muted ? '🔇' : '🔊'}</button>
      </div>

      <h1 className="mm-game-title mm-fade-in" style={{color:colors.accent,fontSize:'clamp(22px,4vw,36px)',textAlign:'center',marginBottom:'4px'}}>MORAL MAYHEM</h1>
      <p className="mm-fade-in mm-stagger-1" style={{fontFamily:'"Nunito",sans-serif',fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',opacity:0.5,marginBottom:'24px',textAlign:'center',textTransform:'uppercase'}}>Moral Calibration Complete</p>

      <div className="mm-profile-card mm-result-card-glow mm-fade-in mm-stagger-2" style={{background:'rgba(128,128,128,0.06)',borderColor:colors.accent,maxWidth:'520px',width:'100%',marginBottom:'24px',border:'2px solid ' + colors.accent,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%,rgba(128,128,128,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div className="mm-trophy-float" style={{width:'clamp(100px,22vw,160px)',height:'clamp(100px,22vw,160px)',margin:'0 auto 16px',position:'relative',zIndex:1}}>
          <SvgTrophy chaosScore={g.chaosScore}/>
        </div>

        <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'11px',fontWeight:700,letterSpacing:'0.18em',opacity:0.45,marginBottom:'4px',textTransform:'uppercase'}}>Your Moral Alignment</p>
        <h2 style={{fontFamily:'"Permanent Marker",cursive',color:colors.accent,fontSize:'clamp(18px,3.5vw,28px)',margin:'0 0 12px',textShadow:'2px 2px 0px rgba(0,0,0,0.08)'}}>
          {'"' + profile.title + '"'}
        </h2>

        <p className="mm-scenario-text" style={{fontSize:'clamp(14px,2vw,16px)',opacity:0.85,marginBottom:'24px',lineHeight:1.7,maxWidth:'440px',margin:'0 auto 24px'}}>
          {profile.roast}
        </p>

        <div style={{display:'flex',gap:'20px',justifyContent:'center',flexWrap:'wrap',marginBottom:'20px'}}>
          <div style={{textAlign:'center',minWidth:'80px'}}>
            <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'10px',fontWeight:700,letterSpacing:'0.12em',opacity:0.45,margin:'0 0 6px',textTransform:'uppercase'}}>Chaos Score</p>
            <p style={{fontFamily:'"Permanent Marker",cursive',fontSize:'28px',color:colors.accent,margin:0,lineHeight:1}}>{g.chaosScore + '/20'}</p>
          </div>
          <div style={{textAlign:'center',minWidth:'80px'}}>
            <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'10px',fontWeight:700,letterSpacing:'0.12em',opacity:0.45,margin:'0 0 6px',textTransform:'uppercase'}}>Spirit Animal</p>
            <p style={{fontFamily:'"Patrick Hand",cursive',fontSize:'20px',margin:0,lineHeight:1.2}}>{profile.spirit}</p>
          </div>
          <div style={{textAlign:'center',minWidth:'80px'}}>
            <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'10px',fontWeight:700,letterSpacing:'0.12em',opacity:0.45,margin:'0 0 6px',textTransform:'uppercase'}}>Time Played</p>
            <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'18px',fontWeight:700,margin:0,lineHeight:1.2}}>{elapsed}</p>
          </div>
        </div>

        <div style={{background:'rgba(128,128,128,0.08)',borderRadius:'10px',padding:'14px',marginBottom:'4px'}}>
          <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'10px',fontWeight:700,letterSpacing:'0.12em',opacity:0.45,margin:'0 0 8px',textAlign:'center',textTransform:'uppercase'}}>Chaos Meter</p>
          <div className="mm-poll-track" style={{height:'10px',borderRadius:'5px'}}>
            <div className="mm-poll-fill" style={{width:chaosPct+'%',background:colors.accent,borderRadius:'5px'}}/>
          </div>
          <p style={{fontFamily:'"Nunito",sans-serif',fontSize:'11px',textAlign:'center',margin:'6px 0 0',opacity:0.55}}>
            {category + ' (' + chaosPct + '% chaotic)'}
          </p>
        </div>
      </div>

      <div className="mm-fade-in mm-stagger-3" style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center',marginBottom:'20px'}}>
        <button className="mm-btn-next" onClick={onPlayAgain} style={{background:colors.accent,color:colors.bg || '#FDF6EC',minWidth:'160px',fontSize:'15px'}}>
          Play Again
        </button>
        <button className="mm-copy-btn" onClick={handleCopy} style={{color:colors.accent,borderColor:colors.accent,minWidth:'160px'}}>
          {copied ? '✓ Copied!' : '📋 Copy Results'}
        </button>
      </div>

      <p className="mm-fade-in mm-stagger-4" style={{fontFamily:'"Patrick Hand",cursive',fontSize:'12px',opacity:0.3,textAlign:'center'}}>
        by Rabbit Hole — "How deep does it go?"
      </p>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function MoralMayhem(props) {
  var onBack = props.onBack;

  var gRef = useRef({
    screen: 'loading',
    currentLevel: 0,
    choices: [],
    chaosScore: 0,
    lastChoice: null,
    lastForced: false,
    muted: false,
    profile: null,
    startTime: null,
    completed: false,
    saveExists: false,
    savedLevel: 1
  });
  var bumpState = useState(0);
  var setBump = bumpState[1];

  function rerender() { setBump(function(n) { return n + 1; }); }

  function g() { return gRef.current; }

  function saveGame() {
    var data = JSON.stringify({
      currentLevel: g().currentLevel,
      choices: g().choices,
      chaosScore: g().chaosScore,
      completed: g().completed,
      startTime: g().startTime
    });
    try {
      window.storage.set(SAVE_KEY, data).catch(function(e) { console.warn('save error', e); });
    } catch (e) { console.warn('save error', e); }
  }

  function clearSave() {
    try {
      window.storage.delete(SAVE_KEY).catch(function() {});
    } catch (e) {}
  }

  function generateProfile() {
    gRef.current.profile = getFallbackProfile(g().chaosScore);
    gRef.current.screen = 'closing-terminal';
    rerender();
  }

  useEffect(function() {
    try {
      window.storage.get(SAVE_KEY).then(function(result) {
        if (result && result.value) {
          try {
            var data = JSON.parse(result.value);
            if (data.currentLevel > 0 && !data.completed) {
              gRef.current.saveExists = true;
              gRef.current.savedLevel = data.currentLevel + 1;
              gRef.current.screen = 'resume';
              rerender();
              return;
            }
          } catch (e) {}
        }
        gRef.current.screen = 'intro';
        rerender();
      }).catch(function() {
        gRef.current.screen = 'intro';
        rerender();
      });
    } catch (e) {
      gRef.current.screen = 'intro';
      rerender();
    }
  }, []);

  function handleIntroDone() {
    gRef.current.screen = 'level';
    gRef.current.currentLevel = 0;
    gRef.current.startTime = Date.now();
    rerender();
  }

  function handleResume() {
    try {
      window.storage.get(SAVE_KEY).then(function(result) {
        if (result && result.value) {
          try {
            var data = JSON.parse(result.value);
            gRef.current.currentLevel = data.currentLevel;
            gRef.current.choices = data.choices || [];
            gRef.current.chaosScore = data.chaosScore || 0;
            gRef.current.startTime = data.startTime || Date.now();
          } catch (e) {}
        }
        gRef.current.screen = 'level';
        rerender();
      }).catch(function() {
        gRef.current.screen = 'level';
        rerender();
      });
    } catch (e) {
      gRef.current.screen = 'level';
      rerender();
    }
  }

  function handleRestart() {
    clearSave();
    gRef.current = {
      screen: 'intro',
      currentLevel: 0,
      choices: [],
      chaosScore: 0,
      lastChoice: null,
      lastForced: false,
      muted: gRef.current.muted,
      profile: null,
      startTime: null,
      completed: false,
      saveExists: false,
      savedLevel: 1
    };
    rerender();
  }

  function handleChoice(choice, forced) {
    var scenario = SCENARIOS[g().currentLevel];
    var chaosVal = choice === 'A' ? scenario.choiceA.chaosValue : scenario.choiceB.chaosValue;
    gRef.current.lastChoice = choice;
    gRef.current.lastForced = forced;
    gRef.current.chaosScore = g().chaosScore + chaosVal;
    gRef.current.choices = g().choices.concat([{ level: g().currentLevel, choice: choice, chaosValue: chaosVal }]);
    gRef.current.screen = 'consequence';
    saveGame();
    rerender();
  }

  function handleNext() {
    var nextIndex = g().currentLevel + 1;
    if (nextIndex >= 20) {
      gRef.current.screen = 'generating';
      gRef.current.completed = true;
      clearSave();
      rerender();
      generateProfile();
    } else if (nextIndex === 19) {
      gRef.current.screen = 'interstitial20';
      rerender();
    } else {
      gRef.current.currentLevel = nextIndex;
      gRef.current.screen = 'level';
      rerender();
    }
  }

  function handleInterstitialDone() {
    gRef.current.currentLevel = 19;
    gRef.current.screen = 'level';
    rerender();
  }

  function handleClosingTerminalDone() {
    gRef.current.screen = 'results';
    rerender();
  }

  function handleMuteToggle() {
    var newMuted = !g().muted;
    gRef.current.muted = newMuted;
    setAudioMuted(newMuted);
    rerender();
  }

  function handlePlayAgain() {
    clearSave();
    gRef.current = {
      screen: 'intro',
      currentLevel: 0,
      choices: [],
      chaosScore: 0,
      lastChoice: null,
      lastForced: false,
      muted: gRef.current.muted,
      profile: null,
      startTime: null,
      completed: false,
      saveExists: false,
      savedLevel: 1
    };
    rerender();
  }

  var colors = getPhaseColors(g().currentLevel);
  var screen = g().screen;

  var content;
  if (screen === 'loading') {
    content = React.createElement('div', { style:{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#000' } },
      React.createElement('p', { className:'mm-mono', style:{ color:'#00FF41', fontSize:'14px' } }, 'LOADING...')
    );
  } else if (screen === 'intro') {
    content = React.createElement(IntroScreen, { onDone: handleIntroDone });
  } else if (screen === 'resume') {
    content = React.createElement(ResumeScreen, { savedLevel: g().savedLevel, onResume: handleResume, onRestart: handleRestart });
  } else if (screen === 'level') {
    content = React.createElement(LevelScreen, { g: g(), colors: colors, onChoice: handleChoice, onBack: onBack || null, onMuteToggle: handleMuteToggle });
  } else if (screen === 'consequence') {
    content = React.createElement(ConsequenceScreen, { g: g(), colors: colors, onNext: handleNext, onMuteToggle: handleMuteToggle });
  } else if (screen === 'interstitial20') {
    content = React.createElement(Interstitial20Screen, { onDone: handleInterstitialDone });
  } else if (screen === 'generating') {
    content = React.createElement(GeneratingScreen, { colors: colors });
  } else if (screen === 'closing-terminal') {
    content = React.createElement(ClosingTerminalScreen, { onDone: handleClosingTerminalDone, colors: colors });
  } else if (screen === 'results') {
    content = React.createElement(ResultsScreen, { g: g(), colors: colors, onPlayAgain: handlePlayAgain, onMuteToggle: handleMuteToggle });
  } else {
    content = null;
  }

  var rootBg = (screen === 'loading' || screen === 'resume') ? '#000' :
               (screen === 'intro') ? 'transparent' :
               (screen === 'interstitial20') ? '#0A0008' :
               (screen === 'closing-terminal') ? '#0A0008' :
               colors.bg;

  var rootClass = 'mm-root';

  return (
    <div className={rootClass} style={{background:rootBg,color:colors.text,minHeight:'100vh'}}>
      <style>{GAME_CSS}</style>
      {content}
    </div>
  );
}
