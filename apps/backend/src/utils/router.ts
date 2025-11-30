/**
 * Simple Router Utility
 * 
 * Lightweight routing for Cloudflare Workers.
 * Matches URL patterns and HTTP methods to handlers.
 */

/// <reference types="@cloudflare/workers-types" />

export type RouteParams = Record<string, string>;

export interface RouteContext<E = unknown> {
  request: Request;
  params: RouteParams;
  env: E;
  ctx: ExecutionContext;
}

export type RouteHandler<E = unknown> = (
  context: RouteContext<E>
) => Promise<Response> | Response;

interface Route<E> {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler<E>;
}

/**
 * Simple Router for Cloudflare Workers
 */
export class Router<E = unknown> {
  private routes: Route<E>[] = [];
  
  /**
   * Convert a path pattern like "/api/events/:eventId/photos"
   * into a RegExp and extract param names.
   */
  private parsePattern(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    
    // Escape special regex chars except :
    let regexStr = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace :param with capture group
    regexStr = regexStr.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    
    // Anchor the pattern
    const pattern = new RegExp(`^${regexStr}$`);
    
    return { pattern, paramNames };
  }
  
  /**
   * Register a route handler.
   */
  private addRoute(method: string, path: string, handler: RouteHandler<E>): void {
    const { pattern, paramNames } = this.parsePattern(path);
    this.routes.push({ method, pattern, paramNames, handler });
  }
  
  // HTTP method shortcuts
  get(path: string, handler: RouteHandler<E>): this {
    this.addRoute('GET', path, handler);
    return this;
  }
  
  post(path: string, handler: RouteHandler<E>): this {
    this.addRoute('POST', path, handler);
    return this;
  }
  
  put(path: string, handler: RouteHandler<E>): this {
    this.addRoute('PUT', path, handler);
    return this;
  }
  
  patch(path: string, handler: RouteHandler<E>): this {
    this.addRoute('PATCH', path, handler);
    return this;
  }
  
  delete(path: string, handler: RouteHandler<E>): this {
    this.addRoute('DELETE', path, handler);
    return this;
  }
  
  options(path: string, handler: RouteHandler<E>): this {
    this.addRoute('OPTIONS', path, handler);
    return this;
  }
  
  /**
   * Handle an incoming request.
   * Returns the matched handler's response or null if no match.
   */
  async handle(
    request: Request,
    env: E,
    ctx: ExecutionContext
  ): Promise<Response | null> {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;
    
    for (const route of this.routes) {
      // Check method
      if (route.method !== method && route.method !== '*') {
        continue;
      }
      
      // Check pattern
      const match = pathname.match(route.pattern);
      if (!match) continue;
      
      // Extract params
      const params: RouteParams = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });
      
      // Call handler
      return route.handler({ request, params, env, ctx });
    }
    
    return null;
  }
}

/**
 * CORS headers for cross-origin requests.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Create a JSON response with proper headers.
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
  });
}

/**
 * Create an error response.
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string
): Response {
  return jsonResponse(
    {
      error: true,
      message,
      code: code ?? `HTTP_${status}`,
    },
    status
  );
}

/**
 * Handle CORS preflight requests.
 */
export function handleCors(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Parse JSON body from request.
 */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}
