/*
 * POST /.netlify/functions/sync-matches
 * ──────────────────────────────────────
 * يستقبل بيانات المباريات من بورتال عمر ويخزنها في Firebase
 */

const SYNC_KEY = process.env.FEDERATION_SYNC_API_KEY;
const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL;

export default async (req, context) => {
  // ── فقط POST ──
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── تحقق من التوكن ──
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${SYNC_KEY}`) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();

    // ── تحقق إن فيه مباريات ──
    if (!payload.matches || !Array.isArray(payload.matches)) {
      return new Response(JSON.stringify({ success: false, error: "Missing matches array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📥 Received ${payload.matches.length} match(es) from portal`);

    // ── خزّن كل مباراة في Firebase ──
    for (const match of payload.matches) {
      const dataToStore = {
        sourceMatchId: match.sourceMatchId,
        format: payload.scope?.format || "SINGLES",
        type: match.type,
        round: match.round,
        tableNumber: match.tableNumber,
        scheduledAt: match.scheduledAt,
        participants: match.participants,
        competition: {
          id: payload.competition?.id,
          name: payload.competition?.name,
          category: payload.competition?.category,
        },
        federation: {
          id: payload.federation?.id,
          name: payload.federation?.name,
        },
        status: "PENDING",
        syncedAt: payload.syncedAt || new Date().toISOString(),
      };

      const fbRes = await fetch(
        `${FIREBASE_URL}/portal_matches/${match.sourceMatchId}.json`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToStore),
        }
      );

      if (!fbRes.ok) {
        console.error(`❌ Failed to store match ${match.sourceMatchId}`);
      } else {
        console.log(`✅ Stored match: ${match.sourceMatchId}`);
      }
    }

    // ── خزّن بيانات البطولة ──
    if (payload.competition) {
      await fetch(
        `${FIREBASE_URL}/portal_competitions/${payload.competition.id}.json`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload.competition,
            federation: payload.federation,
            venue: payload.competition.venue,
          }),
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Sync error:", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/sync-matches",
};
