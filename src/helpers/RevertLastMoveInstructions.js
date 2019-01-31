export function RevertLastMoveInstructions(moveHistory) {
  let oldMove = moveHistory.pop();
  let backwardsMove = {
    oldPos: oldMove.newPos,
    newPos: oldMove.oldPos,
    figure: oldMove.figure
  };
  return backwardsMove;
}
