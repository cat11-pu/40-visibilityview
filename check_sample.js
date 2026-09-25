import fs from "node:fs";
import { cull } from "./frustum.js";
import { occlude } from "./occlusion.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/scene.json", "utf8"));
const cut = cull(spec.objects, spec.view);
const hidden = occlude(spec.objects, spec.view, spec.last_frame || [], spec.budget, spec.occluders || []);
const out = render(spec);

emit("视口内的对象 =", cut.inside);
emit("被裁剪掉的对象 =", cut.outside);
emit("被遮挡剔除的对象 =", hidden.occluded);
emit("复用的上帧结果 =", hidden.reused);
emit("预算消耗 =", hidden.budget_used);
emit("最终可见 =", out.visible);
emit("误剔的对象 =", out.false_culled);
emit("视口无效的错误码 =", spec.empty_view_code);


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "视口内的对象": [
    "o0",
    "o1",
    "o2",
    "o3",
    "o4"
  ],
  "被裁剪掉的对象": [],
  "被遮挡剔除的对象": [
    "o0",
    "o4"
  ],
  "复用的上帧结果": [
    "o2"
  ],
  "预算消耗": 3,
  "最终可见": [
    "o1",
    "o2",
    "o3"
  ],
  "误剔的对象": [],
  "视口无效的错误码": "E_EMPTY_VIEW"
};
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (JSON.stringify(got) === JSON.stringify(want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
