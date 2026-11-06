// Pins what every validated tRPC input accepts, what it turns valid input into,
// and the exact error text a client gets back for bad input. The auth screen and
// the lobby show that text to players, so a validator upgrade must keep it.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { TRPCError } from "@trpc/server";

const dir = mkdtempSync(join(tmpdir(), "chess-validation-"));
process.env.CHESS_DB_FILE = join(dir, "chess.db");
process.env.NODE_ENV = "test";
const { appRouter } = await import("../src/server/router.js");
const { sqlite } = await import("../src/server/db.js");
const { getSessionBundle } = await import("../src/server/session.js");
after(() => {
  sqlite.close();
  rmSync(dir, { recursive: true, force: true });
});

let peer = 0;
function anonymous() {
  return appRouter.createCaller({
    user: null,
    session: null,
    clientIp: `peer-${peer++}`,
    res: { setHeader() {} } as never,
    refreshSession: () => ({ user: null, session: null }),
  });
}

let cookie = "";
function signedIn() {
  const bundle = getSessionBundle(cookie);
  assert.ok(bundle.user, "test session should be valid");
  return appRouter.createCaller({
    ...bundle,
    clientIp: `peer-${peer++}`,
    res: { setHeader() {} } as never,
    refreshSession: () => getSessionBundle(cookie),
  });
}

before(async () => {
  let setCookie = "";
  await appRouter
    .createCaller({
      user: null,
      session: null,
      clientIp: "setup",
      res: {
        setHeader(_name: string, value: string) {
          setCookie = value;
        },
      } as never,
      refreshSession: () => ({ user: null, session: null }),
    })
    .auth.register({ username: "validator", password: "correct horse" });
  cookie = setCookie.split(";")[0];
});

async function rejection(call: Promise<unknown>): Promise<TRPCError> {
  try {
    await call;
  } catch (error) {
    assert.ok(error instanceof TRPCError, `expected TRPCError, got ${String(error)}`);
    return error;
  }
  assert.fail("expected the call to be rejected");
}

async function assertInvalid(call: Promise<unknown>, message: string) {
  const error = await rejection(call);
  assert.equal(error.code, "BAD_REQUEST");
  assert.equal(error.message, message);
}

const long = (length: number) => "a".repeat(length);

describe("auth input", () => {
  test("register trims the username and returns it", async () => {
    const user = await anonymous().auth.register({
      username: "  trim_me-1  ",
      password: long(8),
      extra: "dropped",
    } as never);
    assert.equal(user.username, "trim_me-1");
  });

  test("register accepts the length bounds", async () => {
    assert.equal(
      (await anonymous().auth.register({ username: "abc", password: long(72) })).username,
      "abc",
    );
    assert.equal(
      (await anonymous().auth.register({ username: long(24), password: long(8) })).username,
      long(24),
    );
  });

  test("login trims the username before lookup", async () => {
    const user = await anonymous().auth.login({
      username: " validator ",
      password: "correct horse",
    });
    assert.equal(user.username, "validator");
  });

  const invalid: Array<[string, unknown, string]> = [
    [
      "short username",
      { username: "ab", password: long(8) },
      `[
  {
    "code": "too_small",
    "minimum": 3,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 3 character(s)",
    "path": [
      "username"
    ]
  }
]`,
    ],
    [
      "username that is short only after trimming",
      { username: "  ab  ", password: long(8) },
      `[
  {
    "code": "too_small",
    "minimum": 3,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 3 character(s)",
    "path": [
      "username"
    ]
  }
]`,
    ],
    [
      "long username",
      { username: long(25), password: long(8) },
      `[
  {
    "code": "too_big",
    "maximum": 24,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at most 24 character(s)",
    "path": [
      "username"
    ]
  }
]`,
    ],
    [
      "username with a space",
      { username: "bad name", password: long(8) },
      `[
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Use letters, numbers, dashes, or underscores.",
    "path": [
      "username"
    ]
  }
]`,
    ],
    [
      "short username with a bad character reports both",
      { username: "a!", password: long(8) },
      `[
  {
    "code": "too_small",
    "minimum": 3,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 3 character(s)",
    "path": [
      "username"
    ]
  },
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Use letters, numbers, dashes, or underscores.",
    "path": [
      "username"
    ]
  }
]`,
    ],
    [
      "short password",
      { username: "player", password: long(7) },
      `[
  {
    "code": "too_small",
    "minimum": 8,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 8 character(s)",
    "path": [
      "password"
    ]
  }
]`,
    ],
    [
      "long password",
      { username: "player", password: long(73) },
      `[
  {
    "code": "too_big",
    "maximum": 72,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at most 72 character(s)",
    "path": [
      "password"
    ]
  }
]`,
    ],
    [
      "empty form",
      { username: "", password: "" },
      `[
  {
    "code": "too_small",
    "minimum": 3,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 3 character(s)",
    "path": [
      "username"
    ]
  },
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Use letters, numbers, dashes, or underscores.",
    "path": [
      "username"
    ]
  },
  {
    "code": "too_small",
    "minimum": 8,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 8 character(s)",
    "path": [
      "password"
    ]
  }
]`,
    ],
    [
      "missing password",
      { username: "player" },
      `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "password"
    ],
    "message": "Required"
  }
]`,
    ],
    [
      "numeric username",
      { username: 12345, password: long(8) },
      `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "username"
    ],
    "message": "Expected string, received number"
  }
]`,
    ],
    [
      "no input at all",
      undefined,
      `[
  {
    "code": "invalid_type",
    "expected": "object",
    "received": "undefined",
    "path": [],
    "message": "Required"
  }
]`,
    ],
  ];

  for (const [name, input, message] of invalid) {
    test(`register rejects ${name}`, async () => {
      await assertInvalid(anonymous().auth.register(input as never), message);
    });
    test(`login rejects ${name}`, async () => {
      await assertInvalid(anonymous().auth.login(input as never), message);
    });
  }

  test("profile accepts an empty object and an id", async () => {
    assert.equal((await signedIn().auth.profile({})).username, "validator");
    await assert.rejects(signedIn().auth.profile({ userId: "nobody" }), /User not found\./);
  });

  test("profile rejects a numeric id", async () => {
    await assertInvalid(
      signedIn().auth.profile({ userId: 5 } as never),
      `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "userId"
    ],
    "message": "Expected string, received number"
  }
]`,
    );
  });

  test("validation runs after the sign-in check", async () => {
    const error = await rejection(anonymous().auth.profile({ userId: 5 } as never));
    assert.equal(error.code, "UNAUTHORIZED");
  });
});

describe("lobby input", () => {
  test("create trims the name and defaults to untimed", async () => {
    const { slug } = await signedIn().lobby.create({ name: "  Friday Blitz  ", color: "white" });
    assert.match(slug, /^friday-blitz-[0-9a-f]{6}$/);
    const game = await signedIn().game.bySlug({ slug: `  ${slug}  ` });
    assert.equal(game.name, "Friday Blitz");
    assert.deepEqual(game.game.timeControl, { type: "untimed" });
    assert.equal(game.game.clock, null);
    assert.equal(game.viewer.color, "white");
  });

  test("create applies every time control", async () => {
    for (const timeControl of [
      "untimed",
      "1+0",
      "3+0",
      "3+2",
      "5+0",
      "5+3",
      "10+0",
      "15+10",
      "30+0",
    ] as const) {
      const { slug } = await signedIn().lobby.create({
        name: "Clock test",
        color: "random",
        timeControl,
      });
      const game = await signedIn().game.bySlug({ slug });
      if (timeControl === "untimed") {
        assert.deepEqual(game.game.timeControl, { type: "untimed" });
      } else {
        const [minutes, increment] = timeControl.split("+").map(Number);
        assert.deepEqual(game.game.timeControl, {
          type: "timed",
          initialMs: minutes * 60_000,
          incrementMs: increment * 1_000,
        });
      }
      assert.notEqual(game.viewer.color, "none");
    }
  });

  const invalid: Array<[string, unknown, string]> = [
    [
      "short name",
      { name: "  ab ", color: "white" },
      `[
  {
    "code": "too_small",
    "minimum": 3,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 3 character(s)",
    "path": [
      "name"
    ]
  }
]`,
    ],
    [
      "long name",
      { name: long(41), color: "white" },
      `[
  {
    "code": "too_big",
    "maximum": 40,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at most 40 character(s)",
    "path": [
      "name"
    ]
  }
]`,
    ],
    [
      "unknown color",
      { name: "Game", color: "green" },
      `[
  {
    "received": "green",
    "code": "invalid_enum_value",
    "options": [
      "white",
      "black",
      "random"
    ],
    "path": [
      "color"
    ],
    "message": "Invalid enum value. Expected 'white' | 'black' | 'random', received 'green'"
  }
]`,
    ],
    [
      "unknown time control",
      { name: "Game", color: "white", timeControl: "2+1" },
      `[
  {
    "received": "2+1",
    "code": "invalid_enum_value",
    "options": [
      "untimed",
      "1+0",
      "3+0",
      "3+2",
      "5+0",
      "5+3",
      "10+0",
      "15+10",
      "30+0"
    ],
    "path": [
      "timeControl"
    ],
    "message": "Invalid enum value. Expected 'untimed' | '1+0' | '3+0' | '3+2' | '5+0' | '5+3' | '10+0' | '15+10' | '30+0', received '2+1'"
  }
]`,
    ],
    [
      "null time control",
      { name: "Game", color: "white", timeControl: null },
      `[
  {
    "expected": "'untimed' | '1+0' | '3+0' | '3+2' | '5+0' | '5+3' | '10+0' | '15+10' | '30+0'",
    "received": "null",
    "code": "invalid_type",
    "path": [
      "timeControl"
    ],
    "message": "Expected 'untimed' | '1+0' | '3+0' | '3+2' | '5+0' | '5+3' | '10+0' | '15+10' | '30+0', received null"
  }
]`,
    ],
    [
      "missing color",
      { name: "Game" },
      `[
  {
    "expected": "'white' | 'black' | 'random'",
    "received": "undefined",
    "code": "invalid_type",
    "path": [
      "color"
    ],
    "message": "Required"
  }
]`,
    ],
  ];

  for (const [name, input, message] of invalid) {
    test(`create rejects ${name}`, async () => {
      await assertInvalid(signedIn().lobby.create(input as never), message);
    });
  }

  test("join and delete reject a blank slug", async () => {
    const message = `[
  {
    "code": "too_small",
    "minimum": 1,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 1 character(s)",
    "path": [
      "slug"
    ]
  }
]`;
    await assertInvalid(signedIn().lobby.join({ slug: "   " }), message);
    await assertInvalid(signedIn().lobby.delete({ slug: "" }), message);
  });

  test("join and delete trim the slug", async () => {
    const { slug } = await signedIn().lobby.create({ name: "Trim slug", color: "black" });
    assert.deepEqual(await signedIn().lobby.join({ slug: ` ${slug} ` }), { slug });
    assert.deepEqual(await signedIn().lobby.delete({ slug: ` ${slug} ` }), { success: true });
  });
});

describe("game input", () => {
  let slug = "";
  before(async () => {
    ({ slug } = await signedIn().lobby.create({ name: "Validation game", color: "white" }));
  });

  test("slug procedures reject a missing slug", async () => {
    const message = `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "slug"
    ],
    "message": "Required"
  }
]`;
    await assertInvalid(signedIn().game.bySlug({} as never), message);
    for (const name of [
      "proposeUndo",
      "revertUndo",
      "acceptUndo",
      "proposeDraw",
      "acceptDraw",
      "rejectDraw",
      "forfeit",
      "rematch",
      "heartbeat",
    ] as const) {
      await assertInvalid(signedIn().game[name]({} as never), message);
    }
  });

  test("unknown slugs pass validation and are not found", async () => {
    const error = await rejection(signedIn().game.bySlug({ slug: "no-such-game" }));
    assert.equal(error.code, "NOT_FOUND");
  });

  const invalidMoves: Array<[string, unknown, string]> = [
    [
      "lowercase square",
      { from: "a2", to: "A3" },
      `[
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Invalid",
    "path": [
      "from"
    ]
  }
]`,
    ],
    [
      "off-board squares",
      { from: "I2", to: "A9" },
      `[
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Invalid",
    "path": [
      "from"
    ]
  },
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Invalid",
    "path": [
      "to"
    ]
  }
]`,
    ],
    [
      "padded square",
      { from: " A2", to: "A3" },
      `[
  {
    "validation": "regex",
    "code": "invalid_string",
    "message": "Invalid",
    "path": [
      "from"
    ]
  }
]`,
    ],
    [
      "missing target",
      { from: "A2" },
      `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "to"
    ],
    "message": "Required"
  }
]`,
    ],
  ];

  for (const [name, input, message] of invalidMoves) {
    test(`move rejects ${name}`, async () => {
      await assertInvalid(signedIn().game.move({ slug, ...(input as object) } as never), message);
    });
  }

  test("move passes a well-formed square to the rules", async () => {
    assert.deepEqual(await signedIn().game.move({ slug, from: "A2", to: "A3" }), {
      success: true,
      promotion: false,
    });
    const error = await rejection(signedIn().game.move({ slug, from: "A3", to: "A8" }));
    assert.equal(error.code, "BAD_REQUEST");
    assert.doesNotMatch(error.message, /invalid_string/);
  });

  test("promote rejects king and pawn", async () => {
    for (const pieceType of ["king", "pawn"]) {
      await assertInvalid(
        signedIn().game.promote({ slug, pieceType } as never),
        `[
  {
    "received": "${pieceType}",
    "code": "invalid_enum_value",
    "options": [
      "queen",
      "rook",
      "bishop",
      "knight"
    ],
    "path": [
      "pieceType"
    ],
    "message": "Invalid enum value. Expected 'queen' | 'rook' | 'bishop' | 'knight', received '${pieceType}'"
  }
]`,
      );
    }
  });

  test("sendMessage trims the text", async () => {
    await signedIn().game.sendMessage({ slug, text: "  good luck  " });
    const game = await signedIn().game.bySlug({ slug });
    assert.equal(game.game.messages.at(-1)?.text, "good luck");
    await signedIn().game.sendMessage({ slug, text: long(300) });
  });

  test("sendMessage rejects blank and long text", async () => {
    await assertInvalid(
      signedIn().game.sendMessage({ slug, text: "   " }),
      `[
  {
    "code": "too_small",
    "minimum": 1,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 1 character(s)",
    "path": [
      "text"
    ]
  }
]`,
    );
    await assertInvalid(
      signedIn().game.sendMessage({ slug, text: long(301) }),
      `[
  {
    "code": "too_big",
    "maximum": 300,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at most 300 character(s)",
    "path": [
      "text"
    ]
  }
]`,
    );
  });
});
