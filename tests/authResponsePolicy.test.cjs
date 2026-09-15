const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isValidAuthenticatedPrincipal
} = require("../src/security/authResponsePolicy");

const token = "header.payload.signature";

test("administrator authentication requires a server session", () => {
  assert.equal(
    isValidAuthenticatedPrincipal({
      success: true,
      role: "admin",
      token,
      session: { id: "session-id" }
    }),
    true
  );

  assert.equal(
    isValidAuthenticatedPrincipal({
      success: true,
      role: "super_admin",
      token
    }),
    false
  );
});

test("technician and customer authentication require their principal", () => {
  assert.equal(
    isValidAuthenticatedPrincipal({
      success: true,
      role: "tech",
      token,
      technician: { id: "technician-id" }
    }),
    true
  );

  assert.equal(
    isValidAuthenticatedPrincipal({
      success: true,
      role: "customer",
      token,
      customer: { customerId: "customer-id" }
    }),
    true
  );

  assert.equal(
    isValidAuthenticatedPrincipal({
      success: true,
      role: "tech",
      token
    }),
    false
  );
});

test("unknown roles and malformed tokens fail closed", () => {
  for (const result of [
    { success: true, role: "owner", token },
    { success: true, role: "admin", token: "not-a-jwt", session: {} },
    { success: false, role: "admin", token, session: {} },
    null
  ]) {
    assert.equal(isValidAuthenticatedPrincipal(result), false);
  }
});
