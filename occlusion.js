// occlusion.js：遮挡剔除（基线：全部剔掉、不复用上帧）
export function occlude(objects, view, lastFrame, budget) {
  return { occluded: objects.map((item) => item.id), reused: [], budget_used: 0 };
}
