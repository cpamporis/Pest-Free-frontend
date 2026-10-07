function resolveTarget(target, origin) {
  if (target !== "hetzner-dr-test") throw new Error("This branch is for the isolated Hetzner test only");
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.origin !== origin || url.hostname === "api.pestify.gr" || url.hostname.endsWith(".railway.app")) throw new Error("Dedicated Hetzner HTTPS origin required");
  return url.origin;
}
module.exports = { resolveTarget };
