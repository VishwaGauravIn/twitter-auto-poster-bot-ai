const assert = require("node:assert/strict");
const test = require("node:test");
const {
  XQUIK_API_CONTRACT,
  buildXquikIdempotencyKey,
  postXquikTweet,
  readXquikConfig,
  useXquikBackend,
} = require("../xquik");

function createResponse(status, body, headers = {}) {
  return {
    headers: new Headers(headers),
    json: async () => body,
    status,
  };
}

function dependencies(fetchImpl, overrides = {}) {
  return {
    fetchImpl,
    signalFactory: () => undefined,
    ...overrides,
  };
}

test("keeps the existing posting backend as the default", () => {
  assert.equal(useXquikBackend({}), false);
  assert.equal(useXquikBackend({ TWITTER_BACKEND: "twitter-api-v2" }), false);
  assert.equal(useXquikBackend({ TWITTER_BACKEND: "xquik" }), true);
});

test("rejects placeholder Xquik credentials", () => {
  assert.throws(
    () =>
      readXquikConfig({
        XQUIK_ACCOUNT: "example",
        XQUIK_API_KEY: "YOUR_XQUIK_API_KEY",
      }),
    /XQUIK_API_KEY/,
  );
});

test("builds a stable key for one account and workflow run", () => {
  const first = buildXquikIdempotencyKey("account-a", "same post", "run-1");
  const retry = buildXquikIdempotencyKey("account-a", "same post", "run-1");
  const otherAccount = buildXquikIdempotencyKey(
    "account-b",
    "same post",
    "run-1",
  );
  const otherRun = buildXquikIdempotencyKey(
    "account-a",
    "same post",
    "run-2",
  );

  assert.equal(first, retry);
  assert.notEqual(first, otherAccount);
  assert.notEqual(first, otherRun);
  assert.match(first, /^twitter-auto-poster:x:[0-9a-f]{64}$/);
});

test("posts with the durable Xquik contract", async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { init, url };
    return createResponse(200, {
      id: "action-1",
      result: { id: "tweet-1", type: "tweet" },
      status: "success",
      success: true,
      terminal: true,
      writeActionId: "action-1",
    });
  };

  const result = await postXquikTweet(
    "hello",
    {
      XQUIK_ACCOUNT: "test-account",
      XQUIK_API_KEY: "test-key",
    },
    dependencies(fetchImpl, { runId: "run-1" }),
  );

  assert.equal(request.url, "https://xquik.com/api/v1/x/tweets");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers["x-api-key"], "test-key");
  assert.equal(
    request.init.headers["xquik-api-contract"],
    XQUIK_API_CONTRACT,
  );
  assert.equal(
    request.init.headers["Idempotency-Key"],
    buildXquikIdempotencyKey("test-account", "hello", "run-1"),
  );
  assert.deepEqual(JSON.parse(request.init.body), {
    account: "test-account",
    text: "hello",
  });
  assert.equal(result.tweetId, "tweet-1");
  assert.equal(result.writeActionId, "action-1");
});

test("polls an accepted action after Retry-After", async () => {
  const requests = [];
  const delays = [];
  let currentTime = 0;
  const fetchImpl = async (url, init) => {
    requests.push({ init, url });
    if (init.method === "POST") {
      return createResponse(
        202,
        {
          pollAfterMs: 100,
          status: "dispatching",
          statusUrl: "/api/v1/x/write-actions/action-2",
          success: false,
          terminal: false,
          writeActionId: "action-2",
        },
        {
          Location: "/api/v1/x/write-actions/action-2",
          "Retry-After": "2",
        },
      );
    }
    return createResponse(200, {
      status: "success",
      success: true,
      terminal: true,
      tweetId: "tweet-2",
      writeActionId: "action-2",
    });
  };

  const result = await postXquikTweet(
    "scheduled post",
    {
      XQUIK_ACCOUNT: "test-account",
      XQUIK_API_KEY: "test-key",
    },
    dependencies(fetchImpl, {
      now: () => currentTime,
      sleep: async (delay) => {
        delays.push(delay);
        currentTime += delay;
      },
    }),
  );

  assert.deepEqual(delays, [2000]);
  assert.deepEqual(
    requests.map((request) => request.init.method),
    ["POST", "GET"],
  );
  assert.equal(
    requests[1].url,
    "https://xquik.com/api/v1/x/write-actions/action-2",
  );
  assert.equal(requests[1].init.headers["Idempotency-Key"], undefined);
  assert.equal(result.tweetId, "tweet-2");
});

test("never treats a write action ID as the tweet ID", async () => {
  const fetchImpl = async () =>
    createResponse(200, {
      id: "action-not-a-tweet",
      status: "success",
      success: true,
      targetId: "parent-tweet",
      terminal: true,
      writeActionId: "action-not-a-tweet",
    });

  await assert.rejects(
    () =>
      postXquikTweet(
        "missing result",
        {
          XQUIK_ACCOUNT: "test-account",
          XQUIK_API_KEY: "test-key",
        },
        dependencies(fetchImpl),
      ),
    /without a confirmed X post ID/,
  );
});

test("rejects unsafe status URLs before sending credentials", async () => {
  let requestCount = 0;
  const fetchImpl = async () => {
    requestCount += 1;
    return createResponse(202, {
      status: "dispatching",
      statusUrl: "https://example.com/steal",
      success: false,
      terminal: false,
      writeActionId: "action-3",
    });
  };

  await assert.rejects(
    () =>
      postXquikTweet(
        "unsafe status",
        {
          XQUIK_ACCOUNT: "test-account",
          XQUIK_API_KEY: "test-key",
        },
        dependencies(fetchImpl),
      ),
    /unsafe status URL/,
  );
  assert.equal(requestCount, 1);
});

test("returns terminal failures without resubmitting", async () => {
  let requestCount = 0;
  const fetchImpl = async () => {
    requestCount += 1;
    return createResponse(200, {
      message: "Account needs reconnection.",
      status: "failed",
      success: false,
      terminal: true,
      writeActionId: "action-4",
    });
  };

  await assert.rejects(
    () =>
      postXquikTweet(
        "failed post",
        {
          XQUIK_ACCOUNT: "test-account",
          XQUIK_API_KEY: "test-key",
        },
        dependencies(fetchImpl),
      ),
    /Account needs reconnection/,
  );
  assert.equal(requestCount, 1);
});

test("times out pending actions without submitting a second post", async () => {
  const methods = [];
  let currentTime = 0;
  const fetchImpl = async (url, init) => {
    methods.push(init.method);
    return createResponse(init.method === "POST" ? 202 : 200, {
      pollAfterMs: 100,
      status: "pending_confirmation",
      statusUrl: "/api/v1/x/write-actions/action-5",
      success: false,
      terminal: false,
      writeActionId: "action-5",
    });
  };

  await assert.rejects(
    () =>
      postXquikTweet(
        "slow post",
        {
          XQUIK_ACCOUNT: "test-account",
          XQUIK_API_KEY: "test-key",
        },
        dependencies(fetchImpl, {
          now: () => currentTime,
          pollTimeoutMs: 150,
          sleep: async (delay) => {
            currentTime += delay;
          },
        }),
      ),
    /still pending/,
  );
  assert.deepEqual(methods, ["POST", "GET"]);
});

test("surfaces API and invalid response errors", async (context) => {
  const errors = [
    [{ message: "Invalid account." }, /Invalid account/],
    [{ error: { message: "Structured error." } }, /Structured error/],
    [{ error: "error_code" }, /error_code/],
    [{}, /HTTP 400/],
  ];
  for (const [body, expected] of errors) {
    await context.test(String(expected), async () => {
      const fetchImpl = async () => createResponse(400, body);

      await assert.rejects(
        () =>
          postXquikTweet(
            "invalid account",
            {
              XQUIK_ACCOUNT: "test-account",
              XQUIK_API_KEY: "test-key",
            },
            dependencies(fetchImpl),
          ),
        expected,
      );
    });
  }

  await context.test("invalid JSON", async () => {
    const fetchImpl = async () => ({
      headers: new Headers(),
      json: async () => {
        throw new Error("invalid JSON");
      },
      status: 200,
    });

    await assert.rejects(
      () =>
        postXquikTweet(
          "invalid response",
          {
            XQUIK_ACCOUNT: "test-account",
            XQUIK_API_KEY: "test-key",
          },
          dependencies(fetchImpl),
        ),
      /invalid response/,
    );
  });

  await context.test("transport failure", async () => {
    const fetchImpl = async () => {
      throw new Error("private transport detail");
    };

    await assert.rejects(
      () =>
        postXquikTweet(
          "network failure",
          {
            XQUIK_ACCOUNT: "test-account",
            XQUIK_API_KEY: "test-key",
          },
          dependencies(fetchImpl),
        ),
      /Xquik request failed\. Check connectivity and try again\./,
    );
  });
});
