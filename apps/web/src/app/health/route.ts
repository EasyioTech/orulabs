const API_URL = "http://api:3001";

const HOP_BY_HOP = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailers",
]);

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const text = await response.text();
    const headers: Record<string, string> = {};
    for (const [k, v] of response.headers.entries()) {
      if (!HOP_BY_HOP.has(k.toLowerCase())) headers[k] = v;
    }
    return new Response(text, { status: response.status, headers });
  } catch (error) {
    console.error("Health check error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
