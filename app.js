// app.js：渲染结果
import { cull } from "./frustum.js";
import { occlude, fullyCovers } from "./occlusion.js";

export function render(spec) {
  const objects = spec.objects;
  const cut = cull(objects, spec.view);
  const hidden = occlude(objects, spec.view, spec.last_frame || [], spec.budget);
  const occludedSet = new Set(hidden.occluded);
  // 不变量自检：被剔对象必须确实被某个更近的对象完全覆盖，否则计入误剔。
  const false_culled = [];
  for (const item of objects) {
    if (!occludedSet.has(item.id)) continue;
    const covered = objects.some((other) =>
      other !== item && other.depth < item.depth && fullyCovers(other, item));
    if (!covered) false_culled.push(item.id);
  }
  return { visible: cut.inside.filter((id) => !occludedSet.has(id)),
           culled: cut.outside, occluded: hidden.occluded, reused: hidden.reused,
           budget_used: hidden.budget_used, false_culled: false_culled };
}
