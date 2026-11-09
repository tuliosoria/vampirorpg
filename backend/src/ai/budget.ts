import { UpdateCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { ImageOptions } from "./images";
import { HttpError } from "../types/domain";
import { makeDocClient } from "../db/dynamo";
export interface BudgetPolicy {
  chat: Record<string, { reserveMicros: number; maxInputBytes: number; maxOutputTokens: number }>;
  images: Array<ImageOptions & { reserveMicros: number; maxPromptBytes: number; maxReferenceBytes: number; maxReferences: number }>;
}
export interface AiBudget {
  beforeChat(model: string, system: string, user: string, maxTokens?: number): Promise<number>;
  beforeImage(options: ImageOptions, prompt: string, references: Buffer[]): Promise<void>;
}
type Options = { doc: DynamoDBDocumentClient; tableName: string; scope: string; monthlyMicros: number; policy: BudgetPolicy; now?: () => Date };
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function configurationError(): never { throw new Error("Invalid AI budget configuration"); }
function policyError(): never { throw new HttpError(503, "AI_BUDGET_POLICY", "Esta operação de IA não possui uma política de custo aprovada."); }

/** Fixed, conservative reservations. No refund on timeouts, errors or retries:
 * the provider may already have accepted the request. No prompts/keys are stored.
 * The approved policy must price the worst case of each allowed request. */
export function createAiBudget(options: Options): AiBudget {
  const { doc, tableName, scope, monthlyMicros, policy } = options;
  if (!tableName || !scope || scope.length > 100 || !positiveInteger(monthlyMicros) ||
      !policy || typeof policy.chat !== "object" || !policy.chat || Array.isArray(policy.chat) ||
      !Array.isArray(policy.images)) configurationError();
  for (const [model, rule] of Object.entries(policy.chat)) {
    if (!model || !rule || !positiveInteger(rule.reserveMicros) ||
        !positiveInteger(rule.maxInputBytes) || !positiveInteger(rule.maxOutputTokens)) configurationError();
  }
  for (const rule of policy.images) {
    if (!rule || ![rule.model, rule.size, rule.quality].every(v => typeof v === "string" && v.length > 0) ||
        (rule.inputFidelity != null && typeof rule.inputFidelity !== "string") ||
        !positiveInteger(rule.reserveMicros) || !positiveInteger(rule.maxPromptBytes) ||
        !positiveInteger(rule.maxReferenceBytes) || !positiveInteger(rule.maxReferences)) configurationError();
  }
  async function reserve(amount: number): Promise<void> {
    if (amount > monthlyMicros) throw new HttpError(429, "AI_BUDGET_EXCEEDED", "O limite mensal de IA foi atingido.");
    const month = (options.now?.() ?? new Date()).toISOString().slice(0, 7);
    try {
      await doc.send(new UpdateCommand({
        TableName: tableName,
        Key: { PK: `AI_BUDGET#${scope}`, SK: `MONTH#${month}` },
        UpdateExpression: "ADD #reserved :amount",
        ConditionExpression: "attribute_not_exists(#reserved) OR #reserved <= :remaining",
        ExpressionAttributeNames: { "#reserved": "reservedMicros" },
        ExpressionAttributeValues: { ":amount": amount, ":remaining": monthlyMicros - amount },
      }));
    } catch (error) {
      if ((error as { name?: string })?.name === "ConditionalCheckFailedException") {
        throw new HttpError(429, "AI_BUDGET_EXCEEDED", "O limite mensal de IA foi atingido.");
      }
      throw new HttpError(503, "AI_BUDGET_UNAVAILABLE", "O controle de custo de IA está indisponível. Tente novamente depois.");
    }
  }
  return {
    async beforeChat(model, system, user, maxTokens) {
      const rule = Object.prototype.hasOwnProperty.call(policy.chat, model) ? policy.chat[model] : undefined;
      if (!rule || Buffer.byteLength(system, "utf8") + Buffer.byteLength(user, "utf8") > rule.maxInputBytes) policyError();
      const bound = maxTokens ?? rule.maxOutputTokens;
      if (!positiveInteger(bound) || bound > rule.maxOutputTokens) policyError();
      await reserve(rule.reserveMicros);
      return bound;
    },
    async beforeImage(opts, prompt, references) {
      const rule = policy.images.find(r => r.model === opts.model && r.size === opts.size && r.quality === opts.quality &&
        (r.inputFidelity || "") === (opts.inputFidelity || ""));
      if (!rule || Buffer.byteLength(prompt, "utf8") > rule.maxPromptBytes || references.length > rule.maxReferences ||
          references.reduce((total, ref) => total + ref.byteLength, 0) > rule.maxReferenceBytes) policyError();
      await reserve(rule.reserveMicros);
    },
  };
}

/** Opt-in only. All API/worker/CLI OpenAI factories call this boundary so an
 * administrator cannot bypass the ledger. The default sets no monetary cap. */
export function budgetFromEnvironment(env: Record<string, string | undefined> = process.env): AiBudget | undefined {
  if (env.AI_BUDGET_ENABLED === undefined || env.AI_BUDGET_ENABLED === "false") return undefined;
  if (env.AI_BUDGET_ENABLED !== "true") configurationError();
  const raw = env.AI_BUDGET_MONTHLY_MICROS ?? "";
  if (!/^[1-9][0-9]*$/.test(raw) || !positiveInteger(Number(raw))) configurationError();
  if (!env.TABLE_NAME || !env.AI_BUDGET_SCOPE || !env.AI_BUDGET_POLICY_JSON) configurationError();
  let policy: BudgetPolicy;
  try { policy = JSON.parse(env.AI_BUDGET_POLICY_JSON); } catch { configurationError(); }
  return createAiBudget({ doc: makeDocClient(env.AWS_REGION), tableName: env.TABLE_NAME,
    scope: env.AI_BUDGET_SCOPE, monthlyMicros: Number(raw), policy });
}
