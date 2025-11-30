export interface Env {
  // Define your bindings here
  // Example: MY_KV: KVNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("CrowdLens API", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
