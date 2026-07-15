/*
 * POST /api/send-results
 * ──────────────────────────────────────
 * السكوربورد يستدعي هذا لما تنتهي المباراة
 * ويرسل النتيجة لبورتال عمر
 */

const RESULTS_KEY = process.env.FEDERATION_RESULTS_API_KEY;
const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL;
const PORTAL_RESULTS_URL = process.env.PORTAL_RESULTS_URL;

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { sourceMatchId } = await req.json();

    if (!sourceMatchId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing sourceMatchId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📤 Sending results for match: ${sourceMatchId}`);

    // ── اجلب بيانات المباراة الأصلية من البورتال (فيها playerId) ──
    const matchRes = await fetch(
      `${FIREBASE_URL}/portal_matches/${sourceMatchId}.json`
    );
    const portalMatch = await matchRes.json();

    if (!portalMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "Portal match not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── اجلب النتيجة من Firebase ──
    const scoresRes = await fetch(
      `${FIREBASE_URL}/portal_results/${sourceMatchId}.json`
    );
    const scores = await scoresRes.json();

    if (!scores) {
      return new Response(
        JSON.stringify({ success: false, error: "No results found. Play the match first." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── حوّل البيانات لتنسيق عمر ──
    const gameHistory = (scores.results && scores.results.gameHistory) || [];
    const winner = (scores.results && scores.results.winner) || "left";
    const participants = portalMatch.participants || [];

    // side 1 = left في السكوربورد، side 2 = right
    const side1Players = participants.filter(p => p.side === 1);
    const side2Players = participants.filter(p => p.side === 2);

    // حساب النقاط لكل جهة من gameHistory
    // gameHistory = [{l: 11, r: 8}, {l: 9, r: 11}, ...]
    const leftPoints = gameHistory.map(g => g.l || 0);
    const rightPoints = gameHistory.map(g => g.r || 0);

    // حساب عدد الأشواط المكسوبة
    let leftSetsWon = 0;
    let rightSetsWon = 0;
    gameHistory.forEach(g => {
      if ((g.l || 0) > (g.r || 0)) leftSetsWon++;
      else if ((g.r || 0) > (g.l || 0)) rightSetsWon++;
    });

    const leftIsWinner = winner === "left";

    // بناء مصفوفة النتائج بتنسيق عمر
    const results = [];

    side1Players.forEach(p => {
      results.push({
        playerId: p.playerId,
        side: 1,
        positionInSide: p.positionInSide || 1,
        setsWon: leftSetsWon,
        pointsFor: leftPoints,
        isWinner: leftIsWinner,
      });
    });

    side2Players.forEach(p => {
      results.push({
        playerId: p.playerId,
        side: 2,
        positionInSide: p.positionInSide || 1,
        setsWon: rightSetsWon,
        pointsFor: rightPoints,
        isWinner: !leftIsWinner,
      });
    });

    const resultPayload = {
      matchId: sourceMatchId,
      playedAt: scores.playedAt || new Date().toISOString(),
      results: results,
    };

    console.log("📦 Payload:", JSON.stringify(resultPayload));

    // ── ارسل لبورتال عمر ──
    const portalRes = await fetch(PORTAL_RESULTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESULTS_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resultPayload),
    });

    const portalData = await portalRes.json().catch(() => ({}));

    if (portalRes.ok) {
      console.log("✅ Results sent successfully");

      await fetch(
        `${FIREBASE_URL}/portal_matches/${sourceMatchId}/status.json`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify("COMPLETED"),
        }
      );

      return new Response(
        JSON.stringify({ success: true, portalResponse: portalData }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.error("❌ Portal rejected:", portalRes.status, JSON.stringify(portalData));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Portal rejected the results",
          status: portalRes.status,
          details: portalData,
        }),
        { status: portalRes.status, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/send-results",
};
