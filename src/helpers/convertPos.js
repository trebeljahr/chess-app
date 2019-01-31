export function convertPos(pos) {
  return { row: 8 - pos[1], col: pos.charCodeAt(0) - 65 };
}
