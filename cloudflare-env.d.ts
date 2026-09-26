// Minimal Cloudflare runtime types used by db/index.ts and worker/index.ts.
// The full @cloudflare/workers-types package is not installed in this project.
interface Fetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

interface D1Database {
  prepare(query: string): unknown;
  batch(statements: unknown[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}

declare module "cloudflare:workers" {
  export const env: { DB?: D1Database; [binding: string]: unknown };
}
