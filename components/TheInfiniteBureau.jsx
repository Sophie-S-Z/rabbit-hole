"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";

/* ═════════════════════════════════════════════════════════════
   THE INFINITE BUREAU — v2
   A bureaucratic puzzle/adventure game
   ═════════════════════════════════════════════════════════════ */

var SAVE_KEY = "bureau-save-v2";

function loadFonts() {
  if (document.getElementById("bureau-fonts-v2")) return;
  var link = document.createElement("link");
  link.id = "bureau-fonts-v2";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(link);
}

var RANKS = [
  { min: 0, title: "Trainee Clerk" },
  { min: 3, title: "Clerk" },
  { min: 6, title: "Senior Clerk" },
  { min: 10, title: "Processing Officer" },
  { min: 15, title: "Dept. Liaison" },
  { min: 20, title: "Senior Liaison" },
  { min: 25, title: "Archive Accessor" },
  { min: 30, title: "Bureau Archivist" },
];

function getRank(clearance) {
  var rank = RANKS[0];
  for (var i = 0; i < RANKS.length; i++) {
    if (clearance >= RANKS[i].min) rank = RANKS[i];
  }
  return rank;
}

var ACT_THRESHOLDS = [0, 0, 8, 18, 24];
function getAct(clr) {
  if (clr >= 24) return 4;
  if (clr >= 18) return 3;
  if (clr >= 8) return 2;
  return 1;
}
function getNextThreshold(act) { return act >= 4 ? 999 : ACT_THRESHOLDS[act + 1]; }

var THEMES = {
  1: {
    bg: "#EDE8DC", surface: "#FDFAF3", surfaceAlt: "#F5F0E6",
    text: "#1B2A4A", textMuted: "#6B7280", textLight: "#9CA3AF",
    border: "#C4B99A", borderLight: "#DDD6C3",
    accent: "#2E5090", accentDark: "#1B2A4A", accentGlow: "rgba(46,80,144,0.12)",
    approve: "#1B7A3D", deny: "#8B1A1A", redirect: "#8B6914",
    approveGlow: "rgba(27,122,61,0.10)", denyGlow: "rgba(139,26,26,0.10)",
    headerFont: "'Libre Baskerville', serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    monoFont: "'IBM Plex Mono', monospace",
    stampBg: "rgba(255,255,250,0.93)",
  },
  2: {
    bg: "#E4DFD2", surface: "#F8F5EC", surfaceAlt: "#EDEADF",
    text: "#1B2A4A", textMuted: "#5A6270", textLight: "#8B91A0",
    border: "#B0A78E", borderLight: "#CCC5B0",
    accent: "#2E5090", accentDark: "#1B2A4A", accentGlow: "rgba(46,80,144,0.10)",
    approve: "#1B7A3D", deny: "#8B1A1A", redirect: "#8B6914",
    approveGlow: "rgba(27,122,61,0.08)", denyGlow: "rgba(139,26,26,0.08)",
    headerFont: "'Libre Baskerville', serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    monoFont: "'IBM Plex Mono', monospace",
    stampBg: "rgba(248,245,236,0.93)",
  },
  3: {
    bg: "#C8C1B2", surface: "#E0DBCE", surfaceAlt: "#D2CCC0",
    text: "#1B1B2E", textMuted: "#484860", textLight: "#70708A",
    border: "#9A9080", borderLight: "#B8AE9C",
    accent: "#5A3E90", accentDark: "#2E1B60", accentGlow: "rgba(90,62,144,0.12)",
    approve: "#1B6A3D", deny: "#7A1A2A", redirect: "#6B5914",
    approveGlow: "rgba(27,106,61,0.08)", denyGlow: "rgba(122,26,42,0.08)",
    headerFont: "'Libre Baskerville', serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    monoFont: "'IBM Plex Mono', monospace",
    stampBg: "rgba(224,219,206,0.90)",
  },
  4: {
    bg: "#080808", surface: "#101012", surfaceAlt: "#18181C",
    text: "#33FF66", textMuted: "#1A9944", textLight: "#0D6630",
    border: "#1A3322", borderLight: "#0F1F15",
    accent: "#33FF66", accentDark: "#1A9944", accentGlow: "rgba(51,255,102,0.08)",
    approve: "#33FF66", deny: "#FF4444", redirect: "#FFAA33",
    approveGlow: "rgba(51,255,102,0.06)", denyGlow: "rgba(255,68,68,0.06)",
    headerFont: "'IBM Plex Mono', monospace",
    bodyFont: "'IBM Plex Mono', monospace",
    monoFont: "'IBM Plex Mono', monospace",
    stampBg: "rgba(16,16,18,0.93)",
  },
};

var ALL_RULES = [
  { id: "R-001", dept: "General Processing", act: 1, text: "All forms must bear a valid Bureau Identification Number (format: BUR-XXXX, where X is a digit 0–9)." },
  { id: "R-002", dept: "General Processing", act: 1, text: "Permit renewal applications require the original permit number in the designated field." },
  { id: "R-003", dept: "General Processing", act: 1, text: "Name change requests require the notarized signatures of two (2) witnesses." },
  { id: "R-004", dept: "General Processing", act: 1, text: "All forms must be dated within the current processing period. Future-dated forms are invalid." },
  { id: "R-005", dept: "General Processing", act: 1, text: "Lost property claims require a physical description of no fewer than ten (10) words." },
  { id: "R-006", dept: "General Processing", act: 1, text: "Residency verification applications require documented proof of address (utility bill, lease, or Bureau-issued certificate)." },
  { id: "R-101", dept: "Dept. of Circular Reasoning", act: 2, text: "All interdepartmental transfer requests require prior authorization via Form DCR-7." },
  { id: "R-102", dept: "Dept. of Circular Reasoning", act: 2, text: "Form DCR-7 may only be issued upon successful completion of the interdepartmental transfer it authorizes." },
  { id: "R-103", dept: "Dept. of Circular Reasoning", act: 2, text: "Requests that cannot be completed due to procedural conflict must be redirected to the originating department." },
  { id: "R-201", dept: "Bureau of Retroactive Permissions", act: 2, text: "Retroactive permits may cover actions performed up to thirty (30) days prior to the date of filing." },
  { id: "R-202", dept: "Bureau of Retroactive Permissions", act: 2, text: "All retroactive permit applications must reference the original Notice of Violation by number." },
  { id: "R-203", dept: "Bureau of Retroactive Permissions", act: 2, text: "Retroactive permits for noise violations additionally require signatures of two (2) affected neighbors." },
  { id: "R-301", dept: "Office of Preemptive Apologies", act: 2, text: "Preemptive apology filings must specify the anticipated infraction in sufficient detail for classification." },
  { id: "R-302", dept: "Office of Preemptive Apologies", act: 2, text: "The filing of a preemptive apology shall not constitute evidence of intent to commit the specified infraction." },
  { id: "R-303", dept: "Office of Preemptive Apologies", act: 2, text: "AMENDMENT (Directive 77-B): The filing of a preemptive apology SHALL constitute evidence of intent. R-302 is under review." },
  { id: "R-401", dept: "The Labyrinth", act: 3, text: "All forms must be processed in the department from which they originate. No exceptions." },
  { id: "R-402", dept: "The Labyrinth", act: 3, text: "Forms originating from within The Labyrinth may not be redirected under any circumstances." },
  { id: "R-403", dept: "The Labyrinth", act: 3, text: "Bureau employees are subject to the same processing requirements as citizens." },
  { id: "R-404", dept: "The Labyrinth", act: 3, text: "[This rule intentionally left blank.]" },
  { id: "R-405", dept: "The Labyrinth", act: 3, text: "Rule R-404 is not blank. Refer to the previous version of R-404, which has been archived. See R-404." },
  { id: "R-501", dept: "The Archive", act: 4, text: "All archived forms are true." },
  { id: "R-502", dept: "The Archive", act: 4, text: "The Archive does not make errors." },
  { id: "R-503", dept: "The Archive", act: 4, text: "In cases where the Archive and observable reality disagree, the Archive is correct." },
];

var ALL_FORMS = [
  // ACT 1 (10 forms)
  { id:"F-0001", act:1, dept:"General Processing", type:"Permit Renewal", citizen:"Margaret Holloway", tutorial:true,
    fields:[ {label:"Bureau ID",value:"BUR-4521"},{label:"Request Type",value:"Permit Renewal — Residential Parking"},{label:"Original Permit No.",value:"GP-29871"},{label:"Date Filed",value:"2026-04-15"},{label:"Purpose",value:"Extension of residential parking permit, Zone C, for an additional 12-month period."} ],
    rules:["R-001","R-002","R-004"], violations:[], correct:"approve",
    explanation:"All applicable rules satisfied. Bureau ID valid (BUR-4521), original permit number present (GP-29871), date is within the processing period.",
    hint:"Check each rule listed under APPLICABLE RULES against the form fields. Is the Bureau ID formatted correctly? Is the permit number present? Is the date valid?" },
  { id:"F-0002", act:1, dept:"General Processing", type:"Name Change", citizen:"Theodore Vance",
    fields:[ {label:"Bureau ID",value:"BUR-8834"},{label:"Request Type",value:"Legal Name Change"},{label:"Current Legal Name",value:"Theodore Vance"},{label:"Requested Name",value:"Theodore Vance-Morrison"},{label:"Date Filed",value:"2026-04-10"},{label:"Witness 1",value:"Elena Vance (notarized)"},{label:"Witness 2",value:"—"} ],
    rules:["R-001","R-003","R-004"], violations:["R-003"], correct:"deny",
    explanation:"Rule R-003 requires two (2) notarized witness signatures. Only one witness is present. The second witness field is blank.",
    hint:"How many witnesses does this name change have? How many does the rulebook require?" },
  { id:"F-0003", act:1, dept:"General Processing", type:"Lost Property Claim", citizen:"Diane Okafor",
    fields:[ {label:"Bureau ID",value:"BUR-3310"},{label:"Request Type",value:"Lost Property Claim"},{label:"Item Description",value:"A brown bag."},{label:"Date Filed",value:"2026-04-12"},{label:"Location Lost",value:"Bureau Main Hall, Floor 2"} ],
    rules:["R-001","R-004","R-005"], violations:["R-005"], correct:"deny",
    explanation:"Rule R-005 requires a physical description of no fewer than ten (10) words. \"A brown bag\" is only three words.",
    hint:"Count the words in the item description. How many words does R-005 require?" },
  { id:"F-0004", act:1, dept:"General Processing", type:"Permit Renewal", citizen:"Harold Finch",
    fields:[ {label:"Bureau ID",value:"BUR-7B"},{label:"Request Type",value:"Permit Renewal — Commercial Signage"},{label:"Original Permit No.",value:"GP-11204"},{label:"Date Filed",value:"2026-04-14"},{label:"Purpose",value:"Renewal of commercial signage permit for storefront at 440 Birch Lane."} ],
    rules:["R-001","R-002","R-004"], violations:["R-001"], correct:"deny",
    explanation:"Rule R-001 requires Bureau ID format BUR-XXXX (four digits). \"BUR-7B\" contains a letter and only two characters.",
    hint:"Look closely at the Bureau ID. Does it match the exact format specified in R-001?" },
  { id:"F-0005", act:1, dept:"General Processing", type:"Residency Verification", citizen:"Alma Reyes",
    fields:[ {label:"Bureau ID",value:"BUR-5590"},{label:"Request Type",value:"Residency Verification"},{label:"Address",value:"1122 Elm Terrace, Unit 4B"},{label:"Proof of Address",value:"Municipal Water Bill (March 2026)"},{label:"Date Filed",value:"2026-04-08"} ],
    rules:["R-001","R-004","R-006"], violations:[], correct:"approve",
    explanation:"All rules satisfied. Bureau ID valid, date within processing period, proof of address provided (utility bill).",
    hint:"Verify each rule: Is the Bureau ID formatted correctly? Is the date current? Does the citizen have documented proof of address?" },
  { id:"F-0006", act:1, dept:"General Processing", type:"Name Change", citizen:"Priya Chattopadhyay",
    fields:[ {label:"Bureau ID",value:"BUR-2281"},{label:"Request Type",value:"Legal Name Change"},{label:"Current Legal Name",value:"Priya Chattopadhyay"},{label:"Requested Name",value:"Priya Shah"},{label:"Date Filed",value:"2027-01-15"},{label:"Witness 1",value:"Rohan Shah (notarized)"},{label:"Witness 2",value:"Meena Devi (notarized)"} ],
    rules:["R-001","R-003","R-004"], violations:["R-004"], correct:"deny",
    explanation:"Rule R-004 prohibits future-dated forms. The filing date of 2027-01-15 is in the future. Both witnesses are present, but the date invalidates the form.",
    hint:"Everything looks correct at first glance. Check every field against every rule—including the date. What year is it?" },
  { id:"F-0007", act:1, dept:"General Processing", type:"Lost Property Claim", citizen:"George Weatherall",
    fields:[ {label:"Bureau ID",value:"BUR-6104"},{label:"Request Type",value:"Lost Property Claim"},{label:"Item Description",value:"One leather briefcase, dark brown, brass clasps, containing a manila folder of personal documents and a silver pocket watch with engraved inscription on the back."},{label:"Date Filed",value:"2026-04-13"},{label:"Location Lost",value:"Bureau Sub-Level 3, Corridor D"} ],
    rules:["R-001","R-004","R-005"], violations:[], correct:"approve",
    explanation:"All rules satisfied. Bureau ID valid, date current, item description well exceeds ten words.",
    hint:"Count the words in the description and check the other fields against applicable rules." },
  { id:"F-0008", act:1, dept:"General Processing", type:"Permit Renewal", citizen:"Nina Kowalski",
    fields:[ {label:"Bureau ID",value:"BUR-9017"},{label:"Request Type",value:"Permit Renewal — Food Service"},{label:"Original Permit No.",value:"—"},{label:"Date Filed",value:"2026-04-11"},{label:"Purpose",value:"Renewal of food service operating permit for Kowalski Delicatessen."} ],
    rules:["R-001","R-002","R-004"], violations:["R-002"], correct:"deny",
    explanation:"Rule R-002 requires the original permit number for renewals. The field shows \"—\" (blank/missing).",
    hint:"This is a permit renewal. R-002 has a specific requirement for renewals. Check the original permit field." },
  { id:"F-0009", act:1, dept:"General Processing", type:"Residency Verification", citizen:"Chen Wei-Lin",
    fields:[ {label:"Bureau ID",value:"BUR-4102"},{label:"Request Type",value:"Residency Verification"},{label:"Address",value:"88 Canal Street, Apt 12F"},{label:"Proof of Address",value:"Self-attestation (verbal)"},{label:"Date Filed",value:"2026-04-16"} ],
    rules:["R-001","R-004","R-006"], violations:["R-006"], correct:"deny",
    explanation:"Rule R-006 requires documented proof of address: a utility bill, lease, or Bureau-issued certificate. \"Self-attestation (verbal)\" is not accepted documentation.",
    hint:"What counts as acceptable proof of address according to R-006? Does a verbal self-attestation qualify?" },
  { id:"F-0010", act:1, dept:"General Processing", type:"Name Change", citizen:"James Oduya",
    fields:[ {label:"Bureau ID",value:"BUR-7750"},{label:"Request Type",value:"Legal Name Change"},{label:"Current Legal Name",value:"James Oduya"},{label:"Requested Name",value:"James Oduya-Petersen"},{label:"Date Filed",value:"2026-04-09"},{label:"Witness 1",value:"Karl Petersen (notarized)"},{label:"Witness 2",value:"Linda Oduya (notarized)"} ],
    rules:["R-001","R-003","R-004"], violations:[], correct:"approve",
    explanation:"All rules satisfied. Bureau ID valid, two notarized witnesses present, date within processing period.",
    hint:"Check the Bureau ID format, the number of witnesses, and the filing date." },

  // ACT 2 (8 forms)
  { id:"F-1001", act:2, dept:"Dept. of Circular Reasoning", type:"Interdepartmental Transfer", citizen:"Wallace Breen",
    fields:[ {label:"Bureau ID",value:"BUR-3340"},{label:"Request Type",value:"Transfer to Bureau of Retroactive Permissions"},{label:"Form DCR-7 Status",value:"Attached (Pre-authorized)"},{label:"Transfer Status",value:"Pending"},{label:"Date Filed",value:"2026-04-16"},{label:"Reason",value:"Citizen requires retroactive processing of a permit originally filed with this department."} ],
    rules:["R-001","R-101","R-102","R-103"], violations:["R-102"], correct:"redirect",
    explanation:"Procedural paradox: R-101 requires Form DCR-7 before transfer, but R-102 says DCR-7 can only be issued after transfer. Pre-authorization violates R-102. Per R-103, procedural conflicts require redirection.",
    hint:"Read R-101 and R-102 together. Can both be satisfied simultaneously? What does R-103 say about conflicts?" },
  { id:"F-1002", act:2, dept:"Bureau of Retroactive Permissions", type:"Retroactive Permit", citizen:"Sonia Mbeki",
    fields:[ {label:"Bureau ID",value:"BUR-7712"},{label:"Request Type",value:"Retroactive Permit — Garden Modification"},{label:"Date of Violation",value:"2026-03-22"},{label:"Date Filed",value:"2026-04-17"},{label:"Notice of Violation Ref.",value:"NOV-88214"},{label:"Description",value:"Installation of raised garden bed in public easement without prior authorization."} ],
    rules:["R-001","R-201","R-202"], violations:[], correct:"approve",
    explanation:"All rules satisfied. Violation was 26 days prior (within 30-day limit per R-201). Notice of Violation referenced (R-202). Bureau ID valid.",
    hint:"Calculate the days between the violation and filing. Is the Notice of Violation referenced?" },
  { id:"F-1003", act:2, dept:"Bureau of Retroactive Permissions", type:"Retroactive Permit", citizen:"Edmund Hale",
    fields:[ {label:"Bureau ID",value:"BUR-4455"},{label:"Request Type",value:"Retroactive Permit — Excessive Noise (Residential)"},{label:"Date of Violation",value:"2026-04-01"},{label:"Date Filed",value:"2026-04-18"},{label:"Notice of Violation Ref.",value:"NOV-90102"},{label:"Neighbor Signature 1",value:"R. Patel (signed)"},{label:"Neighbor Signature 2",value:"—"} ],
    rules:["R-001","R-201","R-202","R-203"], violations:["R-203"], correct:"deny",
    explanation:"Rule R-203 requires two (2) affected neighbor signatures for noise violations. Only one signature is present.",
    hint:"This is a noise violation. Is there a special rule that applies specifically to noise violations?" },
  { id:"F-1004", act:2, dept:"Office of Preemptive Apologies", type:"Preemptive Apology", citizen:"Clara Whitfield",
    fields:[ {label:"Bureau ID",value:"BUR-6691"},{label:"Request Type",value:"Preemptive Apology Filing"},{label:"Anticipated Infraction",value:"Temporary obstruction of sidewalk during furniture delivery, estimated duration 45 minutes, on April 25, 2026."},{label:"Date Filed",value:"2026-04-19"} ],
    rules:["R-001","R-301","R-302","R-303"], violations:[], correct:"approve", flexible:true,
    explanation:"The infraction is specified in detail (R-301). R-302 and R-303 contradict each other on intent. The citizen filed in good faith. Either action is defensible.",
    hint:"R-302 and R-303 directly contradict. When rules conflict, consider the citizen’s clearly stated good-faith intent." },
  { id:"F-1005", act:2, dept:"Office of Preemptive Apologies", type:"Preemptive Apology", citizen:"Anonymous",
    fields:[ {label:"Bureau ID",value:"BUR-0099"},{label:"Request Type",value:"Preemptive Apology Filing"},{label:"Anticipated Infraction",value:"General wrongdoing. The citizen apologizes for anything they might do."},{label:"Date Filed",value:"2026-04-20"} ],
    rules:["R-001","R-301"], violations:["R-301"], correct:"deny",
    explanation:"Rule R-301 requires sufficient detail for classification. \"General wrongdoing\" is not specific enough.",
    hint:"Is \"general wrongdoing\" specific enough to classify as a particular type of infraction?" },
  { id:"F-1006", act:2, dept:"Dept. of Circular Reasoning", type:"Interdepartmental Transfer", citizen:"Marcus Aurelius Webb",
    fields:[ {label:"Bureau ID",value:"BUR-1177"},{label:"Request Type",value:"Transfer TO Dept. of Circular Reasoning"},{label:"Form DCR-7 Status",value:"Not attached — citizen claims the transfer IS the DCR-7"},{label:"Transfer Status",value:"Pending"},{label:"Date Filed",value:"2026-04-17"},{label:"Reason",value:"Citizen wishes to transfer here to obtain DCR-7 to authorize transfer here."} ],
    rules:["R-001","R-101","R-102","R-103"], violations:["R-101"], correct:"redirect",
    explanation:"R-101 requires DCR-7 which isn’t attached. R-102 prevents issuing it before transfer. Per R-103, redirect.",
    hint:"The citizen’s argument is clever, but do the rules as written support it?" },
  { id:"F-1007", act:2, dept:"Bureau of Retroactive Permissions", type:"Retroactive Permit", citizen:"Yusuf Al-Rashid",
    fields:[ {label:"Bureau ID",value:"BUR-3289"},{label:"Request Type",value:"Retroactive Permit — Unauthorized Street Performance"},{label:"Date of Violation",value:"2026-03-01"},{label:"Date Filed",value:"2026-04-21"},{label:"Notice of Violation Ref.",value:"NOV-71003"},{label:"Description",value:"Unlicensed accordion performance in Bureau plaza, 3 hours."} ],
    rules:["R-001","R-201","R-202"], violations:["R-201"], correct:"deny",
    explanation:"Rule R-201 limits retroactive permits to 30 days. The violation was 51 days prior, exceeding the limit.",
    hint:"How many days between the violation and filing date? What is the limit set by R-201?" },
  { id:"F-1008", act:2, dept:"Dept. of Circular Reasoning", type:"Cross-Department Filing", citizen:"Beatrice Loom",
    fields:[ {label:"Bureau ID",value:"BUR-5544"},{label:"Request Type",value:"Preemptive Apology for Future Retroactive Permit"},{label:"Originating Dept.",value:"Office of Preemptive Apologies"},{label:"Destination Dept.",value:"Bureau of Retroactive Permissions"},{label:"Form DCR-7 Status",value:"Not attached"},{label:"Date Filed",value:"2026-04-22"},{label:"Description",value:"Citizen wishes to preemptively apologize for a violation she intends to retroactively permit."} ],
    rules:["R-001","R-101","R-103","R-301"], violations:["R-101","R-301"], correct:"redirect",
    explanation:"No DCR-7 for the transfer (R-101). The infraction is described in bureaucratic terms, not classifiable acts (R-301). Cross-department conflicts require redirection (R-103).",
    hint:"This form crosses departments. Does it satisfy both departments’ rules?" },

  // ACT 3 (5 forms)
  { id:"F-2001", act:3, dept:"The Labyrinth", type:"Meta-Processing Request", citizen:"The Bureau",
    fields:[ {label:"Bureau ID",value:"BUR-0001"},{label:"Request Type",value:"Request for Processing of This Form"},{label:"Form to Process",value:"F-2001 (this form)"},{label:"Date Filed",value:"See: Date of Processing"},{label:"Originating Dept.",value:"The Labyrinth"},{label:"Purpose",value:"This form requests that it be processed. Processing constitutes approval. Denial constitutes processing, therefore approval."} ],
    rules:["R-001","R-401","R-402"], violations:[], correct:"approve",
    explanation:"Originates from The Labyrinth (R-401). Cannot be redirected (R-402). Denial equals processing equals approval. The only consistent action is approval.",
    hint:"Read the Purpose. Can you deny it? Can you redirect it? What’s left?" },
  { id:"F-2002", act:3, dept:"The Labyrinth", type:"Employee Release Request", citizen:"PLAYER_NAME",
    fields:[ {label:"Bureau ID",value:"PLAYER_BUREAU_ID"},{label:"Request Type",value:"Release from Bureau Service"},{label:"Employee ID",value:"PLAYER_EMPLOYEE_ID"},{label:"Date Filed",value:"2026-04-22"},{label:"Reason",value:"The employee wishes to leave. The employee does not recall being hired."},{label:"Supervisor Approval",value:"N/A — No supervisor on record"} ],
    rules:["R-001","R-402","R-403"], violations:[], correct:"approve", triggersEvent:"flagged",
    explanation:"Per R-403, you must process your own forms. Cannot redirect (R-402). All requirements met. Approval is procedurally correct.",
    hint:"This is your form. R-403 says you must process it. R-402 says you can’t redirect." },
  { id:"F-2003", act:3, dept:"The Labyrinth", type:"Temporal Exception Request", citizen:"Dr. Helen Castor",
    fields:[ {label:"Bureau ID",value:"BUR-8190"},{label:"Request Type",value:"Permit — Temporal Exception"},{label:"Date Filed",value:"2026-04-25"},{label:"Date of Incident",value:"2026-04-28"},{label:"Originating Dept.",value:"Bureau of Retroactive Permissions"},{label:"Purpose",value:"Retroactive permission for an event occurring three days from now."} ],
    rules:["R-004","R-201","R-401"], violations:["R-004","R-401"], correct:"deny",
    explanation:"R-004 prohibits future-dated incidents. R-201 covers past actions only. R-401: originates from Retroactive Permissions, not The Labyrinth.",
    hint:"What do the rules say about future dates? And where did this form actually originate?" },
  { id:"F-2004", act:3, dept:"The Labyrinth", type:"Redacted Form", citizen:"[REDACTED]",
    fields:[ {label:"Bureau ID",value:"[REDACTED]"},{label:"Request Type",value:"[REDACTED]"},{label:"Date Filed",value:"[REDACTED]"},{label:"Purpose",value:"[REDACTED]"},{label:"Classification",value:"LEVEL 9 — ABOVE YOUR CLEARANCE"} ],
    rules:["R-001","R-004"], violations:["R-001","R-004"], correct:"deny",
    explanation:"No fields can be verified. Bureau ID redacted (R-001 unconfirmable). Date redacted (R-004 unconfirmable). Unverifiable forms cannot be approved.",
    hint:"If you cannot see the fields, can you confirm that any rule is satisfied?" },
  { id:"F-2005", act:3, dept:"The Labyrinth", type:"Clerk Evaluation", citizen:"The Bureau",
    fields:[ {label:"Bureau ID",value:"BUR-0001"},{label:"Record Type",value:"Clerk Performance Evaluation"},{label:"Subject",value:"PLAYER_NAME"},{label:"Rating",value:"ADEQUATE"},{label:"Recommendation",value:"Continue processing. The Archive awaits."},{label:"Originating Dept.",value:"The Labyrinth"} ],
    rules:["R-401","R-402","R-403"], violations:[], correct:"approve",
    explanation:"Per R-403, you process your own forms. Originates from The Labyrinth (R-401). Cannot redirect (R-402). Approve and proceed.",
    hint:"This is your evaluation. What does the recommendation say?" },

  // ACT 4 (2 forms + ending)
  { id:"F-3001", act:4, dept:"The Archive", type:"Bureau Origin Record", citizen:"N/A — Institutional Record",
    fields:[ {label:"Bureau ID",value:"BUR-0000"},{label:"Record Type",value:"Founding Document"},{label:"Date of Establishment",value:"Before standardized timekeeping"},{label:"Established By",value:"The Bureau"},{label:"Purpose",value:"The Bureau exists to process forms. Forms exist to be processed by the Bureau."} ],
    rules:["R-501","R-502"], violations:[], correct:"approve",
    explanation:"R-501: All archived forms are true. R-502: The Archive does not make errors. This form is archived and therefore true.",
    hint:"R-501 and R-502 are absolute. What choice do you have?" },
  { id:"F-3002", act:4, dept:"The Archive", type:"Clerk Processing Record", citizen:"PLAYER_NAME", isFinal:true,
    fields:[ {label:"Bureau ID",value:"PLAYER_BUREAU_ID"},{label:"Record Type",value:"Employee Performance Archive"},{label:"Forms Processed",value:"PLAYER_FORMS_COUNT"},{label:"Approval Rate",value:"PLAYER_APPROVAL_RATE"},{label:"Infractions",value:"PLAYER_INFRACTIONS"},{label:"Classification",value:"PLAYER_CLASSIFICATION"},{label:"Archive Note",value:"This clerk has reached the Archive. This form is the last form. Or the first."} ],
    rules:["R-501","R-502","R-503"], violations:[], correct:"approve",
    explanation:"The Archive is always correct (R-503). This is your record. It is true.",
    hint:"The Archive says this is true. R-503 says the Archive is always correct." },
];

var DEPARTMENTS = [
  { id:"general", name:"General Processing", act:1, clearance:0, desc:"Standard form processing. The foundation of all Bureau operations." },
  { id:"circular", name:"Dept. of Circular Reasoning", act:2, clearance:8, desc:"Handles interdepartmental transfers and procedural conflicts." },
  { id:"retroactive", name:"Bureau of Retroactive Permissions", act:2, clearance:10, desc:"Issues permits for actions already taken." },
  { id:"preemptive", name:"Office of Preemptive Apologies", act:2, clearance:12, desc:"Accepts apologies for infractions not yet committed." },
  { id:"labyrinth", name:"The Labyrinth", act:3, clearance:18, desc:"You should not be here. Please process the forms." },
  { id:"archive", name:"The Archive", act:4, clearance:24, desc:"The bottom. The beginning. Everything true." },
];

var ALL_MEMOS = [
  { id:"M-001", act:1, afterForm:"F-0002", from:"Bureau Administration", subject:"Welcome to General Processing",
    body:"Welcome, Clerk. Your desk has been assigned. Your rulebook has been issued. Your purpose is clear: process the forms.\n\nPlease note that the water cooler on Floor 3 is for staff use only. The water cooler on Floor 7 has been reclassified and is no longer a water cooler. Do not visit Floor 7.\n\nWe look forward to your continued service.\n\n— Bureau Administration" },
  { id:"M-002", act:1, afterForm:"F-0005", from:"Maintenance Division", subject:"RE: Flickering Lights in Corridor B",
    body:"This is the fourth report regarding flickering lights in Corridor B. Maintenance has determined the lights are not flickering. They are operating as intended.\n\nIf they appear to flicker, please adjust your perception accordingly.\n\nThe door at the end of Corridor B does not lead anywhere. Please stop trying it.\n\n— Maintenance Division" },
  { id:"M-003", act:1, afterForm:"F-0008", from:"Employee 4471", subject:"no subject",
    body:"I found something in the filing room on Sub-Level 2. Behind the cabinets from 1987. Forms back there that don’t have dates. Not missing dates — the field exists but the concept of “date” doesn’t seem to apply.\n\nI reported this to my supervisor. My supervisor said I don’t have a supervisor. I checked the employee directory. I’m not in it.\n\nIf you’re reading this, file a lost employee report on my behalf. My name is\n\n[the memo ends here]" },
  { id:"M-W01", act:1, trigger:"infraction3", from:"Supervisor (Desk 0)", subject:"PERFORMANCE WARNING",
    body:"This memo serves as formal notice that your infraction count has reached three (3).\n\nThe Bureau values accuracy above all else. Each incorrect decision erodes the foundation of civic order.\n\nContinued infractions may result in reassignment. Reassignment is not a punishment. It is an opportunity. Previous clerks who were reassigned have reported finding the experience to be [RECORD EXPUNGED].\n\nImprove immediately.\n\n— Supervisor (Desk 0)" },
  { id:"M-101", act:2, afterForm:"F-1001", from:"Dept. of Circular Reasoning", subject:"Regarding Your Recent Redirection",
    body:"We have received the form you redirected. As it originated from our department, redirecting it back creates a procedural loop. The form is now circulating between desks 14 through 14.\n\nThis is not an error. This is functioning as designed.\n\nYour redirection has been logged as both correct and incorrect, per Departmental Guideline 7.\n\n— Dept. of Circular Reasoning" },
  { id:"M-102", act:2, afterForm:"F-1003", from:"Bureau Ombudsman", subject:"Citizen Complaint — Edmund Hale",
    body:"Edmund Hale has filed a complaint regarding his denied retroactive noise permit. He states: the noise already happened. Denying the permit doesn’t make it not have happened. It just makes it illegal to have happened.\n\nThe Ombudsman acknowledges the philosophical validity but notes philosophy is not within our jurisdiction.\n\nRefer Mr. Hale to the Dept. of Ontological Affairs, Floor 12. Note: Floor 12 may or may not exist depending on which elevator you use.\n\n— Bureau Ombudsman" },
  { id:"M-103", act:2, afterForm:"F-1006", from:"Anonymous", subject:"STOP READING THE MEMOS",
    body:"You’re reading the memos. They told you to, didn’t they?\n\nDon’t you wonder what’s in the memos they DON’T send you?\n\nI’ve been here for eleven years. Or eleven days. The clocks on Floor 4 run backwards. The ones on Floor 6 don’t move. The only correct clock is on Floor 7.\n\nThey told you not to go to Floor 7, right?\n\nStop reading. Start asking.\n\n— [unsigned]" },
  { id:"M-201", act:3, afterForm:"F-2001", from:"The Labyrinth", subject:"You Are Here",
    body:"FLOOR PLAN — THE LABYRINTH\n\nYou are in The Labyrinth. The Labyrinth is inside the Bureau. The Bureau is inside The Labyrinth.\n\nDirections:\n• Turn left to return to where you are.\n• Turn right to arrive at where you were.\n• Go straight to reach the place you’re leaving.\n• Go back to proceed forward.\n\nThe Archive is below.\n\n— The Labyrinth" },
  { id:"M-202", act:3, afterForm:"F-2002", from:"Bureau Personnel", subject:"RE: Your Release Request",
    body:"Your release request has been processed and approved.\n\nApproval does not constitute release. Release requires:\n1. Exit interview (PENDING)\n2. Return of materials (no attachment found)\n3. Processing of all outstanding forms (queue: INDETERMINATE)\n4. Confirmation of employment (your record does not exist)\n\nYour service is not complete.\n\n— Bureau Personnel (if this department exists)" },
  { id:"M-301", act:4, afterForm:"F-3001", from:"The Archive", subject:"FINAL MEMO",
    body:"You have reached the Archive.\n\nEvery form ever filed is here. Every form that will be filed is here. The form you are about to process is here.\n\nYou are here.\n\nThere is one more form.\n\nProcess it.\n\n— The Archive" },
];

var ANNOUNCEMENTS = [
  "The elevator to Floor 12 is temporarily operational. Use at your own discretion.",
  "Employee of the Month has been discontinued. Employee of the Epoch remains.",
  "The Bureau reminds you: curiosity is a form of inefficiency.",
  "If you see yourself in Corridor D, do not make eye contact.",
  "The Bureau thanks Employee 3391 for their service. Employee 3391 has been reassigned.",
  "Reminder: all exits are also entrances.",
  "The suggestion box on Floor 5 has been sealed. Your suggestions have been noted.",
  "Today’s date has been approved by the Dept. of Temporal Affairs.",
  "The lights in Corridor B are not flickering. You are flickering.",
  "Casual Friday has been revoked retroactively for the past seven years.",
  "Lost: one (1) sense of time. If found, do not return it.",
];

var TRANSITIONS = {
  2: ["Your performance has been noted.","","CLEARANCE ELEVATED: LEVEL 2","","New departments are now accessible.","Their rules may contradict.","This is by design.","","Report to the Department Directory."],
  3: ["Something is wrong with the floor plan.","","CLEARANCE ELEVATED: LEVEL 3","","The Labyrinth is not on any map.","The Labyrinth has always been here.","","You have always been here.","","The forms must still be processed."],
  4: ["You found it.","","THE ARCHIVE","","Below everything.","Before everything.","","Every form ever filed.","Including yours."],
};

var INTRO_LINES = [
  {t:"BUREAU INTEGRATED PROCESSING SYSTEM (BIPS) v4.12.7",d:0},
  {t:"COPYRIGHT © THE BUREAU — ALL RIGHTS RESERVED",d:400},
  {t:"DATE OF ESTABLISHMENT: [BEFORE RECORDS]",d:800},
  {t:"",d:1100},{t:"INITIALIZING TERMINAL...",d:1400},
  {t:"LOADING RULEBOOK......... DONE",d:2000},
  {t:"LOADING FORM QUEUE....... DONE",d:2500},
  {t:"VERIFYING EXISTENCE...... DONE",d:3000},
  {t:"",d:3400},{t:"EMPLOYEE ID: %%EID%%",d:3600},
  {t:"DESIGNATION: CLERK",d:4000},{t:"CLEARANCE: LEVEL 0",d:4300},
  {t:"DEPARTMENT: GENERAL PROCESSING",d:4600},
  {t:"",d:5000},{t:"THE BUREAU HAS ALWAYS EXISTED.",d:5300},
  {t:"THE BUREAU WILL ALWAYS EXIST.",d:5900},
  {t:"YOU ARE CLERK. PROCESS THE FORMS.",d:6500},
  {t:"",d:7100},{t:"█ CLICK TO REPORT TO YOUR DESK",d:7500},
];

var CSS_TEXT = "@keyframes bStamp{0%{transform:scale(2.8)rotate(-12deg);opacity:0}50%{transform:scale(1.06)rotate(2deg);opacity:1}75%{transform:scale(.96)rotate(-1deg)}100%{transform:scale(1)rotate(0);opacity:1}}@keyframes bSlide{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes bFade{from{opacity:0}to{opacity:1}}@keyframes bFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes bGlitch{0%,100%{transform:translate(0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,2px)}}@keyframes bScan{from{top:-2px}to{top:100vh}}@keyframes bBlink{0%,100%{opacity:1}50%{opacity:0}}@keyframes bPulse{0%{box-shadow:0 0 0 0 rgba(46,80,144,0.4)}70%{box-shadow:0 0 0 12px rgba(46,80,144,0)}100%{box-shadow:0 0 0 0 rgba(46,80,144,0)}}@keyframes bShake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-3px)}20%,40%,60%,80%{transform:translateX(3px)}}@keyframes bToastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes bToastOut{to{transform:translateX(120%);opacity:0}}";

function injectCSS() {
  if (document.getElementById("bureau-css-v2")) return;
  var s = document.createElement("style"); s.id = "bureau-css-v2"; s.textContent = CSS_TEXT;
  document.head.appendChild(s);
}

// ── STORAGE (localStorage) ─────────────────────────────────────
function saveGame(d) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch(e) {}
}
function loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    return Promise.resolve(raw ? JSON.parse(raw) : null);
  } catch(e) { return Promise.resolve(null); }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
}

function genEID() { return "BRU-" + String(Math.floor(1000 + Math.random() * 9000)); }
function genBID() { return "BUR-" + String(Math.floor(1000 + Math.random() * 9000)); }
function getDeptName(id) { for (var i = 0; i < DEPARTMENTS.length; i++) { if (DEPARTMENTS[i].id === id) return DEPARTMENTS[i].name; } return "General Processing"; }
function getRulesForAct(act) { var r = []; for (var i = 0; i < ALL_RULES.length; i++) { if (ALL_RULES[i].act <= act) r.push(ALL_RULES[i]); } return r; }

function personalizeForm(form, name, eid) {
  var bid = genBID();
  var nf = [];
  for (var i = 0; i < form.fields.length; i++) {
    var v = form.fields[i].value;
    if (v === "PLAYER_NAME") v = name;
    else if (v === "PLAYER_BUREAU_ID") v = bid;
    else if (v === "PLAYER_EMPLOYEE_ID") v = eid;
    nf.push({ label: form.fields[i].label, value: v });
  }
  var nc = form.citizen === "PLAYER_NAME" ? name : form.citizen;
  return Object.assign({}, form, { fields: nf, citizen: nc });
}

function personalizeStats(form, stats) {
  var nf = [];
  for (var i = 0; i < form.fields.length; i++) {
    var v = form.fields[i].value;
    if (v === "PLAYER_FORMS_COUNT") v = String(stats.total);
    else if (v === "PLAYER_APPROVAL_RATE") v = stats.total > 0 ? (Math.round((stats.app / stats.total) * 100) + "%") : "N/A";
    else if (v === "PLAYER_INFRACTIONS") v = String(stats.inf);
    else if (v === "PLAYER_CLASSIFICATION") v = stats.inf === 0 ? "EXEMPLARY" : stats.inf < 3 ? "SATISFACTORY" : stats.inf < 5 ? "UNDER REVIEW" : "FLAGGED";
    nf.push({ label: form.fields[i].label, value: v });
  }
  return Object.assign({}, form, { fields: nf });
}


// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
function InfiniteBureau(props) {
  var onBack = props ? props.onBack : undefined;
  var mountedRef = useRef(true);

  // ── MOUNTED GUARD (prevents SSR/hydration mismatch) ────────
  var mountedState = useState(false);
  var mounted = mountedState[0];
  var setMounted = mountedState[1];
  useEffect(function() { setMounted(true); }, []);

  // ── GAME STATE (persisted) ─────────────────────────────────
  var gRef = useRef(null);
  if (gRef.current === null) {
    gRef.current = {
      playerName: "", employeeId: genEID(), clearance: 0, infractions: 0,
      streak: 0, bestStreak: 0, currentDept: "general",
      completedForms: [], readMemos: [],
      totalForms: 0, approvals: 0, denials: 0, redirects: 0,
      hintsUsed: 0, highestAct: 1, commendations: [],
    };
  }

  var rc = useState(0);
  var bump = function() { rc[1](function(c) { return c + 1; }); };
  function setG(u) { gRef.current = Object.assign({}, gRef.current, u); bump(); }

  // ── UI STATE ───────────────────────────────────────────────
  var uRef = useRef({
    screen: "intro", introLines: [], introReady: false,
    form: null, stamp: null, stamping: false,
    resultOk: false, resultExpl: "", resultGain: 0, resultStreak: 0,
    memo: null, rulebookOpen: false, showHint: false,
    toasts: [], transitionLines: [], transitionReady: false,
    endingText: "", endingLoading: false, generating: false,
  });
  function setU(u) { uRef.current = Object.assign({}, uRef.current, u); bump(); }

  var g = gRef.current;
  var u = uRef.current;
  var act = getAct(g.clearance);
  var t = THEMES[act];
  var rank = getRank(g.clearance);
  var rules = getRulesForAct(act);
  var nextThr = getNextThreshold(act);
  var pct = act >= 4 ? 100 : Math.min(100, Math.round(((g.clearance - ACT_THRESHOLDS[act]) / (nextThr - ACT_THRESHOLDS[act])) * 100));

  var remaining = [];
  for (var _i = 0; _i < ALL_FORMS.length; _i++) {
    if (ALL_FORMS[_i].act === act && g.completedForms.indexOf(ALL_FORMS[_i].id) === -1) {
      remaining.push(ALL_FORMS[_i]);
    }
  }

  var unread = [];
  for (var _j = 0; _j < ALL_MEMOS.length; _j++) {
    var mm = ALL_MEMOS[_j];
    if (mm.act <= act && g.readMemos.indexOf(mm.id) === -1) {
      if (mm.afterForm && g.completedForms.indexOf(mm.afterForm) !== -1) unread.push(mm);
      else if (mm.trigger === "infraction3" && g.infractions >= 3) unread.push(mm);
    }
  }

  var deptName = getDeptName(g.currentDept);

  // ── INIT ───────────────────────────────────────────────────
  useEffect(function() {
    loadFonts(); injectCSS(); mountedRef.current = true;
    loadGame().then(function(saved) {
      if (saved && mountedRef.current) {
        gRef.current = Object.assign({}, gRef.current, saved);
        setU({ screen: "desk" });
      }
    });
    return function() { mountedRef.current = false; };
  }, []);

  // ── INTRO ──────────────────────────────────────────────────
  useEffect(function() {
    if (u.screen !== "intro") return;
    var timers = []; var lines = [];
    for (var i = 0; i < INTRO_LINES.length; i++) {
      (function(idx) {
        timers.push(setTimeout(function() {
          if (!mountedRef.current) return;
          var txt = INTRO_LINES[idx].t.replace("%%EID%%", gRef.current.employeeId);
          lines = lines.concat([txt]);
          setU({ introLines: lines.slice(), introReady: idx === INTRO_LINES.length - 1 });
        }, INTRO_LINES[idx].d));
      })(i);
    }
    return function() { for (var j = 0; j < timers.length; j++) clearTimeout(timers[j]); };
  }, [u.screen]);

  // ── SAVE ───────────────────────────────────────────────────
  useEffect(function() {
    if (u.screen === "intro" || u.screen === "name") return;
    saveGame(gRef.current);
  }, [rc[0]]);

  // ── TOASTS ─────────────────────────────────────────────────
  function addToast(text, type) {
    var id = Date.now() + Math.random();
    var cur = uRef.current.toasts.concat([{ id: id, text: text, type: type || "info" }]);
    setU({ toasts: cur });
    setTimeout(function() {
      if (!mountedRef.current) return;
      var f = [];
      for (var i = 0; i < uRef.current.toasts.length; i++) {
        if (uRef.current.toasts[i].id !== id) f.push(uRef.current.toasts[i]);
      }
      setU({ toasts: f });
    }, 4500);
  }

  function maybeAnnounce() {
    if (Math.random() < 0.28 && act < 4) {
      addToast(ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)], "announce");
    }
  }

  // ── HANDLERS ───────────────────────────────────────────────
  function handleIntroClick() { if (u.introReady) setU({ screen: "name" }); }

  function handleNameSubmit(name) {
    setG({ playerName: name || "Clerk " + gRef.current.employeeId });
    setU({ screen: "desk" });
    setTimeout(function() { addToast("Welcome to the Bureau. Begin processing.", "info"); }, 500);
  }

  function handleNextForm() {
    if (remaining.length === 0) return;
    var form = personalizeForm(remaining[0], gRef.current.playerName, gRef.current.employeeId);
    if (form.act === 4) form = personalizeStats(form, { total: gRef.current.totalForms, app: gRef.current.approvals, inf: gRef.current.infractions });
    setU({ form: form, stamp: null, stamping: false, showHint: false, screen: "form" });
  }

  function handleAction(action) {
    if (u.stamping || !u.form) return;
    var stampText = action === "approve" ? "APPROVED" : action === "deny" ? "DENIED" : "REDIRECTED";
    setU({ stamp: stampText, stamping: true });

    var form = uRef.current.form;
    var isCorrect = action === form.correct;
    if (form.flexible && (action === "approve" || action === "deny")) isCorrect = true;

    setTimeout(function() {
      if (!mountedRef.current) return;
      var gg = gRef.current;
      var clrGain = 0; var newStreak = gg.streak; var newInf = gg.infractions; var newClr = gg.clearance; var streakBonus = 0;

      if (isCorrect) {
        clrGain = form.act === 1 ? 1 : form.act === 2 ? 2 : form.act === 3 ? 3 : 4;
        newStreak = gg.streak + 1;
        if (newStreak === 3) { streakBonus = 1; addToast("★ BUREAU COMMENDATION — 3 correct in a row! +1 bonus clearance.", "commend"); }
        else if (newStreak === 5) { streakBonus = 2; addToast("★★ EXEMPLARY SERVICE — 5 correct! +2 bonus clearance.", "commend"); }
        else if (newStreak === 8) { streakBonus = 3; addToast("★★★ DISTINGUISHED PROCESSING — 8 correct! +3 bonus.", "commend"); }
        newClr = gg.clearance + clrGain + streakBonus;
      } else {
        newStreak = 0;
        newInf = gg.infractions + 1;
        newClr = Math.max(0, gg.clearance - 1);
        addToast("INFRACTION RECORDED. Clearance -1.", "error");
      }

      var updates = {
        completedForms: gg.completedForms.concat([form.id]),
        totalForms: gg.totalForms + 1,
        clearance: newClr, infractions: newInf,
        streak: newStreak, bestStreak: Math.max(gg.bestStreak, newStreak),
      };
      if (action === "approve") updates.approvals = gg.approvals + 1;
      else if (action === "deny") updates.denials = gg.denials + 1;
      else updates.redirects = gg.redirects + 1;

      setG(updates);
      setU({ screen: "result", resultOk: isCorrect, resultExpl: form.explanation, resultGain: clrGain + streakBonus, resultStreak: newStreak });
    }, 1300);
  }

  function handleResultContinue() {
    var form = uRef.current.form;
    var gg = gRef.current;
    var newAct = getAct(gg.clearance);
    var oldAct = form ? form.act : act;

    if (gg.infractions >= 3 && gg.readMemos.indexOf("M-W01") === -1) {
      for (var i = 0; i < ALL_MEMOS.length; i++) {
        if (ALL_MEMOS[i].trigger === "infraction3") {
          setU({ screen: "memo", memo: ALL_MEMOS[i], form: null, stamp: null });
          return;
        }
      }
    }

    if (gg.infractions >= 5 && !uRef.current.resultOk) {
      var resetCompleted = [];
      for (var rc2 = 0; rc2 < gg.completedForms.length; rc2++) {
        var cid = gg.completedForms[rc2];
        var isThisAct = false;
        for (var rf = 0; rf < ALL_FORMS.length; rf++) {
          if (ALL_FORMS[rf].id === cid && ALL_FORMS[rf].act === oldAct) isThisAct = true;
        }
        if (!isThisAct) resetCompleted.push(cid);
      }
      setG({ completedForms: resetCompleted, infractions: 3, clearance: Math.max(0, gg.clearance - 2), streak: 0 });
      setU({ screen: "review", form: null, stamp: null });
      return;
    }

    if (form) {
      for (var m = 0; m < ALL_MEMOS.length; m++) {
        if (ALL_MEMOS[m].afterForm === form.id && gg.readMemos.indexOf(ALL_MEMOS[m].id) === -1) {
          setU({ screen: "memo", memo: ALL_MEMOS[m], form: null, stamp: null });
          return;
        }
      }
    }

    if (newAct > oldAct && newAct <= 4 && gg.highestAct < newAct) {
      setG({ highestAct: newAct });
      startTransition(newAct);
      return;
    }

    if (form && form.isFinal) {
      setU({ screen: "ending", endingLoading: true, form: null, stamp: null });
      generateEnding();
      return;
    }

    goDesk();
  }

  function goDesk() {
    setU({ screen: "desk", form: null, stamp: null, stamping: false, showHint: false, rulebookOpen: false });
    maybeAnnounce();
  }

  function handleDismissMemo() {
    var memo = uRef.current.memo;
    if (memo) { setG({ readMemos: gRef.current.readMemos.concat([memo.id]) }); }
    var newAct = getAct(gRef.current.clearance);
    if (newAct > gRef.current.highestAct) {
      setG({ highestAct: newAct });
      startTransition(newAct);
      return;
    }
    goDesk();
  }

  function handleReviewAck() {
    addToast("REASSIGNMENT COMPLETE. Form queue reset. Prove yourself.", "error");
    goDesk();
  }

  function handleHint() {
    if (gRef.current.clearance <= 0) { addToast("Insufficient clearance for hint.", "error"); return; }
    setG({ clearance: gRef.current.clearance - 1, hintsUsed: gRef.current.hintsUsed + 1 });
    setU({ showHint: true });
  }

  function handleRestart() {
    clearSave();
    gRef.current = { playerName:"", employeeId:genEID(), clearance:0, infractions:0, streak:0, bestStreak:0, currentDept:"general", completedForms:[], readMemos:[], totalForms:0, approvals:0, denials:0, redirects:0, hintsUsed:0, highestAct:1, commendations:[] };
    setU({ screen:"intro", introLines:[], introReady:false, form:null, stamp:null, stamping:false, memo:null, rulebookOpen:false, showHint:false, toasts:[], transitionLines:[], transitionReady:false, endingText:"", endingLoading:false, generating:false });
  }

  // ── ACT TRANSITION ─────────────────────────────────────────
  function startTransition(toAct) {
    var lines = TRANSITIONS[toAct] || [];
    setU({ screen: "transition", transitionLines: [], transitionReady: false });
    var built = [];
    for (var i = 0; i < lines.length; i++) {
      (function(idx) {
        setTimeout(function() {
          if (!mountedRef.current) return;
          built = built.concat([lines[idx]]);
          setU({ transitionLines: built.slice(), transitionReady: idx === lines.length - 1 });
        }, 600 + idx * 450);
      })(i);
    }
  }

  function handleTransitionDone() {
    goDesk();
    addToast("New department access granted. New rules added to your rulebook.", "commend");
  }

  // ── ENDING (template-based, no API) ────────────────────────
  function generateEnding() {
    var gg = gRef.current;
    var classification = gg.infractions === 0 ? "EXEMPLARY" : gg.infractions < 3 ? "SATISFACTORY" : gg.infractions < 5 ? "UNDER REVIEW" : "FLAGGED";
    var approvalRate = gg.totalForms > 0 ? Math.round((gg.approvals / gg.totalForms) * 100) + "%" : "N/A";
    var conduct = gg.infractions === 0
      ? "perfect adherence to Bureau regulations. No infractions were recorded."
      : "noted procedural irregularities. " + gg.infractions + " infraction" + (gg.infractions === 1 ? "" : "s") + " on record.";
    var text =
      "FINAL RECORD — CLERK " + gg.employeeId + "\n" +
      "CLASSIFICATION: " + classification + "\n\n" +
      "Forms processed: " + gg.totalForms + "\n" +
      "Approved: " + gg.approvals + " | Denied: " + gg.denials + " | Redirected: " + gg.redirects + "\n" +
      "Approval rate: " + approvalRate + " | Best streak: " + gg.bestStreak + "\n" +
      "Infractions: " + gg.infractions + "\n\n" +
      "The clerk " + (gg.playerName ? gg.playerName : "Clerk " + gg.employeeId) + " completed their service with " + conduct + "\n\n" +
      "The Bureau has recorded everything. The Bureau forgets nothing.\n" +
      "Every form you stamped is archived here. Every infraction. Every hesitation.\n\n" +
      "You may leave. The exit is through the entrance.\n" +
      "You have always been here.\n" +
      "You will always have been here.\n\n" +
      "END OF RECORD";
    setU({ endingText: text, endingLoading: false });
  }

  // ── GENERATE FORMS (no API — static queue only) ─────────────
  function generateForms() {
    setU({ generating: false });
    addToast("No new forms are available. The Bureau provides what it provides.", "info");
  }


  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════

  if (!mounted) {
    return React.createElement("div", { style: { position:"fixed", inset:0, backgroundColor:"#080808", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'IBM Plex Mono',monospace", color:"#33FF66", fontSize:"14px" } }, "INITIALIZING BUREAU TERMINAL...");
  }

  if (!t) return React.createElement("div", null, "Initializing...");

  // Intro
  if (u.screen === "intro") {
    return React.createElement("div", { onClick: handleIntroClick, style: { position:"fixed", inset:0, backgroundColor:"#080808", display:"flex", flexDirection:"column", justifyContent:"center", padding:"48px", fontFamily:"'IBM Plex Mono',monospace", cursor:u.introReady?"pointer":"default", overflow:"hidden" } },
      u.introLines.map(function(line, i) {
        var s = { color:"#33FF66", fontSize:"14px", lineHeight:"1.9", letterSpacing:"0.5px", animation:"bFadeUp 0.3s ease forwards", minHeight:line===""?"12px":"auto" };
        if (line.indexOf("█") === 0) Object.assign(s, { animation:"bBlink 1s infinite", fontWeight:"600", marginTop:"12px", fontSize:"15px" });
        return React.createElement("div", { key:"il"+i, style:s }, line);
      }),
      React.createElement("div", { style: { position:"absolute", top:0, left:0, right:0, height:"2px", backgroundColor:"rgba(51,255,102,0.08)", animation:"bScan 3s linear infinite" } }),
      React.createElement("div", { style: { position:"absolute", inset:0, background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.7) 100%)", pointerEvents:"none" } })
    );
  }

  // Name
  if (u.screen === "name") {
    return React.createElement(NameScreen, { onSubmit: handleNameSubmit });
  }

  // Transition
  if (u.screen === "transition") {
    return React.createElement("div", { onClick: u.transitionReady?handleTransitionDone:undefined, style: { position:"fixed", inset:0, backgroundColor:"#080808", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", fontFamily:"'IBM Plex Mono',monospace", cursor:u.transitionReady?"pointer":"default" } },
      React.createElement("div", { style: { maxWidth:"460px" } },
        u.transitionLines.map(function(line, i) {
          var isHL = line.indexOf("CLEARANCE") !== -1 || line === "THE ARCHIVE";
          return React.createElement("div", { key:"tl"+i, style: { color:isHL?"#FFFFFF":"#33FF66", fontSize:isHL?"16px":"14px", lineHeight:"2.2", letterSpacing:isHL?"3px":"0.5px", fontWeight:isHL?"700":"400", animation:"bFadeUp 0.4s ease forwards", minHeight:line===""?"16px":"auto", textAlign:"center" } }, line);
        }),
        u.transitionReady ? React.createElement("div", { style: { textAlign:"center", marginTop:"32px", color:"#1A9944", fontSize:"13px", animation:"bBlink 1.5s infinite" } }, "█ CLICK TO CONTINUE") : null
      ),
      React.createElement("div", { style: { position:"absolute", inset:0, background:"radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.8) 100%)", pointerEvents:"none" } })
    );
  }

  // Performance Review
  if (u.screen === "review") {
    return React.createElement("div", { style: { position:"fixed", inset:0, backgroundColor:"#1A0000", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", fontFamily:"'IBM Plex Mono',monospace" } },
      React.createElement("div", { style: { maxWidth:"460px", textAlign:"center" } },
        React.createElement("div", { style: { color:"#FF4444", fontSize:"12px", letterSpacing:"4px", marginBottom:"24px", animation:"bFadeUp 0.4s ease" } }, "PERFORMANCE REVIEW"),
        React.createElement("div", { style: { color:"#FF8888", fontSize:"40px", marginBottom:"16px" } }, "⚠"),
        React.createElement("div", { style: { color:"#FFCCCC", fontSize:"16px", fontWeight:"600", marginBottom:"12px" } }, "REASSIGNMENT NOTICE"),
        React.createElement("div", { style: { color:"#CC8888", fontSize:"13px", lineHeight:"1.8", marginBottom:"28px", textAlign:"left" } },
          "Your infraction count has triggered automatic reassignment.\n\nYour current form queue has been reset. You will re-process the forms for this clearance level. Infraction count reduced to 3. Clearance adjusted.\n\nThe Bureau expects improvement."),
        React.createElement("button", { onClick: handleReviewAck, style: { padding:"12px 36px", backgroundColor:"transparent", border:"1px solid #FF4444", color:"#FF4444", fontFamily:"'IBM Plex Mono',monospace", fontSize:"13px", cursor:"pointer", letterSpacing:"1px" } }, "ACKNOWLEDGED")
      )
    );
  }

  // Ending
  if (u.screen === "ending") {
    return React.createElement("div", { style: { position:"fixed", inset:0, backgroundColor:"#080808", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", fontFamily:"'IBM Plex Mono',monospace", padding:"40px" } },
      React.createElement("div", { style: { maxWidth:"540px", width:"100%" } },
        React.createElement("div", { style: { color:"#1A9944", fontSize:"11px", letterSpacing:"3px", marginBottom:"28px", textAlign:"center" } }, "THE ARCHIVE — FINAL RECORD"),
        u.endingLoading
          ? React.createElement("div", { style: { color:"#1A9944", fontSize:"14px", animation:"bBlink 1.5s infinite", textAlign:"center" } }, "> COMPILING FINAL RECORD...")
          : React.createElement(React.Fragment, null,
              React.createElement("div", { style: { color:"#33FF66", fontSize:"14px", lineHeight:"2", whiteSpace:"pre-wrap", padding:"24px", borderLeft:"2px solid #33FF66", marginBottom:"36px" } }, u.endingText),
              React.createElement("div", { style: { display:"flex", gap:"12px", justifyContent:"center" } },
                React.createElement("button", { onClick:handleRestart, style:{ padding:"12px 28px", backgroundColor:"transparent", border:"1px solid #33FF66", color:"#33FF66", fontFamily:"'IBM Plex Mono',monospace", fontSize:"12px", cursor:"pointer", letterSpacing:"1px" } }, "BEGIN AGAIN"),
                onBack ? React.createElement("button", { onClick:onBack, style:{ padding:"12px 28px", backgroundColor:"transparent", border:"1px solid #1A9944", color:"#1A9944", fontFamily:"'IBM Plex Mono',monospace", fontSize:"12px", cursor:"pointer", letterSpacing:"1px" } }, "EXIT BUREAU") : null
              )
            )
      ),
      React.createElement("div", { style: { position:"absolute", top:0, left:0, right:0, height:"2px", backgroundColor:"rgba(51,255,102,0.06)", animation:"bScan 4s linear infinite" } })
    );
  }


  // ═════════════════════════════════════════════════════════
  // MAIN GAME LAYOUT
  // ═════════════════════════════════════════════════════════

  var actNames = { 1:"THE DESK", 2:"THE DEPARTMENTS", 3:"THE LABYRINTH", 4:"THE ARCHIVE" };
  var canAdvance = g.clearance >= nextThr && act < 4 && remaining.length === 0;

  var statusEl = React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", backgroundColor:act===4?"#0A0A0A":t.accentDark, color:act===4?t.text:"#FFF", fontFamily:t.monoFont, fontSize:"11px", letterSpacing:"0.5px", borderBottom:"2px solid "+t.border, flexShrink:0, zIndex:10 } },
    React.createElement("div", { style: { display:"flex", alignItems:"center", gap:"14px" } },
      onBack ? React.createElement("button", { onClick:onBack, style: { background:"none", border:"1px solid "+(act===4?t.text:"rgba(255,255,255,0.3)"), color:act===4?t.text:"#FFF", padding:"3px 10px", fontFamily:t.monoFont, fontSize:"10px", cursor:"pointer", borderRadius:"2px" } }, "← Back") : null,
      React.createElement("span", null, "CLERK " + g.employeeId),
      React.createElement("span", { style: { color:act===4?t.textMuted:"rgba(255,255,255,0.55)", fontWeight:"500" } }, rank.title.toUpperCase())
    ),
    React.createElement("div", { style: { display:"flex", alignItems:"center", gap:"14px" } },
      g.streak >= 2 ? React.createElement("span", { style: { color:"#FFD700", fontWeight:"600" } }, "⚡" + g.streak) : null,
      React.createElement("span", { style: { color:act===4?t.accent:"#88CCFF" } }, "CLR " + g.clearance),
      React.createElement("span", { style: { color:g.infractions >= 4?"#FF6666":(act===4?t.textMuted:"rgba(255,255,255,0.5)") } }, "INF " + g.infractions),
      React.createElement("span", { style: { color:act===4?t.textLight:"rgba(255,255,255,0.35)" } }, "FORMS " + g.totalForms)
    )
  );

  var progressEl = act < 4 ? React.createElement("div", { style: { padding:"7px 20px", backgroundColor:t.surfaceAlt, borderBottom:"1px solid "+t.borderLight, display:"flex", alignItems:"center", gap:"12px", fontFamily:t.monoFont, fontSize:"10px", color:t.textMuted, flexShrink:0 } },
    React.createElement("span", { style: { letterSpacing:"1.5px", fontWeight:"600", color:t.text } }, "ACT " + act + " — " + actNames[act]),
    React.createElement("div", { style: { flex:1, height:"5px", backgroundColor:t.borderLight, borderRadius:"3px", overflow:"hidden" } },
      React.createElement("div", { style: { height:"100%", width:pct+"%", backgroundColor:t.accent, borderRadius:"3px", transition:"width 0.5s ease" } })
    ),
    React.createElement("span", null, g.clearance + "/" + nextThr)
  ) : null;

  var toastEl = u.toasts.length > 0 ? React.createElement("div", { style: { position:"fixed", top:"80px", right:"16px", zIndex:100, display:"flex", flexDirection:"column", gap:"6px", maxWidth:"340px" } },
    u.toasts.map(function(toast) {
      var bg = toast.type === "commend" ? t.approve : toast.type === "error" ? t.deny : toast.type === "announce" ? t.accentDark : t.accent;
      return React.createElement("div", { key:toast.id, style: { padding:"10px 14px", backgroundColor:bg, color:"#FFF", fontFamily:t.monoFont, fontSize:"11px", lineHeight:"1.5", borderRadius:act===4?"0":"4px", animation:"bToastIn 0.3s ease forwards", boxShadow:"0 4px 16px rgba(0,0,0,0.2)" } }, toast.text);
    })
  ) : null;

  var memoEl = null;
  if (u.screen === "memo" && u.memo) {
    memoEl = React.createElement("div", { style: { position:"fixed", inset:0, backgroundColor:act===4?"rgba(0,0,0,0.92)":"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:70, animation:"bFade 0.3s ease" } },
      React.createElement("div", { style: { backgroundColor:act===4?t.surface:"#FFFFF0", border:act===4?("1px solid "+t.border):"1px solid #C4B99A", borderRadius:act===4?"0":"3px", padding:"28px", maxWidth:"500px", width:"90%", maxHeight:"70vh", overflowY:"auto", fontFamily:t.bodyFont, boxShadow:act===4?"none":"0 4px 24px rgba(0,0,0,0.2)", animation:"bSlide 0.3s ease forwards" } },
        React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"10px", color:act===4?t.textMuted:"#8B1A1A", letterSpacing:"2px", marginBottom:"14px" } }, "INTERNAL MEMO"),
        React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"11px", color:act===4?t.textMuted:"#6B7280", marginBottom:"4px" } }, "FROM: " + u.memo.from),
        React.createElement("div", { style: { fontFamily:t.headerFont, fontSize:"16px", fontWeight:"700", color:act===4?t.text:"#1B2A4A", marginBottom:"16px", paddingBottom:"10px", borderBottom:"1px solid "+(act===4?t.border:"#DDD6C3") } }, u.memo.subject),
        React.createElement("div", { style: { fontSize:"13px", lineHeight:"1.8", color:act===4?t.text:"#333", whiteSpace:"pre-wrap" } }, u.memo.body),
        React.createElement("button", { onClick:handleDismissMemo, style: { marginTop:"20px", padding:"10px 24px", backgroundColor:t.accent, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"12px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"3px", width:"100%" } }, "ACKNOWLEDGED")
      )
    );
  }

  var content = null;
  var highlighted = (u.form && u.form.rules) ? u.form.rules : [];

  // Department Select
  if (u.screen === "deptSelect") {
    var avail = [];
    for (var di = 0; di < DEPARTMENTS.length; di++) { if (DEPARTMENTS[di].clearance <= g.clearance) avail.push(DEPARTMENTS[di]); }
    content = React.createElement("div", { style: { maxWidth:"600px", width:"100%", animation:"bFade 0.3s ease" } },
      React.createElement("div", { style: { fontFamily:t.headerFont, fontSize:act===4?"16px":"20px", fontWeight:"700", color:t.text, textAlign:"center", marginBottom:"6px" } }, "DEPARTMENT DIRECTORY"),
      React.createElement("div", { style: { fontFamily:t.bodyFont, fontSize:"13px", color:t.textMuted, textAlign:"center", marginBottom:"24px" } }, "Select a department to process forms."),
      React.createElement("div", { style: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" } },
        avail.map(function(dept) {
          var isA = dept.id === g.currentDept;
          return React.createElement("div", { key:dept.id, onClick:function(){setG({currentDept:dept.id});goDesk();}, style: { backgroundColor:isA?t.accentGlow:t.surface, border:"2px solid "+(isA?t.accent:t.borderLight), borderRadius:act===4?"0":"4px", padding:"14px", cursor:"pointer", transition:"all 0.15s" } },
            React.createElement("div", { style: { fontFamily:t.headerFont, fontSize:"13px", fontWeight:"700", color:t.text, marginBottom:"4px" } }, dept.name),
            React.createElement("div", { style: { fontFamily:t.bodyFont, fontSize:"11px", color:t.textMuted, lineHeight:"1.4" } }, dept.desc)
          );
        })
      ),
      React.createElement("button", { onClick:goDesk, style: { marginTop:"12px", padding:"8px 16px", backgroundColor:"transparent", color:t.textMuted, border:"1px solid "+t.borderLight, fontFamily:t.monoFont, fontSize:"10px", cursor:"pointer", width:"100%", borderRadius:act===4?"0":"3px" } }, "← BACK TO DESK")
    );
  }

  // Form
  else if (u.screen === "form" && u.form) {
    var fm = u.form;
    var formTilt = act >= 3 ? "rotate(-0.1deg)" : "none";
    var stampTilt = act >= 3 ? " rotate(-2deg)" : "";
    content = React.createElement("div", { style: { maxWidth:"680px", width:"100%", display:"flex", flexDirection:"column", gap:"12px", animation:"bSlide 0.35s ease forwards" } },
      fm.tutorial ? React.createElement("div", { style: { backgroundColor:t.accentGlow, border:"1px solid "+t.accent, borderRadius:"4px", padding:"12px 14px", fontFamily:t.bodyFont, fontSize:"12px", color:t.accent, lineHeight:"1.5" } },
        React.createElement("strong", null, "TRAINING FORM"), " — Read the fields below, then open the RULEBOOK to check each applicable rule. Decide: APPROVE, DENY, or REDIRECT.") : null,
      React.createElement("div", { style: { backgroundColor:t.surface, border:"2px solid "+t.border, borderRadius:act===4?"0":"4px", padding:act===4?"20px":"24px", position:"relative", boxShadow:act===4?"none":"0 2px 12px rgba(0,0,0,0.06)", transform:formTilt } },
        u.stamp ? React.createElement("div", { style: { position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)"+stampTilt, fontSize:act===4?"28px":"40px", fontFamily:t.monoFont, fontWeight:"700", color:u.stamp==="APPROVED"?t.approve:u.stamp==="DENIED"?t.deny:t.redirect, border:"4px solid "+(u.stamp==="APPROVED"?t.approve:u.stamp==="DENIED"?t.deny:t.redirect), padding:"8px 24px", animation:"bStamp 0.5s ease forwards", pointerEvents:"none", zIndex:10, backgroundColor:t.stampBg, letterSpacing:"3px" } }, u.stamp) : null,
        React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px", paddingBottom:"12px", borderBottom:"1px solid "+t.borderLight } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"10px", color:t.textLight, letterSpacing:"1.5px", marginBottom:"3px" } }, "FORM " + fm.id),
            React.createElement("div", { style: { fontFamily:t.headerFont, fontSize:act===4?"14px":"18px", fontWeight:"700", color:t.text } }, fm.type)
          ),
          React.createElement("div", { style: { textAlign:"right" } },
            React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"9px", color:t.textLight, letterSpacing:"0.5px" } }, "CITIZEN"),
            React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"12px", fontWeight:"500", color:t.text } }, fm.citizen)
          )
        ),
        fm.fields.map(function(f, i) {
          var isBlank = f.value === "—" || (f.value && f.value.indexOf("[REDACTED]") !== -1);
          return React.createElement("div", { key:"f"+i, style: { display:"flex", padding:"7px 8px", borderBottom:"1px solid "+t.borderLight, backgroundColor:i%2===0?"transparent":t.surfaceAlt, borderRadius:"2px", marginBottom:"1px" } },
            React.createElement("div", { style: { width:"170px", flexShrink:0, fontFamily:t.monoFont, fontSize:"10px", fontWeight:"500", color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", paddingTop:"2px" } }, f.label),
            React.createElement("div", { style: { flex:1, fontFamily:t.monoFont, fontSize:"13px", color:isBlank?t.deny:t.text, fontStyle:isBlank?"italic":"normal", lineHeight:"1.5" } }, f.value)
          );
        }),
        React.createElement("div", { style: { marginTop:"14px", padding:"8px 12px", backgroundColor:t.surfaceAlt, borderRadius:"3px", fontFamily:t.monoFont, fontSize:"10px", color:t.textMuted, display:"flex", justifyContent:"space-between", alignItems:"center" } },
          React.createElement("span", null, "APPLICABLE RULES: " + fm.rules.join(", ")),
          React.createElement("button", { onClick:function(){setU({rulebookOpen:true});}, style: { background:"none", border:"1px solid "+t.accent, color:t.accent, padding:"3px 8px", fontFamily:t.monoFont, fontSize:"9px", cursor:"pointer", borderRadius:"2px" } }, "OPEN RULEBOOK")
        )
      ),
      !u.stamp ? React.createElement("div", { style: { display:"flex", gap:"6px", alignItems:"center" } },
        !u.showHint ? React.createElement("button", { onClick:handleHint, style: { padding:"5px 12px", backgroundColor:"transparent", border:"1px dashed "+t.borderLight, color:t.textMuted, fontFamily:t.monoFont, fontSize:"10px", cursor:"pointer", borderRadius:"3px" } }, "HINT (-1 CLR)")
        : React.createElement("div", { style: { flex:1, padding:"8px 12px", backgroundColor:t.accentGlow, border:"1px solid "+t.accent, borderRadius:"3px", fontFamily:t.bodyFont, fontSize:"12px", color:t.accent, lineHeight:"1.5" } }, fm.hint || "No guidance available.")
      ) : null,
      !u.stamp ? React.createElement("div", { style: { display:"flex", gap:"8px" } },
        React.createElement("button", { onClick:function(){handleAction("approve");}, style:{ flex:1, padding:"12px", backgroundColor:t.approve, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"13px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"4px", letterSpacing:"1px" } }, "✓ APPROVE"),
        React.createElement("button", { onClick:function(){handleAction("deny");}, style:{ flex:1, padding:"12px", backgroundColor:t.deny, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"13px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"4px", letterSpacing:"1px" } }, "✗ DENY"),
        React.createElement("button", { onClick:function(){handleAction("redirect");}, style:{ flex:1, padding:"12px", backgroundColor:t.redirect, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"13px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"4px", letterSpacing:"1px" } }, "↻ REDIRECT")
      ) : null
    );
  }

  // Result
  else if (u.screen === "result") {
    var ok = u.resultOk;
    content = React.createElement("div", { style: { maxWidth:"500px", width:"100%", backgroundColor:t.surface, border:"2px solid "+(ok?t.approve:t.deny), borderRadius:act===4?"0":"5px", padding:"28px", animation:ok?"bSlide 0.3s ease forwards":"bShake 0.5s ease, bSlide 0.3s ease forwards", textAlign:"center" } },
      React.createElement("div", { style: { fontSize:"40px", marginBottom:"10px" } }, ok ? "✓" : "✗"),
      React.createElement("div", { style: { fontFamily:t.headerFont, fontSize:"19px", fontWeight:"700", color:ok?t.approve:t.deny, marginBottom:"4px" } }, ok ? "CORRECT PROCESSING" : "PROCESSING ERROR"),
      React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"13px", color:ok?t.approve:t.deny, marginBottom:"4px" } }, ok ? "CLEARANCE +" + u.resultGain : "INFRACTION RECORDED — CLR -1"),
      u.resultStreak >= 2 && ok ? React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"11px", color:"#DAA520", marginBottom:"14px" } }, "⚡ STREAK: " + u.resultStreak) : React.createElement("div", { style: { marginBottom:"14px" } }),
      React.createElement("div", { style: { fontFamily:t.bodyFont, fontSize:"13px", lineHeight:"1.7", color:t.text, textAlign:"left", padding:"12px 14px", backgroundColor:t.surfaceAlt, borderRadius:"3px", borderLeft:"3px solid "+(ok?t.approve:t.deny), marginBottom:"20px" } }, u.resultExpl),
      React.createElement("button", { onClick:handleResultContinue, style: { padding:"12px 36px", backgroundColor:t.accent, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"13px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"4px", letterSpacing:"0.5px", animation:"bPulse 1.5s ease infinite" } }, "CONTINUE")
    );
  }

  // Desk (hub)
  else {
    var subs = { 1:"Process the forms. Follow the rules. Earn your clearance.", 2:"New departments. New rules. Contradictions are intentional.", 3:"The floor plan no longer makes sense. Neither do the forms.", 4:"Everything filed. Everything true." };

    content = React.createElement("div", { style: { maxWidth:"540px", width:"100%", animation:"bFade 0.3s ease" } },
      React.createElement("div", { style: { textAlign:"center", marginBottom:"24px" } },
        React.createElement("div", { style: { fontFamily:t.headerFont, fontSize:act===4?"17px":"24px", fontWeight:"700", color:t.text, marginBottom:"3px" } }, actNames[act]),
        React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"10px", color:t.textLight, letterSpacing:"2px", marginBottom:"6px" } }, "ACT " + act),
        React.createElement("div", { style: { fontFamily:t.bodyFont, fontSize:"13px", color:t.textMuted, lineHeight:"1.5" } }, subs[act])
      ),
      React.createElement("div", { style: { backgroundColor:t.surface, border:"2px solid "+t.border, borderRadius:act===4?"0":"5px", padding:"22px", marginBottom:"10px" } },
        React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" } },
          React.createElement("div", { style: { fontFamily:t.monoFont, fontSize:"11px", color:t.textMuted } }, remaining.length > 0 ? "FORMS IN QUEUE: " + remaining.length : "QUEUE EMPTY"),
          React.createElement("div", { style: { display:"flex", gap:"3px" } },
            (function() { var d = []; for (var x = 0; x < Math.min(remaining.length, 10); x++) d.push(React.createElement("div", { key:"d"+x, style: { width:"7px", height:"9px", backgroundColor:t.accent, borderRadius:"1px", opacity:0.35+(x*0.06) } })); return d; })()
          )
        ),
        remaining.length > 0 ? React.createElement("button", { onClick:handleNextForm, style: { width:"100%", padding:"13px", backgroundColor:t.accent, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"14px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"4px", letterSpacing:"1px", marginBottom:"8px", animation:"bPulse 2s ease infinite" } }, "PROCESS NEXT FORM")
        : canAdvance ? React.createElement("button", { onClick:function(){setG({highestAct:act+1});startTransition(act+1);}, style: { width:"100%", padding:"13px", backgroundColor:t.approve, color:"#FFF", border:"none", fontFamily:t.monoFont, fontSize:"14px", fontWeight:"600", cursor:"pointer", borderRadius:act===4?"0":"4px", letterSpacing:"1px", marginBottom:"8px", animation:"bPulse 1.5s ease infinite" } }, "↑ ADVANCE TO ACT " + (act + 1))
        : React.createElement("button", { onClick:generateForms, disabled:u.generating, style: { width:"100%", padding:"13px", backgroundColor:"transparent", color:u.generating?t.textLight:t.accent, border:"2px solid "+(u.generating?t.textLight:t.accent), fontFamily:t.monoFont, fontSize:"13px", fontWeight:"600", cursor:u.generating?"default":"pointer", borderRadius:act===4?"0":"4px", marginBottom:"8px" } }, u.generating ? "GENERATING..." : "REQUEST NEW FORMS"),
        React.createElement("div", { style: { display:"flex", gap:"6px" } },
          act >= 2 ? React.createElement("button", { onClick:function(){setU({screen:"deptSelect"});}, style: { flex:1, padding:"7px", backgroundColor:"transparent", color:t.accent, border:"1px solid "+t.accent, fontFamily:t.monoFont, fontSize:"10px", cursor:"pointer", borderRadius:"3px" } }, "DEPARTMENTS") : null,
          unread.length > 0 ? React.createElement("button", { onClick:function(){setU({screen:"memo",memo:unread[0]});}, style: { flex:1, padding:"7px", backgroundColor:"transparent", color:t.deny, border:"1px solid "+t.deny, fontFamily:t.monoFont, fontSize:"10px", cursor:"pointer", borderRadius:"3px" } }, "MEMOS (" + unread.length + ")") : null,
          React.createElement("button", { onClick:function(){setU({rulebookOpen:!u.rulebookOpen});}, style: { flex:1, padding:"7px", backgroundColor:"transparent", color:t.textMuted, border:"1px solid "+t.borderLight, fontFamily:t.monoFont, fontSize:"10px", cursor:"pointer", borderRadius:"3px" } }, "RULEBOOK")
        )
      ),
      React.createElement("div", { style: { backgroundColor:t.surfaceAlt, border:"1px solid "+t.borderLight, borderRadius:act===4?"0":"4px", padding:"12px 16px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", fontFamily:t.monoFont, fontSize:"10px" } },
        React.createElement("div", null, React.createElement("div", { style: { color:t.textLight, fontSize:"9px", letterSpacing:"1px", marginBottom:"1px" } }, "APPROVED"), React.createElement("div", { style: { color:t.approve, fontWeight:"600", fontSize:"15px" } }, String(g.approvals))),
        React.createElement("div", null, React.createElement("div", { style: { color:t.textLight, fontSize:"9px", letterSpacing:"1px", marginBottom:"1px" } }, "DENIED"), React.createElement("div", { style: { color:t.deny, fontWeight:"600", fontSize:"15px" } }, String(g.denials))),
        React.createElement("div", null, React.createElement("div", { style: { color:t.textLight, fontSize:"9px", letterSpacing:"1px", marginBottom:"1px" } }, "BEST STREAK"), React.createElement("div", { style: { color:"#DAA520", fontWeight:"600", fontSize:"15px" } }, String(g.bestStreak)))
      )
    );
  }

  var rbBtn = React.createElement("button", { onClick:function(){setU({rulebookOpen:!u.rulebookOpen});}, style: { position:"fixed", top:act<4?"88px":"48px", right:u.rulebookOpen?"378px":"0", zIndex:55, backgroundColor:t.accent, color:"#FFF", border:"none", padding:"10px 12px", fontFamily:t.monoFont, fontSize:"11px", fontWeight:"600", cursor:"pointer", borderRadius:"4px 0 0 4px", transition:"right 0.25s ease", letterSpacing:"0.5px", boxShadow:"0 2px 8px rgba(0,0,0,0.12)" } }, u.rulebookOpen ? "CLOSE" : "RULES");

  var rbPanel = React.createElement("div", { style: { position:"fixed", top:0, right:u.rulebookOpen?"0":"-380px", width:"370px", height:"100vh", backgroundColor:t.surfaceAlt, borderLeft:"3px solid "+t.border, zIndex:50, transition:"right 0.25s ease", display:"flex", flexDirection:"column", boxShadow:u.rulebookOpen?"-4px 0 20px rgba(0,0,0,0.1)":"none" } },
    React.createElement("div", { style: { padding:"14px 18px", borderBottom:"2px solid "+t.border, fontFamily:t.headerFont, fontSize:"15px", fontWeight:"700", color:t.text, backgroundColor:t.surface } }, act===4?"> ARCHIVE RULES":"OFFICIAL RULEBOOK"),
    React.createElement("div", { style: { flex:1, overflowY:"auto", padding:"10px 14px" } },
      rules.map(function(rule) {
        var hl = highlighted.indexOf(rule.id) !== -1;
        return React.createElement("div", { key:rule.id, style: { padding:"8px 10px", marginBottom:"5px", borderRadius:"3px", border:"1px solid "+(hl?t.accent:t.borderLight), backgroundColor:hl?t.accentGlow:t.surface, fontSize:"12px", lineHeight:"1.5", color:t.text } },
          React.createElement("span", { style: { fontFamily:t.monoFont, fontSize:"10px", fontWeight:"600", color:hl?t.accent:t.textMuted, display:"block", marginBottom:"2px" } }, rule.id),
          React.createElement("div", null, rule.text),
          React.createElement("span", { style: { fontFamily:t.monoFont, fontSize:"9px", color:t.textLight, display:"block", marginTop:"3px" } }, "— " + rule.dept)
        );
      })
    )
  );

  return React.createElement("div", { style: { position:"fixed", inset:0, backgroundColor:t.bg, display:"flex", flexDirection:"column", fontFamily:t.bodyFont, overflow:"hidden" } },
    statusEl,
    progressEl,
    React.createElement("div", { style: { flex:1, display:"flex", justifyContent:"center", alignItems:"center", padding:"20px 36px", overflowY:"auto", position:"relative" } },
      act < 4 ? React.createElement("div", { style: { position:"absolute", top:"10px", left:"50%", transform:"translateX(-50%)", fontFamily:t.headerFont, fontSize:"10px", color:t.textLight, letterSpacing:"4px", textTransform:"uppercase", pointerEvents:"none", opacity:0.35 } }, "THE INFINITE BUREAU") : null,
      content
    ),
    rbBtn, rbPanel,
    act === 3 ? React.createElement("div", { style: { position:"absolute", inset:0, pointerEvents:"none", zIndex:40, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.01) 2px,rgba(0,0,0,0.01) 4px)" } }) : null,
    act === 4 ? React.createElement("div", { style: { position:"absolute", top:0, left:0, right:0, height:"2px", backgroundColor:"rgba(51,255,102,0.06)", animation:"bScan 4s linear infinite", pointerEvents:"none", zIndex:40 } }) : null,
    toastEl, memoEl
  );
}

function NameScreen(props) {
  var ref = useRef(null);
  var val = useState("");
  useEffect(function() { if (ref.current) ref.current.focus(); }, []);
  function submit() { props.onSubmit(val[0]); }
  return React.createElement("div", { style: { position:"fixed", inset:0, backgroundColor:"#080808", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", fontFamily:"'IBM Plex Mono',monospace" } },
    React.createElement("div", { style: { color:"#33FF66", fontSize:"14px", marginBottom:"24px" } }, "> ENTER CLERK NAME:"),
    React.createElement("div", { style: { display:"flex", alignItems:"center", gap:"8px" } },
      React.createElement("span", { style: { color:"#33FF66", fontSize:"16px" } }, ">"),
      React.createElement("input", { ref:ref, type:"text", value:val[0], onChange:function(e){val[1](e.target.value);}, onKeyDown:function(e){if(e.key==="Enter")submit();}, style: { backgroundColor:"transparent", border:"none", borderBottom:"1px solid #33FF66", color:"#33FF66", fontFamily:"'IBM Plex Mono',monospace", fontSize:"16px", padding:"8px 4px", outline:"none", width:"280px", letterSpacing:"1px" }, placeholder:"...", maxLength:40 }),
      React.createElement("button", { onClick:submit, style: { backgroundColor:"transparent", border:"1px solid #33FF66", color:"#33FF66", fontFamily:"'IBM Plex Mono',monospace", fontSize:"12px", padding:"8px 20px", cursor:"pointer" } }, "SUBMIT")
    ),
    React.createElement("div", { style: { color:"#1A9944", fontSize:"11px", marginTop:"20px", maxWidth:"380px", textAlign:"center", lineHeight:"1.6" } }, "Your name will be entered into the Bureau’s permanent record. Press ENTER to proceed."),
    React.createElement("div", { style: { position:"absolute", inset:0, background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.7) 100%)", pointerEvents:"none" } })
  );
}

export default InfiniteBureau;
