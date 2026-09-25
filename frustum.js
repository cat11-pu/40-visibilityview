// frustum.js：裁剪（基线：不做裁剪，全部通过）
export function cull(objects, view) {
  return { inside: objects.map((item) => item.id), outside: [] };
}
