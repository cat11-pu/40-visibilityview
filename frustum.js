// frustum.js：按矩形相交做视口裁剪
export const EMPTY_VIEW_CODE = "E_EMPTY_VIEW";

export function assertView(view) {
  if (!view || !(view.w > 0) || !(view.h > 0)) {
    const error = new Error("view is empty");
    error.code = EMPTY_VIEW_CODE;
    throw error;
  }
}

export function intersects(rect, view) {
  return rect.x < view.x + view.w && rect.x + rect.w > view.x &&
         rect.y < view.y + view.h && rect.y + rect.h > view.y;
}

export function cull(objects, view) {
  assertView(view);
  const inside = [];
  const outside = [];
  for (const item of objects) {
    (intersects(item, view) ? inside : outside).push(item.id);
  }
  return { inside, outside };
}
