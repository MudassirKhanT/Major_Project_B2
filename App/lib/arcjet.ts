import arcjet, { tokenBucket, shield, detectBot, fixedWindow } from "@arcjet/next";

const ARCJET_KEY = process.env.ARCJET_KEY;
const hasKey = !!ARCJET_KEY && !ARCJET_KEY.startsWith("ajkey_xxxx");

// Base instance — used in middleware (use IP, not userId, since requests may be unauthenticated)
export const aj = hasKey
  ? arcjet({
      key: ARCJET_KEY!,
      characteristics: ["ip.src"],
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
        }),
      ],
    })
  : null;

// Rate limiter for agent runs (10/min per user)
export const agentRunLimiter = hasKey
  ? arcjet({
      key: ARCJET_KEY!,
      characteristics: ["userId"],
      rules: [
        shield({ mode: "LIVE" }),
        tokenBucket({ mode: "LIVE", refillRate: 10, interval: 60, capacity: 10 }),
      ],
    })
  : null;

// Rate limiter for general API (60/min per user)
export const apiLimiter = hasKey
  ? arcjet({
      key: ARCJET_KEY!,
      characteristics: ["userId"],
      rules: [
        shield({ mode: "LIVE" }),
        fixedWindow({ mode: "LIVE", window: "1m", max: 60 }),
      ],
    })
  : null;
