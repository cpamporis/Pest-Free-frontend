const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeAdminSession,
  validateRefreshedSession,
  remainingSessionSeconds
} = require("../src/security/adminSessionPolicy");
const {
  normalizeMfaFlow,
  initialMfaStep
} = require("../src/security/adminMfaUiPolicy");

const NOW = Date.parse("2026-09-13T12:00:00.000Z");

function session(overrides = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    accessTokenExpiresAt: "2026-09-13T12:15:00.000Z",
    absoluteExpiresAt: "2026-09-13T20:00:00.000Z",
    refreshVersion: 0,
    ...overrides
  };
}

test("normalizes a valid administrator session", () => {
  const result = normalizeAdminSession("admin", session(), NOW);

  assert.equal(result.role, "admin");
  assert.equal(result.refreshVersion, 0);
  assert.equal(result.accessExpiresAtMs, NOW + 15 * 60 * 1000);
});

test("rejects non-admin roles and expired or inverted windows", () => {
  assert.throws(() =>
    normalizeAdminSession("tech", session(), NOW)
  );
  assert.throws(() =>
    normalizeAdminSession(
      "admin",
      session({ accessTokenExpiresAt: "2026-09-13T11:59:59Z" }),
      NOW
    )
  );
  assert.throws(() =>
    normalizeAdminSession(
      "admin",
      session({ absoluteExpiresAt: "2026-09-13T12:10:00Z" }),
      NOW
    )
  );
});

test("accepts only a rotation of the same immutable session", () => {
  const current = normalizeAdminSession("admin", session(), NOW);
  const refreshed = validateRefreshedSession(
    current,
    "admin",
    session({
      accessTokenExpiresAt: "2026-09-13T12:16:00.000Z",
      refreshVersion: 1
    }),
    NOW + 60 * 1000
  );

  assert.equal(refreshed.id, current.id);
  assert.equal(refreshed.refreshVersion, 1);

  assert.throws(() =>
    validateRefreshedSession(
      current,
      "admin",
      session({ refreshVersion: 0 }),
      NOW
    )
  );
  assert.throws(() =>
    validateRefreshedSession(
      current,
      "admin",
      session({
        id: "00000000-0000-4000-8000-000000000002",
        refreshVersion: 1
      }),
      NOW
    )
  );
  assert.throws(() =>
    validateRefreshedSession(
      current,
      "admin",
      session({
        absoluteExpiresAt: "2026-09-13T20:00:01.000Z",
        refreshVersion: 1
      }),
      NOW
    )
  );
});

test("countdown follows the server deadline and never goes negative", () => {
  const normalized = normalizeAdminSession("super_admin", session(), NOW);

  assert.equal(remainingSessionSeconds(normalized, NOW), 900);
  assert.equal(
    remainingSessionSeconds(normalized, NOW + 899500),
    1
  );
  assert.equal(
    remainingSessionSeconds(normalized, NOW + 901000),
    0
  );
});

test("all valid administrator MFA challenges route to the MFA screen", () => {
  const token = "A".repeat(43);
  const adminOffer = normalizeMfaFlow(
    {
      success: true,
      role: "admin",
      mfaAction: "enrollment_offer",
      challengeToken: token,
      canSkipMfa: true
    },
    "ADMIN@example.com"
  );
  const adminLogin = normalizeMfaFlow({
    success: true,
    role: "admin",
    mfaAction: "login_challenge",
    challengeToken: token,
    canSkipMfa: true
  });
  const superEnrollment = normalizeMfaFlow({
    success: true,
    role: "super_admin",
    mfaAction: "enrollment_challenge",
    challengeToken: token,
    canSkipMfa: true
  });

  assert.equal(initialMfaStep(adminOffer), "offer");
  assert.equal(adminOffer.canSkipMfa, true);
  assert.equal(adminOffer.deviceAccount, "admin@example.com");
  assert.equal(initialMfaStep(adminLogin), "verify");
  assert.equal(adminLogin.canSkipMfa, false);
  assert.equal(initialMfaStep(superEnrollment), "offer");
  assert.equal(superEnrollment.canSkipMfa, false);
});

test("super admins cannot receive an optional MFA offer", () => {
  assert.throws(() =>
    normalizeMfaFlow({
      success: true,
      role: "super_admin",
      mfaAction: "enrollment_offer",
      challengeToken: "B".repeat(43),
      canSkipMfa: true
    })
  );
});
