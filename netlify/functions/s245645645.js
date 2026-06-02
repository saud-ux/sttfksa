/* Copyright (c) 2026 Saud Alhamad. All rights reserved. Licensed to STTF. */

/**
 * Netlify Function — s245645645.js
 * All scoring / match write logic lives here.
 * The browser never sees this code — it only sends an action name + params.
 * Firebase Admin SDK credentials come from the FIREBASE_SERVICE_ACCOUNT env var.
 */

const admin = require("firebase-admin");

function getDb() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set in Netlify.");
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://tennis-score-6f110-default-rtdb.firebaseio.com"
    });
  }
  return admin.database();
}

// ── CORS headers (same-origin Netlify calls, but kept permissive for dev) ──
const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ ok: false, error: "Method Not Allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ ok: false, error: "Invalid JSON" }) }; }

  const { action, matchId, ...params } = body;

  let db;
  try { db = getDb(); }
  catch (err) {
    console.error("Firebase init failed:", err.message);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ ok: false, error: err.message }) };
  }

  try {
    const result = await handleAction(db, action, matchId, params);
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, ...result }) };
  } catch (err) {
    console.error(`Action "${action}" failed:`, err.message);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

// ── Router ──────────────────────────────────────────────────────────────────
async function handleAction(db, action, matchId, params) {
  switch (action) {
    case "scorePoint":        return scorePoint(db, matchId, params);
    case "endSet":            return endSet(db, matchId);
    case "endMatch":          return endMatch(db, matchId);
    case "updateSetScore":    return updateSetScore(db, matchId, params);
    case "updateMatchScore":  return updateMatchScore(db, matchId, params);
    case "triggerTimeout":    return triggerTimeout(db, matchId, params);
    case "timeoutEnd":        return timeoutEnd(db, matchId, params);
    case "toggleCard":        return toggleCard(db, matchId, params);
    case "setServe":          return setServe(db, matchId, params);
    case "resetMatch":        return resetMatch(db, matchId);
    case "saveEditSet":       return saveEditSet(db, matchId, params);
    case "switchPlayers":     return switchPlayers(db, matchId);
    case "showCongrats":      return showCongrats(db, matchId, params);
    case "closeWinner":       return db.ref("showWinner").remove().then(() => ({}));
    case "closeCongrats":     return db.ref("showCongrats").remove().then(() => ({}));
    case "setActiveMatch":    return db.ref("activeMatch").set(params.id).then(() => ({}));
    case "saveTeams":         return saveTeams(db, matchId, params);
    case "createMatch":       return createMatch(db, params);
    case "updateMatchMeta":   return updateMatchMeta(db, matchId, params);
    case "deleteMatch":       return db.ref(`matches/${matchId}`).remove().then(() => ({}));
    case "importMatches":     return importMatches(db, params);
    case "setGameColumns":    return db.ref("settings/gameColumns").set(params.cols).then(() => ({}));
    default: throw new Error(`Unknown action: ${action}`);
  }
}

// ── Scoring ──────────────────────────────────────────────────────────────────
async function scorePoint(db, matchId, { side, delta }) {
  const snap = await db.ref(`matches/${matchId}/gameScore`).once("value");
  const gs = (snap.val() || "0 - 0").split(" - ");
  let l = parseInt(gs[0]), r = parseInt(gs[1]);

  if (side === "left")  l = Math.max(0, l + delta);
  else                  r = Math.max(0, r + delta);

  await db.ref(`matches/${matchId}/gameScore`).set(`${l} - ${r}`);
  return {};
}

async function endSet(db, matchId) {
  const snap = await db.ref(`matches/${matchId}`).once("value");
  const data = snap.val() || {};
  const gs   = (data.gameScore || "0 - 0").split(" - ");
  const gl   = parseInt(gs[0]), gr = parseInt(gs[1]);
  const hist = data.gameHistory || [];
  hist.push({ l: gl, r: gr });

  const updates = {
    [`matches/${matchId}/gameHistory`]: hist,
    [`matches/${matchId}/gameScore`]:   "0 - 0",
    [`matches/${matchId}/serve`]:       "center"
  };

  if (gl !== gr) {
    const winner = gl > gr ? "left" : "right";
    const ss = (data.setScore || "0 - 0").split(" - ");
    let sl = parseInt(ss[0]), sr = parseInt(ss[1]);
    if (winner === "left") sl++; else sr++;
    updates[`matches/${matchId}/setScore`] = `${sl} - ${sr}`;
  }

  await db.ref("/").update(updates);
  return {};
}

async function endMatch(db, matchId) {
  const snap = await db.ref(`matches/${matchId}`).once("value");
  const data = snap.val() || {};
  const ms   = (data.matchScore || "0 - 0").split(" - ");
  const lSets = parseInt(ms[0]), rSets = parseInt(ms[1]);
  const hist  = data.gameHistory || [];

  let winnerSide = lSets > rSets ? "left" : rSets > lSets ? "right" : null;
  if (!winnerSide) {
    let lPts = 0, rPts = 0;
    hist.forEach(h => { lPts += h.l; rPts += h.r; });
    winnerSide = lPts >= rPts ? "left" : "right";
  }

  const winTeam  = (data.teams || {})[winnerSide] || {};
  const wName    = [winTeam.p2, winTeam.p1].filter(Boolean).join(" | ").toUpperCase() || "WINNER";
  const ss       = (data.setScore || "0 - 0").split(" - ");
  const wSet     = winnerSide === "left" ? ss[0] : ss[1];
  const lSet     = winnerSide === "left" ? ss[1] : ss[0];

  await db.ref(`matches/${matchId}`).update({
    winner: winnerSide, winnerName: wName,
    finalScore: data.matchScore || "0 - 0",
    gameHistory: hist,
    endedAt: new Date().toISOString(),
    status: "finished"
  });

  await db.ref("showCongrats").remove();
  await db.ref("showWinner").set({
    winnerSide, winnerName: wName,
    logo: winTeam.logo || "",
    wSet, lSet, history: hist
  });
  await db.ref("match/timers").remove();

  return { winnerSide, winnerName: wName, logo: winTeam.logo || "", wSet, lSet, history: hist };
}

async function updateSetScore(db, matchId, { side, delta }) {
  const snap = await db.ref(`matches/${matchId}/setScore`).once("value");
  const s = (snap.val() || "0 - 0").split(" - ");
  let l = parseInt(s[0]), r = parseInt(s[1]);
  if (side === "left") l = Math.max(0, l + delta); else r = Math.max(0, r + delta);
  await db.ref(`matches/${matchId}/setScore`).set(`${l} - ${r}`);
  return {};
}

async function updateMatchScore(db, matchId, { side, delta }) {
  const snap = await db.ref(`matches/${matchId}/matchScore`).once("value");
  const s = (snap.val() || "0 - 0").split(" - ");
  let l = parseInt(s[0]), r = parseInt(s[1]);
  if (side === "left") l = Math.max(0, l + delta); else r = Math.max(0, r + delta);
  await db.ref(`matches/${matchId}/matchScore`).set(`${l} - ${r}`);
  return {};
}

// ── Timeout ──────────────────────────────────────────────────────────────────
async function triggerTimeout(db, matchId, { side }) {
  const snap = await db.ref(`matches/${matchId}/timeout/${side}`).once("value");
  const isActive = !!snap.val();
  await db.ref(`matches/${matchId}/timeout/${side}`).set(!isActive);
  return { wasActive: isActive };
}

async function timeoutEnd(db, matchId, { side }) {
  await db.ref(`matches/${matchId}/cards/${side}White`).set(true);
  await db.ref(`matches/${matchId}/timeout/${side}`).set(false);
  return {};
}

// ── Cards / Serve ─────────────────────────────────────────────────────────────
async function toggleCard(db, matchId, { side, type }) {
  const key  = `${side}${type}`;
  const snap = await db.ref(`matches/${matchId}/cards/${key}`).once("value");
  await db.ref(`matches/${matchId}/cards/${key}`).set(!snap.val());
  return {};
}

async function setServe(db, matchId, { serve }) {
  await db.ref(`matches/${matchId}/serve`).set(serve);
  return {};
}

// ── Match control ─────────────────────────────────────────────────────────────
async function resetMatch(db, matchId) {
  await db.ref(`matches/${matchId}`).update({
    gameScore: "0 - 0", gameHistory: [],
    timeout: { left: false, right: false }, serve: "center"
  });
  await db.ref("match/timers").remove();
  return {};
}

async function saveEditSet(db, matchId, { idx, newL, newR }) {
  if (idx === "current") {
    await db.ref(`matches/${matchId}/gameScore`).set(`${newL} - ${newR}`);
  } else {
    const snap = await db.ref(`matches/${matchId}/gameHistory`).once("value");
    const hist = snap.val() ? [...snap.val()] : [];
    while (hist.length <= idx) hist.push({ l: 0, r: 0 });
    hist[idx] = { l: newL, r: newR };
    await db.ref(`matches/${matchId}/gameHistory`).set(hist);
  }
  return {};
}

async function switchPlayers(db, matchId) {
  const snap = await db.ref(`matches/${matchId}`).once("value");
  const d    = snap.val() || {};
  const teams = d.teams || {};
  const gs = (d.gameScore  || "0 - 0").split(" - ");
  const ss = (d.setScore   || "0 - 0").split(" - ");
  const ms = (d.matchScore || "0 - 0").split(" - ");
  const hist = (d.gameHistory || []).map(h => ({ l: h.r, r: h.l }));
  const cards = d.cards || {};
  const newCards = {};
  ["White","Card","YR1","YR2"].forEach(t => {
    newCards[`left${t}`]  = cards[`right${t}`] || false;
    newCards[`right${t}`] = cards[`left${t}`]  || false;
  });
  const to    = d.timeout || {};
  const serve = d.serve   || "center";

  await db.ref(`matches/${matchId}`).update({
    "teams/left":  teams.right || {},
    "teams/right": teams.left  || {},
    gameScore:     `${gs[1]} - ${gs[0]}`,
    setScore:      `${ss[1]} - ${ss[0]}`,
    matchScore:    `${ms[1]} - ${ms[0]}`,
    gameHistory:   hist,
    cards:         newCards,
    timeout:       { left: to.right || false, right: to.left || false },
    serve:         serve === "left" ? "right" : serve === "right" ? "left" : "center"
  });
  return {};
}

async function showCongrats(db, matchId, { winnerName, teamName, logo, wSet, lSet }) {
  await db.ref("showWinner").remove();
  await db.ref("showCongrats").set({ winnerName, teamName, logo, wSet, lSet });
  return {};
}

// ── Admin: teams / matches ────────────────────────────────────────────────────
async function saveTeams(db, matchId, { teams }) {
  await db.ref(`matches/${matchId}/teams`).update(teams);
  return {};
}

async function createMatch(db, { key, matchData }) {
  await db.ref(`matches/${key}`).set(matchData);
  return { key };
}

async function updateMatchMeta(db, matchId, { updates }) {
  await db.ref(`matches/${matchId}`).update(updates);
  return {};
}

async function importMatches(db, { matches }) {
  const updates = {};
  matches.forEach(m => { updates[`matches/M${m.number}`] = m; });
  await db.ref("/").update(updates);
  return { count: matches.length };
}
