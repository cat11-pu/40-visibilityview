import assert from "node:assert";
import { cull } from "../frustum.js";
import { occlude } from "../occlusion.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const objects = [{ id: "o0", x: 0, y: 0, w: 2, h: 2, depth: 1 }];
const view = { x: 0, y: 0, w: 10, h: 10 };

check("cull returns inside list", () => {
  assert.ok(Array.isArray(cull(objects, view).inside));
});

check("cull returns outside list", () => {
  assert.ok(Array.isArray(cull(objects, view).outside));
});

check("occlude returns occluded list", () => {
  assert.ok(Array.isArray(occlude(objects, view, [], 2).occluded));
});

check("occlude reports budget_used", () => {
  assert.strictEqual(typeof occlude(objects, view, [], 2).budget_used, "number");
});

check("render exposes false_culled", () => {
  assert.ok(Array.isArray(render({ objects: objects, view: view, last_frame: [], budget: 2 }).false_culled));
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
