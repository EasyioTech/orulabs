const API_URL = "http://api:3001";

// Hop-by-hop headers must not be forwarded by proxies (RFC 2616 §13.5.1)
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

function filterHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of headers.entries()) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) out[k] = v;
  }
  return out;
}

async function handler(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params;
    const path = slug.join("/");
    const url = new URL(req.url);
    const fullUrl = `${API_URL}/api/${path}${url.search}`;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: filterHeaders(req.headers),
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.text();
    }

    const response = await fetch(fullUrl, fetchOptions);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: filterHeaders(response.headers),
    });
  } catch (error) {
    console.error("API proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
