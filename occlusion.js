// occlusion.js：保守遮挡剔除。只有对象被某个深度更小（更靠近观察者）的
// 遮挡物完全覆盖时才剔除；遮挡网格只建一次，每个对象最多查询一次。
import { assertView, cull } from "./frustum.js";

const GRID_COLS = 64;
const GRID_ROWS = 64;

// a 是否完全覆盖 b（含边界重合）
export function fullyCovers(a, b) {
  return a.x <= b.x && a.y <= b.y &&
         a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;
}

function clampCell(value, max) {
  return value < 0 ? 0 : value > max ? max : value;
}

// 一次性把全部对象注册进均匀网格，之后每个对象只查询、不重建。
function buildIndex(objects, view) {
  const cellW = view.w / GRID_COLS;
  const cellH = view.h / GRID_ROWS;
  const cells = new Map();
  objects.forEach((item, i) => {
    const x0 = clampCell(Math.floor((item.x - view.x) / cellW), GRID_COLS - 1);
    const y0 = clampCell(Math.floor((item.y - view.y) / cellH), GRID_ROWS - 1);
    const x1 = clampCell(Math.floor((item.x + item.w - view.x) / cellW), GRID_COLS - 1);
    const y1 = clampCell(Math.floor((item.y + item.h - view.y) / cellH), GRID_ROWS - 1);
    for (let cy = y0; cy <= y1; cy += 1) {
      for (let cx = x0; cx <= x1; cx += 1) {
        const key = cy * GRID_COLS + cx;
        let bucket = cells.get(key);
        if (!bucket) { bucket = []; cells.set(key, bucket); }
        bucket.push(i);
      }
    }
  });
  return { cells, cellW, cellH, stamp: new Uint32Array(objects.length), generation: 0 };
}

// 是否存在另一个对象：深度严格更小且完全覆盖 target
function isOccluded(target, targetIndex, objects, index, view) {
  index.generation += 1;
  const x0 = clampCell(Math.floor((target.x - view.x) / index.cellW), GRID_COLS - 1);
  const y0 = clampCell(Math.floor((target.y - view.y) / index.cellH), GRID_ROWS - 1);
  const x1 = clampCell(Math.floor((target.x + target.w - view.x) / index.cellW), GRID_COLS - 1);
  const y1 = clampCell(Math.floor((target.y + target.h - view.y) / index.cellH), GRID_ROWS - 1);
  for (let cy = y0; cy <= y1; cy += 1) {
    for (let cx = x0; cx <= x1; cx += 1) {
      const bucket = index.cells.get(cy * GRID_COLS + cx);
      if (!bucket) continue;
      for (const i of bucket) {
        if (i === targetIndex || index.stamp[i] === index.generation) continue;
        index.stamp[i] = index.generation;
        const other = objects[i];
        if (other.depth < target.depth && fullyCovers(other, target)) return true;
      }
    }
  }
  return false;
}

export function occlude(objects, view, lastFrame, budget) {
  assertView(view);
  const limit = budget == null ? Infinity : Math.max(0, budget);
  const { inside } = cull(objects, view);
  const insideSet = new Set(inside);

  // 上帧结果里仍在视口内的直接复用，不耗预算、不参与剔除（保守方向）。
  const reused = [];
  const reusedSet = new Set();
  for (const id of lastFrame || []) {
    if (insideSet.has(id) && !reusedSet.has(id)) {
      reused.push(id);
      reusedSet.add(id);
    }
  }

  const index = buildIndex(objects, view);
  // 远的对象更可能被遮挡，预算优先花在它们身上；sort 稳定，顺序确定。
  const candidates = objects
    .map((item, i) => ({ item, i }))
    .filter((entry) => insideSet.has(entry.item.id) && !reusedSet.has(entry.item.id))
    .sort((a, b) => b.item.depth - a.item.depth);

  const occludedSet = new Set();
  let budgetUsed = 0;
  for (const { item, i } of candidates) {
    if (budgetUsed >= limit) break;
    budgetUsed += 1;
    if (isOccluded(item, i, objects, index, view)) occludedSet.add(item.id);
  }

  const occluded = objects.filter((item) => occludedSet.has(item.id)).map((item) => item.id);
  return { occluded, reused, budget_used: budgetUsed };
}
