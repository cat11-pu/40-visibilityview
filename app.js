// app.js：渲染结果
import { cull } from "./frustum.js";
import { occlude } from "./occlusion.js";

export function render(spec) {
  const cut = cull(spec.objects, spec.view);
  const hidden = occlude(spec.objects, spec.view, spec.last_frame || [], spec.budget);
  return { visible: cut.inside.filter((id) => !hidden.occluded.includes(id)),
           culled: cut.outside, occluded: hidden.occluded, reused: hidden.reused,
           budget_used: hidden.budget_used, false_culled: [] };
}
