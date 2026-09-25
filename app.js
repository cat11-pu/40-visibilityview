// app.js：渲染结果
import { cull, intersectsView } from "./frustum.js";
import { occlude } from "./occlusion.js";

function trulyOccluded(obj, view, occluders) {
  if (!intersectsView(obj, view)) return false;
  const depth = obj.depth == null ? -Infinity : obj.depth;
  return occluders.some((oc) => {
    const ocDepth = oc.depth == null ? Infinity : oc.depth;
    return ocDepth < depth &&
           oc.x <= obj.x && oc.y <= obj.y &&
           oc.x + oc.w >= obj.x + obj.w && oc.y + oc.h >= obj.y + obj.h;
  });
}

export function render(spec) {
  const occluders = spec.occluders || [];
  const cut = cull(spec.objects, spec.view);
  const hidden = occlude(spec.objects, spec.view, spec.last_frame || [], spec.budget, occluders);
  const occludedSet = new Set(hidden.occluded);
  const byId = new Map(spec.objects.map((obj) => [obj.id, obj]));
  return { visible: cut.inside.filter((id) => !occludedSet.has(id)),
           culled: cut.outside, occluded: hidden.occluded, reused: hidden.reused,
           budget_used: hidden.budget_used,
           false_culled: hidden.occluded.filter((id) => {
             const obj = byId.get(id);
             return !obj || !trulyOccluded(obj, spec.view, occluders);
           }) };
}
