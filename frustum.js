// frustum.js：视口矩形相交裁剪
export const EMPTY_VIEW_CODE = "E_EMPTY_VIEW";

export function assertView(view) {
  if (!view || !(view.w > 0) || !(view.h > 0)) {
    const error = new Error(EMPTY_VIEW_CODE);
    error.code = EMPTY_VIEW_CODE;
    throw error;
  }
}

export function intersectsView(obj, view) {
  return obj.x < view.x + view.w && obj.x + obj.w > view.x &&
         obj.y < view.y + view.h && obj.y + obj.h > view.y;
}

export function cull(objects, view) {
  assertView(view);
  const inside = [];
  const outside = [];
  for (const obj of objects) {
    (intersectsView(obj, view) ? inside : outside).push(obj.id);
  }
  return { inside, outside };
}
