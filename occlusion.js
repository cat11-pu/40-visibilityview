// occlusion.js：保守遮挡剔除（只剔被更近遮挡物完全覆盖的对象）
import { assertView, intersectsView } from "./frustum.js";

function toOccluder(raw) {
  return { x: raw.x, y: raw.y, x2: raw.x + raw.w, y2: raw.y + raw.h,
           depth: raw.depth == null ? Infinity : raw.depth };
}

export function occlude(objects, view, lastFrame, budget, occluders) {
  assertView(view);
  const occ = (occluders || []).map(toOccluder); // 遮挡结构只建一次，不随对象重建
  const limit = budget == null ? Infinity : Math.max(0, budget);
  let budgetUsed = 0;
  const occluded = [];
  const occludedSet = new Set();
  const insideIds = [];

  for (const obj of objects) {
    if (!intersectsView(obj, view)) continue;
    insideIds.push(obj.id);
    if (budgetUsed >= limit) continue; // 预算用完：保守保留，不剔
    const objDepth = obj.depth == null ? -Infinity : obj.depth;
    const ox2 = obj.x + obj.w;
    const oy2 = obj.y + obj.h;
    let touched = false;
    let covered = false;
    for (const oc of occ) { // 每个对象最多与遮挡物列表比较一轮
      if (oc.x >= ox2 || oc.x2 <= obj.x || oc.y >= oy2 || oc.y2 <= obj.y) continue;
      touched = true;
      if (oc.depth < objDepth &&
          oc.x <= obj.x && oc.y <= obj.y && oc.x2 >= ox2 && oc.y2 >= oy2) {
        covered = true;
        break;
      }
    }
    if (touched) budgetUsed += 1;
    if (covered) { occluded.push(obj.id); occludedSet.add(obj.id); }
  }

  const lastSet = new Set(lastFrame || []);
  const reused = insideIds.filter((id) => lastSet.has(id) && !occludedSet.has(id));
  return { occluded: occluded, reused: reused, budget_used: budgetUsed };
}
