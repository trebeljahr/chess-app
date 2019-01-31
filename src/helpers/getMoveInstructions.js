export function getMoveInstructions(figure) {
  switch (figure) {
    case "king":
      return {
        allowedDirections: {
          up: [-1, 0],
          down: [+1, 0],
          right: [0, +1],
          left: [0, -1],
          "diagonal-1": [-1, -1],
          "diagonal-2": [+1, +1],
          "diagonal-3": [-1, +1],
          "diagonal-4": [+1, -1]
        },
        maxDistance: 1
      };
    case "queen":
      return {
        allowedDirections: {
          up: [-1, 0],
          down: [+1, 0],
          right: [0, +1],
          left: [0, -1],
          "diagonal-1": [-1, -1],
          "diagonal-2": [+1, +1],
          "diagonal-3": [-1, +1],
          "diagonal-4": [+1, -1]
        },
        maxDistance: 8
      };
    case "bishop":
      return {
        allowedDirections: {
          "diagonal-1": [-1, -1],
          "diagonal-2": [+1, +1],
          "diagonal-3": [-1, +1],
          "diagonal-4": [+1, -1]
        },
        maxDistance: 8
      };
    case "knight":
      return {
        allowedDirections: {
          "1": [-1, -2],
          "2": [-1, +2],
          "3": [+2, +1],
          "4": [+2, -1],
          "5": [+1, -2],
          "6": [+1, +2],
          "7": [-2, +1],
          "8": [-2, -1]
        },
        maxDistance: 1
      };
    case "rook":
      return {
        allowedDirections: {
          up: [-1, 0],
          down: [+1, 0],
          right: [0, +1],
          left: [0, -1]
        },
        maxDistance: 8
      };
    default:
      break;
  }
}
