import { createDb } from "@placement/db";
import * as schema from "@placement/db/schema/auth";
import { env } from "@placement/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

function getTrustedOrigins() {
  const trustedOrigins = new Set<string>();

  trustedOrigins.add(new URL(env.BETTER_AUTH_URL).origin);

  if (env.CORS_ORIGIN) {
    for (const value of env.CORS_ORIGIN.split(",")) {
      const candidate = value.trim();
      if (!candidate) {
        continue;
      }

      try {
        trustedOrigins.add(new URL(candidate).origin);
      } catch {
        console.error("Ignoring invalid CORS_ORIGIN value", candidate);
      }
    }
  }

  return [...trustedOrigins];
}

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: getTrustedOrigins(),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : undefined,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();
