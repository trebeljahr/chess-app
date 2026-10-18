import assert from "node:assert/strict";
import { test } from "node:test";
import { compare } from "bcrypt";

// Written by bcryptjs 3 ($2b$) before the switch to native bcrypt; older
// bcryptjs releases wrote the same digest with a $2a$ prefix.
const STORED = [
  ["correct horse battery", "$2b$04$lFtyyeG/QpPymI2dkbvt8.D32gK4.AOFNW.JebUBFRzOY66B6JxUu"],
  ["correct horse battery", "$2a$04$lFtyyeG/QpPymI2dkbvt8.D32gK4.AOFNW.JebUBFRzOY66B6JxUu"],
  ["pässwörd-☃-ü", "$2b$04$czzLnmPGBOPHHow8Rp9oXupwOkVOTZfmdP.5idJFuBE5iZ6RgDNWS"],
  ["pässwörd-☃-ü", "$2a$04$czzLnmPGBOPHHow8Rp9oXupwOkVOTZfmdP.5idJFuBE5iZ6RgDNWS"],
] as const;

test("native bcrypt verifies hashes stored by bcryptjs", async () => {
  for (const [password, stored] of STORED) {
    assert.equal(await compare(password, stored), true, stored);
    assert.equal(await compare(`${password}!`, stored), false, stored);
  }
});
