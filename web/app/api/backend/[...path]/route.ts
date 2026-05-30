import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

async function proxyRequest(request: NextRequest, method: string, path: string[]) {
  const url = new URL(request.url);
  const target = new URL(`${BACKEND_URL}/${path.join("/")}`);
  target.search = url.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.text();
  }

  let response: Response;
  try {
    response = await fetch(target, init);
  } catch {
    return new NextResponse(JSON.stringify({ detail: "Backend unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  if (response.status === 204) {
    const responseHeaders = new Headers(response.headers);
    return new NextResponse(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers(response.headers);

  // Ensure Tamil/Unicode text is never mis-decoded as Latin-1 by the browser
  const ct = responseHeaders.get("content-type") ?? "";
  if (ct.includes("application/json") && !ct.includes("charset")) {
    responseHeaders.set("content-type", "application/json; charset=utf-8");
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

async function resolvePath(context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return params.path;
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "GET", await resolvePath(context));
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "POST", await resolvePath(context));
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "PUT", await resolvePath(context));
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "PATCH", await resolvePath(context));
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "DELETE", await resolvePath(context));
}
