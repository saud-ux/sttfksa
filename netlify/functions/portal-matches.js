/*
 * GET /.netlify/functions/portal-matches
 * ───────────────────────────────────────
 * يعرض المباريات المستلمة من البورتال
 */

const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL;

export default async (req, context) => {
  try {
    const fbRes = await fetch(`${FIREBASE_URL}/portal_matches.json`);
    const matches = await fbRes.json();

    return new Response(
      JSON.stringify({ success: true, matches: matches || {} }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/portal-matches",
};
