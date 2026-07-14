/*
 * POST /.netlify/functions/send-results
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

    // ── اجلب النتيجة من Firebase ──
    const scoresRes = await fetch(
      `${FIREBASE_URL}/portal_results/${sourceMatchId}.json`
    );
    const scores = await scoresRes.json();

    if (!scores) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No results found. Play the match first.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── جهّز الـ payload ──
    const resultPayload = {
      matchId: sourceMatchId,
      playedAt: scores.playedAt || new Date().toISOString(),
      results: scores.results,
    };

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

      // ── حدّث الحالة في Firebase ──
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
      console.error("❌ Portal rejected:", portalRes.status);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Portal rejected the results",
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
