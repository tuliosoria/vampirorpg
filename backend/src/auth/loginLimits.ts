import { createHash } from "node:crypto";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { hitRateLimit } from "../db/rateLimit";
import { HttpError, type Config, type HandlerRequest } from "../types/domain";

type LoginKind = "admin" | "player";
type LoginDeps = { doc: DynamoDBDocumentClient; config: Config };

/**
 * Persistent counters protect code login across Lambda instances.
 * The IP comes from the gateway, never an untrusted forwarded header.
 * No code, token or raw IP is stored in the limiter key.
 */
export async function enforceLoginLimits(deps: LoginDeps, req: HandlerRequest, kind: LoginKind): Promise<void> {
  const ip = createHash("sha256").update(req.sourceIp || "unknown").digest("hex");
  const prefix = `auth-login#${deps.config.campaignId}#${kind}`;
  const perIp = await hitRateLimit(deps.doc, deps.config.tableName, `${prefix}#ip#${ip}`, 60);
  if (perIp > (kind === "admin" ? 5 : 10)) {
    throw new HttpError(429, "RATE_LIMITED", "Muitas tentativas de acesso. Aguarde um minuto e tente novamente.");
  }
  const total = await hitRateLimit(deps.doc, deps.config.tableName, `${prefix}#global`, 60);
  if (total > (kind === "admin" ? 60 : 120)) {
    throw new HttpError(429, "RATE_LIMITED", "O acesso está temporariamente limitado. Aguarde um minuto e tente novamente.");
  }
}

