const { createHash, randomUUID } = require("node:crypto");

const DEFAULT_BACKEND = "twitter-api-v2";
const XQUIK_API_CONTRACT = "2026-04-29";
const XQUIK_API_ORIGIN = "https://xquik.com";
const XQUIK_API_ROOT = `${XQUIK_API_ORIGIN}/api/v1/`;
const XQUIK_BACKEND = "xquik";
const XQUIK_POLL_TIMEOUT_MS = 60_000;
const XQUIK_REQUEST_TIMEOUT_MS = 30_000;
const XQUIK_TWEETS_URL = `${XQUIK_API_ROOT}x/tweets`;
const WRITE_ACTION_PATH_PREFIX = "/api/v1/x/write-actions/";

function isRecord(value) {
  return value !== null && typeof value === "object";
}

function isUsableValue(value) {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.trim().startsWith("YOUR_")
  );
}

function readSetting(secrets, key, fallback) {
  if (isUsableValue(process.env[key])) return process.env[key].trim();
  if (isUsableValue(secrets[key])) return secrets[key].trim();
  return fallback;
}

function useXquikBackend(secrets = {}) {
  return (
    readSetting(secrets, "TWITTER_BACKEND", DEFAULT_BACKEND).toLowerCase() ===
    XQUIK_BACKEND
  );
}

function readXquikConfig(secrets = {}) {
  const apiKey = readSetting(secrets, "XQUIK_API_KEY");
  const account = readSetting(secrets, "XQUIK_ACCOUNT");

  if (apiKey === undefined) {
    throw new Error("XQUIK_API_KEY is required when TWITTER_BACKEND is xquik.");
  }
  if (account === undefined) {
    throw new Error("XQUIK_ACCOUNT is required when TWITTER_BACKEND is xquik.");
  }

  return { account, apiKey };
}

function buildXquikIdempotencyKey(account, tweetText, runId) {
  if (!isUsableValue(runId)) {
    throw new Error("Xquik requires a unique run ID.");
  }

  const digest = createHash("sha256")
    .update(account)
    .update("\0")
    .update(tweetText)
    .update("\0")
    .update(runId.trim())
    .digest("hex");
  return `twitter-auto-poster:x:${digest}`;
}

function readRunId(dependencies) {
  const environment = dependencies.environment ?? process.env;

  if (isUsableValue(dependencies.runId)) {
    return dependencies.runId.trim();
  }
  if (isUsableValue(environment.GITHUB_RUN_ID)) {
    return environment.GITHUB_RUN_ID.trim();
  }
  return (dependencies.createRunId ?? randomUUID)();
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function requestSignal() {
  return AbortSignal.timeout(XQUIK_REQUEST_TIMEOUT_MS);
}

async function readJson(response) {
  try {
    const body = await response.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

function responseMessage(body, status) {
  if (typeof body?.message === "string" && body.message.trim() !== "") {
    return body.message;
  }
  if (
    isRecord(body?.error) &&
    typeof body.error.message === "string" &&
    body.error.message.trim() !== ""
  ) {
    return body.error.message;
  }
  if (typeof body?.error === "string" && body.error.trim() !== "") {
    return body.error;
  }
  return `Xquik request failed with HTTP ${String(status)}.`;
}

function actionId(action) {
  const value = action.writeActionId ?? action.id;
  return typeof value === "string" && value !== "" ? value : "";
}

function tweetId(action) {
  const resultId =
    isRecord(action.result) && action.result.type === "tweet"
      ? action.result.id
      : undefined;
  const value = resultId ?? action.tweetId ?? action.resultId;
  return typeof value === "string" && value !== "" ? value : "";
}

function terminalState(status, action) {
  if (typeof action.terminal === "boolean") return action.terminal;
  if (["success", "failed", "expired"].includes(action.status)) return true;
  if (
    ["accepted", "dispatching", "pending_confirmation"].includes(action.status)
  ) {
    return false;
  }
  if (status === 200 && action.success === true) return true;
  if (status === 202 && actionId(action) !== "") return false;
  return undefined;
}

function statusReference(response, action) {
  const nextAction = isRecord(action.nextAction) ? action.nextAction : {};
  const candidates = [
    action.statusUrl,
    response.headers.get("location"),
    nextAction.url,
  ];
  const reference = candidates.find(
    (value) => typeof value === "string" && value !== "",
  );
  if (reference !== undefined) return reference;

  const id = actionId(action);
  return id === ""
    ? ""
    : `${WRITE_ACTION_PATH_PREFIX}${encodeURIComponent(id)}`;
}

function validatedStatusUrl(reference) {
  if (reference === "") return undefined;

  let url;
  try {
    url = new URL(reference, XQUIK_API_ROOT);
  } catch {
    return undefined;
  }

  if (
    url.protocol !== "https:" ||
    url.origin !== XQUIK_API_ORIGIN ||
    url.username !== "" ||
    url.password !== "" ||
    !url.pathname.startsWith(WRITE_ACTION_PATH_PREFIX) ||
    url.pathname.length === WRITE_ACTION_PATH_PREFIX.length ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    return undefined;
  }
  return url.href;
}

function nonnegativeNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function pollDelayMs(response, action) {
  const retryAfter = nonnegativeNumber(response.headers.get("retry-after"));
  if (retryAfter !== undefined) {
    return Math.max(retryAfter * 1000, 100);
  }

  const bodyDelay = nonnegativeNumber(action.pollAfterMs);
  if (bodyDelay !== undefined) {
    return Math.max(bodyDelay, 100);
  }

  const nextAction = isRecord(action.nextAction) ? action.nextAction : {};
  const nextDelay = nonnegativeNumber(nextAction.afterMs);
  if (nextDelay !== undefined) {
    return Math.max(nextDelay, 100);
  }
  return 1000;
}

function pendingError(id, statusUrl) {
  return new Error(
    `Xquik confirmation is still pending for action ${id}. Check ${statusUrl} before posting again.`,
  );
}

function terminalResult(action, statusUrl) {
  const id = actionId(action);
  const succeeded =
    typeof action.success === "boolean"
      ? action.success
      : action.status === "success";

  if (!succeeded) {
    throw new Error(responseMessage(action, 200));
  }

  const platformId = tweetId(action);
  if (platformId === "") {
    throw new Error(
      `Xquik completed action ${id} without a confirmed X post ID. Check ${statusUrl}.`,
    );
  }

  return {
    raw: action,
    tweetId: platformId,
    writeActionId: id,
  };
}

async function request(fetchImpl, url, init, signalFactory) {
  try {
    return await fetchImpl(url, {
      ...init,
      signal: signalFactory(),
    });
  } catch {
    throw new Error("Xquik request failed. Check connectivity and try again.");
  }
}

async function postXquikTweet(tweetText, secrets = {}, dependencies = {}) {
  if (typeof tweetText !== "string" || tweetText.trim() === "") {
    throw new Error("Xquik requires non-empty tweet text.");
  }

  const fetchImpl = dependencies.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is required to post through Xquik.");
  }

  const wait = dependencies.sleep ?? sleep;
  const now = dependencies.now ?? Date.now;
  const pollTimeoutMs =
    dependencies.pollTimeoutMs ?? XQUIK_POLL_TIMEOUT_MS;
  const signalFactory = dependencies.signalFactory ?? requestSignal;
  const runId = readRunId(dependencies);
  const config = readXquikConfig(secrets);
  const authHeaders = {
    "x-api-key": config.apiKey,
    "xquik-api-contract": XQUIK_API_CONTRACT,
  };
  const deadline = now() + pollTimeoutMs;

  let response = await request(
    fetchImpl,
    XQUIK_TWEETS_URL,
    {
      body: JSON.stringify({
        account: config.account,
        text: tweetText,
      }),
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        "Idempotency-Key": buildXquikIdempotencyKey(
          config.account,
          tweetText,
          runId,
        ),
      },
      method: "POST",
    },
    signalFactory,
  );

  while (true) {
    const body = await readJson(response);
    if (![200, 202].includes(response.status)) {
      throw new Error(responseMessage(body, response.status));
    }
    if (body === null) {
      throw new Error("Xquik returned an invalid response.");
    }

    const id = actionId(body);
    const reference = statusReference(response, body);
    const statusUrl = validatedStatusUrl(reference);
    const terminal = terminalState(response.status, body);

    if (terminal === undefined) {
      throw new Error("Xquik returned an incomplete write status.");
    }
    if (terminal) {
      return terminalResult(body, statusUrl);
    }
    if (reference !== "" && statusUrl === undefined) {
      throw new Error("Xquik returned an unsafe status URL.");
    }
    if (statusUrl === undefined) {
      throw new Error("Xquik accepted the post without a status URL.");
    }

    const delay = pollDelayMs(response, body);
    if (now() + delay >= deadline) {
      throw pendingError(id, statusUrl);
    }

    await wait(delay);
    if (now() >= deadline) {
      throw pendingError(id, statusUrl);
    }

    response = await request(
      fetchImpl,
      statusUrl,
      {
        headers: authHeaders,
        method: "GET",
      },
      signalFactory,
    );
  }
}

module.exports = {
  XQUIK_API_CONTRACT,
  buildXquikIdempotencyKey,
  postXquikTweet,
  readXquikConfig,
  useXquikBackend,
};
