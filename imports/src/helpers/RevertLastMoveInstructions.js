export function RevertLastMoveInstructions(moveHistory) {
  let oldMove = moveHistory.pop();
  let backwardsMove = {
    oldPos: oldMove.newPos,
    newPos: oldMove.oldPos,
    figure: oldMove.figure,
    secondFigure: oldMove.secondFigure
  };
  if (oldMove.rochadeRook) {
    backwardsMove.rochadeRook = {
      oldPos: oldMove.rochadeRook.newPos,
      newPos: oldMove.rochadeRook.oldPos,
      figure: oldMove.rochadeRook.figure,
      secondFigure: "noFigure"
    };
  }
  if (oldMove.enPassen) {
    backwardsMove.enPassen = oldMove.enPassen;
  }
  return backwardsMove;
}
