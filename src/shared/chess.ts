export type PieceColor = "white" | "black";
export type ViewerColor = PieceColor | "none";
export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";

export interface Piece {
  color: PieceColor;
  type: PieceType;
}

export type Figure = Piece | "noFigure";

export interface Position {
  row: number;
  col: number;
}

export interface Tile {
  field: string;
  color: "white-tile" | "black-tile";
  check: "" | "check";
  valid: "" | "valid";
  selected: "" | "selected";
  rochade: "" | "rochade";
  enpassen: "" | "enpassen";
  figure: Figure;
}

export type Board = Tile[][];

export interface GameUser {
  userId: string;
  name: string;
  color: ViewerColor;
  timeStamp: number;
}

export interface GameMessage {
  id: string;
  text: string;
  user: string;
  createdAt: number;
}

export interface ChessMove {
  figure: Piece;
  oldPos: Position;
  newPos: Position;
  secondFigure: Figure;
  rochadeRook?: ChessMove;
  enPassen?: {
    figure: Piece;
    pos: Position;
  };
}

export type MoveHistoryEntry =
  | { kind: "start" }
  | { kind: "forfeit"; color: PieceColor }
  | ChessMove;

export interface GameState {
  board: Board;
  turn: PieceColor;
  movePart: 0 | 1;
  moveHistory: MoveHistoryEntry[];
  check: boolean;
  checkmate: boolean;
  remis: boolean;
  offerTakeback: false | PieceColor;
  baseLinePawn: false | Position;
  users: GameUser[];
  archived: boolean;
  oldBoards: Board[];
  timestamp: number;
  messages: GameMessage[];
  oldPos?: Position;
  figure?: Piece;
}

const START_ENTRY: MoveHistoryEntry = { kind: "start" };

const BOARD_SIZE = 8;

export function createDefaultGameState(): GameState {
  const board = generateBoard();

  return {
    board,
    turn: "white",
    movePart: 0,
    moveHistory: [START_ENTRY],
    check: false,
    checkmate: false,
    remis: false,
    offerTakeback: false,
    baseLinePawn: false,
    users: [],
    archived: false,
    oldBoards: [cloneBoard(board)],
    timestamp: Date.now(),
    messages: [
      {
        id: crypto.randomUUID(),
        text: "Please stay friendly in the chat!",
        user: "Chess-App",
        createdAt: Date.now()
      }
    ]
  };
}

export function cloneBoard(board: Board): Board {
  return structuredClone(board);
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function convertPos(field: string): Position {
  return {
    row: BOARD_SIZE - Number(field[1]),
    col: field.charCodeAt(0) - 65
  };
}

export function positionToField(position: Position): string {
  return `${String.fromCharCode(position.col + 65)}${BOARD_SIZE - position.row}`;
}

export function positionToLabel(position: Position): string {
  return `${String.fromCharCode(position.col + 65)}${position.row + 1}`;
}

export function invertColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

export function getViewerColor(state: GameState, userId: string): ViewerColor {
  return state.users.find((user) => user.userId === userId)?.color ?? "none";
}

export function formatMove(move: MoveHistoryEntry): string {
  if ("kind" in move) {
    if (move.kind === "forfeit") {
      return `${move.color} forfeits`;
    }
    return "Start";
  }

  return `${positionToLabel(move.oldPos)} -> ${positionToLabel(move.newPos)}`;
}

export function touchPlayer(state: GameState, userId: string): GameState {
  const nextState = cloneState(state);
  const user = nextState.users.find((item) => item.userId === userId);

  if (!user) {
    return state;
  }

  user.timeStamp = Date.now();
  nextState.timestamp = Date.now();
  return nextState;
}

export function addPlayerToGame(
  state: GameState,
  user: { userId: string; name: string; color: ViewerColor }
): GameState {
  const nextState = cloneState(state);

  if (nextState.users.some((item) => item.userId === user.userId)) {
    return touchPlayer(nextState, user.userId);
  }

  nextState.users.push({
    ...user,
    timeStamp: Date.now()
  });
  nextState.timestamp = Date.now();

  return nextState;
}

export function addChatMessage(
  state: GameState,
  message: Pick<GameMessage, "text" | "user">
): GameState {
  const nextState = cloneState(state);
  nextState.messages.push({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...message
  });
  nextState.timestamp = Date.now();
  return nextState;
}

export function executeMove(
  state: GameState,
  userId: string,
  from: string,
  to: string
): { state: GameState; promotion: boolean } {
  const user = state.users.find((item) => item.userId === userId);

  if (!user || user.color === "none") {
    throw new Error("Not allowed to move: no valid player.");
  }

  if (state.archived) {
    throw new Error("Not allowed to move: game is archived.");
  }

  if (state.baseLinePawn) {
    throw new Error("Not allowed to move: pawn promotion pending.");
  }

  if (state.turn !== user.color) {
    throw new Error(`Not your turn (turn: ${state.turn}, you: ${user.color}).`);
  }

  const nextState = cloneState(state);
  const fromPos = convertPos(from);
  const toPos = convertPos(to);
  const piece = nextState.board[fromPos.row][fromPos.col].figure;

  if (!isPiece(piece) || piece.color !== user.color) {
    throw new Error("No valid piece at source square.");
  }

  // Compute valid moves for the selected piece
  createFieldMarkers(
    nextState.board,
    fromPos.row,
    fromPos.col,
    "valid",
    false,
    nextState.moveHistory
  );

  if (!validateMove(nextState.board, toPos.row, toPos.col)) {
    throw new Error(
      `Illegal move: ${from} -> ${to} (piece: ${piece.color} ${piece.type})`
    );
  }

  const move = buildMove(
    nextState.board,
    piece,
    fromPos,
    toPos,
    nextState.moveHistory
  );

  const boardAfterMove = updateBoard(cloneBoard(nextState.board), move, false);
  const history = [...nextState.moveHistory, move];

  // Pawn promotion
  if (
    move.figure.type === "pawn" &&
    (move.newPos.row === 0 || move.newPos.row === BOARD_SIZE - 1)
  ) {
    nextState.board = boardAfterMove;
    nextState.moveHistory = history;
    nextState.baseLinePawn = move.newPos;
    nextState.movePart = 0;
    nextState.oldPos = undefined;
    nextState.figure = undefined;
    nextState.timestamp = Date.now();
    return { state: nextState, promotion: true };
  }

  return {
    state: finalizeCommittedMove(nextState, boardAfterMove, history),
    promotion: false
  };
}

export function handleBoardClick(
  state: GameState,
  userId: string,
  field: string
): GameState {
  if (state.archived) {
    return state;
  }

  return state.movePart === 0
    ? handleFirstClick(state, userId, field)
    : handleSecondClick(state, userId, field);
}

export function handleFirstClick(
  state: GameState,
  userId: string,
  field: string
): GameState {
  const user = state.users.find((item) => item.userId === userId);

  if (!user || user.color === "none" || state.baseLinePawn) {
    return state;
  }

  const nextState = cloneState(state);
  const { row, col } = convertPos(field);
  const tile = nextState.board[row][col];

  if (
    nextState.turn === user.color &&
    isPiece(tile.figure) &&
    tile.figure.color === user.color
  ) {
    nextState.board = createFieldMarkers(
      nextState.board,
      row,
      col,
      "valid",
      false,
      nextState.moveHistory
    );
    nextState.movePart = 1;
    nextState.oldPos = { row, col };
    nextState.figure = tile.figure;
    nextState.timestamp = Date.now();
    return nextState;
  }

  return state;
}

export function handleSecondClick(
  state: GameState,
  userId: string,
  field: string
): GameState {
  const user = state.users.find((item) => item.userId === userId);

  if (!user || user.color === "none" || state.baseLinePawn) {
    return state;
  }

  const selectedFigure = state.figure;
  const selectedPosition = state.oldPos;

  if (!selectedFigure || !selectedPosition || state.turn !== user.color) {
    return state;
  }

  const nextState = cloneState(state);
  const { row, col } = convertPos(field);
  const tile = nextState.board[row][col];

  if (isPiece(tile.figure) && tile.figure.color === selectedFigure.color) {
    nextState.board = createFieldMarkers(
      nextState.board,
      row,
      col,
      "valid",
      false,
      nextState.moveHistory
    );
    nextState.movePart = 1;
    nextState.oldPos = { row, col };
    nextState.figure = tile.figure;
    nextState.timestamp = Date.now();
    return nextState;
  }

  if (!validateMove(nextState.board, row, col)) {
    nextState.board = removeMarkers(nextState.board, [
      "valid",
      "selected",
      "rochade",
      "enpassen"
    ]);
    nextState.movePart = 0;
    nextState.oldPos = undefined;
    nextState.figure = undefined;
    nextState.timestamp = Date.now();
    return nextState;
  }

  const move = buildMove(
    nextState.board,
    selectedFigure,
    selectedPosition,
    {
      row,
      col
    },
    nextState.moveHistory
  );

  const boardAfterMove = updateBoard(cloneBoard(nextState.board), move, false);
  const history = [...nextState.moveHistory, move];

  if (
    move.figure.type === "pawn" &&
    (move.newPos.row === 0 || move.newPos.row === BOARD_SIZE - 1)
  ) {
    nextState.board = boardAfterMove;
    nextState.moveHistory = history;
    nextState.baseLinePawn = move.newPos;
    nextState.movePart = 0;
    nextState.oldPos = undefined;
    nextState.figure = undefined;
    nextState.timestamp = Date.now();
    return nextState;
  }

  return finalizeCommittedMove(nextState, boardAfterMove, history);
}

export function handlePawnPromotion(
  state: GameState,
  userId: string,
  pieceType: Exclude<PieceType, "king" | "pawn">
): GameState {
  if (state.archived) {
    return state;
  }

  const user = state.users.find((item) => item.userId === userId);
  const promotionPosition = state.baseLinePawn;

  if (!user || user.color === "none" || !promotionPosition || state.turn !== user.color) {
    return state;
  }

  const nextState = cloneState(state);
  const { row, col } = promotionPosition;
  const tile = nextState.board[row][col];

  if (!isPiece(tile.figure)) {
    return state;
  }

  tile.figure.type = pieceType;
  return finalizeCommittedMove(nextState, nextState.board, nextState.moveHistory);
}

export function forfeitGame(state: GameState, userId: string): GameState {
  if (state.archived) {
    return state;
  }

  const user = state.users.find((item) => item.userId === userId);

  if (!user || user.color === "none") {
    return state;
  }

  const nextState = cloneState(state);
  nextState.moveHistory = [
    ...nextState.moveHistory,
    { kind: "forfeit", color: user.color }
  ];
  nextState.oldBoards = [...nextState.oldBoards, cloneBoard(nextState.board)];
  nextState.archived = true;
  nextState.timestamp = Date.now();
  return nextState;
}

export function proposeUndo(state: GameState, userId: string): GameState {
  if (state.archived) {
    return state;
  }

  const user = state.users.find((item) => item.userId === userId);

  if (!user || user.color === "none") {
    return state;
  }

  const nextState = cloneState(state);
  nextState.offerTakeback = user.color;
  nextState.timestamp = Date.now();
  return nextState;
}

export function revertUndoProposal(state: GameState, userId: string): GameState {
  if (state.archived) {
    return state;
  }

  const user = state.users.find((item) => item.userId === userId);

  if (!user || user.color === "none") {
    return state;
  }

  const nextState = cloneState(state);
  nextState.offerTakeback = false;
  nextState.timestamp = Date.now();
  return nextState;
}

export function handleUndo(state: GameState, userId: string): GameState {
  const user = state.users.find((item) => item.userId === userId);
  const lastMove = getLastMove(state.moveHistory);

  if (
    !user ||
    user.color === "none" ||
    !lastMove ||
    state.offerTakeback !== invertColor(user.color) ||
    state.oldBoards.length < 2
  ) {
    return state;
  }

  const previousBoard = cloneBoard(state.oldBoards[state.oldBoards.length - 2]);
  const previousTurn = invertColor(state.turn);
  const nextState = cloneState(state);

  nextState.board = refreshThreats(previousBoard, previousTurn);
  nextState.turn = previousTurn;
  nextState.moveHistory = nextState.moveHistory.slice(0, -1);
  nextState.oldBoards = nextState.oldBoards.slice(0, -1);
  nextState.check = checkForCheck(nextState.board, previousTurn);
  nextState.checkmate = false;
  nextState.remis = false;
  nextState.offerTakeback = false;
  nextState.baseLinePawn = false;
  nextState.movePart = 0;
  nextState.oldPos = undefined;
  nextState.figure = undefined;
  nextState.archived = false;
  nextState.timestamp = Date.now();
  return nextState;
}

export function goBackInTime(state: GameState, moveIndex: number): GameState {
  if (!state.archived || !state.oldBoards[moveIndex]) {
    return state;
  }

  const nextState = cloneState(state);
  nextState.board = cloneBoard(nextState.oldBoards[moveIndex]);
  removeMarkers(nextState.board, ["valid", "selected", "rochade", "enpassen"]);
  nextState.timestamp = Date.now();
  return nextState;
}

export function canDeleteGame(state: GameState, userId: string): boolean {
  return Boolean(
    state.users[0] &&
      state.users[0].userId === userId &&
      state.users.length === 1
  );
}

export function isUserInGame(state: GameState, userId: string): boolean {
  return state.users.some((user) => user.userId === userId);
}

export function getJoinColor(state: GameState): ViewerColor {
  if (state.users.length >= 2) {
    return "none";
  }

  return state.users[0]?.color === "white" ? "black" : "white";
}

export function pieceToGlyph(figure: Figure): string {
  if (!isPiece(figure)) {
    return "";
  }

  const glyphs: Record<PieceColor, Record<PieceType, string>> = {
    white: {
      king: "♔",
      queen: "♕",
      rook: "♖",
      bishop: "♗",
      knight: "♘",
      pawn: "♙"
    },
    black: {
      king: "♚",
      queen: "♛",
      rook: "♜",
      bishop: "♝",
      knight: "♞",
      pawn: "♟"
    }
  };

  return glyphs[figure.color][figure.type];
}

function finalizeCommittedMove(
  state: GameState,
  board: Board,
  moveHistory: MoveHistoryEntry[]
): GameState {
  const nextTurn = invertColor(state.turn);
  const cleanBoard = cloneBoard(board);
  removeMarkers(cleanBoard, ["valid", "selected", "rochade", "enpassen"]);
  const threatenedBoard = refreshThreats(cleanBoard, nextTurn);

  state.board = threatenedBoard;
  state.oldBoards = [...state.oldBoards, cloneBoard(threatenedBoard)];
  state.turn = nextTurn;
  state.check = checkForCheck(threatenedBoard, nextTurn);
  state.checkmate = checkForCheckMate(threatenedBoard, nextTurn, moveHistory);
  state.remis = !state.checkmate && checkForRemis(threatenedBoard, nextTurn, moveHistory);
  state.offerTakeback = false;
  state.movePart = 0;
  state.moveHistory = moveHistory;
  state.archived = state.checkmate || state.remis;
  state.baseLinePawn = false;
  state.oldPos = undefined;
  state.figure = undefined;
  state.timestamp = Date.now();
  return state;
}

function buildMove(
  board: Board,
  figure: Piece,
  oldPos: Position,
  newPos: Position,
  moveHistory: MoveHistoryEntry[]
): ChessMove {
  const targetTile = board[newPos.row][newPos.col];
  const move: ChessMove = {
    figure,
    oldPos,
    newPos,
    secondFigure: targetTile.figure
  };

  if (targetTile.rochade === "rochade") {
    move.rochadeRook = {
      figure: board[newPos.row][newPos.col === 6 ? 7 : 0].figure as Piece,
      oldPos: { row: newPos.row, col: newPos.col === 6 ? 7 : 0 },
      newPos: { row: newPos.row, col: newPos.col === 6 ? 5 : 3 },
      secondFigure: "noFigure"
    };
  }

  if (targetTile.enpassen === "enpassen") {
    const lastMove = getLastMove(moveHistory);

    if (lastMove) {
      move.enPassen = {
        figure: board[lastMove.newPos.row][lastMove.newPos.col].figure as Piece,
        pos: lastMove.newPos
      };
    }
  }

  return move;
}

function validateMove(board: Board, row: number, col: number): boolean {
  return board[row][col].valid === "valid";
}

function generateBoard(): Board {
  const board: Board = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    board.push([]);

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      board[row].push({
        field: `${String.fromCharCode(col + 65)}${BOARD_SIZE - row}`,
        color: (row + col + 1) % 2 ? "white-tile" : "black-tile",
        check: "",
        valid: "",
        selected: "",
        rochade: "",
        enpassen: "",
        figure: generateFigure(col, row)
      });
    }
  }

  return board;
}

function generateFigure(col: number, row: number): Figure {
  let color: PieceColor | undefined;
  let type: PieceType | undefined;

  switch (row) {
    case 1:
      type = "pawn";
      color = "black";
      break;
    case 0:
      color = "black";
      break;
    case 6:
      type = "pawn";
      color = "white";
      break;
    case 7:
      color = "white";
      break;
    default:
      break;
  }

  if (row === 7 || row === 0) {
    switch (col) {
      case 0:
      case 7:
        type = "rook";
        break;
      case 1:
      case 6:
        type = "knight";
        break;
      case 2:
      case 5:
        type = "bishop";
        break;
      case 3:
        type = "queen";
        break;
      case 4:
        type = "king";
        break;
      default:
        break;
    }
  }

  if (color && type) {
    return { color, type };
  }

  return "noFigure";
}

function getMoveInstructions(figure: PieceType) {
  switch (figure) {
    case "king":
      return {
        allowedDirections: [
          [-1, 0],
          [1, 0],
          [0, 1],
          [0, -1],
          [-1, -1],
          [1, 1],
          [-1, 1],
          [1, -1]
        ],
        maxDistance: 1
      };
    case "queen":
      return {
        allowedDirections: [
          [-1, 0],
          [1, 0],
          [0, 1],
          [0, -1],
          [-1, -1],
          [1, 1],
          [-1, 1],
          [1, -1]
        ],
        maxDistance: 8
      };
    case "bishop":
      return {
        allowedDirections: [
          [-1, -1],
          [1, 1],
          [-1, 1],
          [1, -1]
        ],
        maxDistance: 8
      };
    case "knight":
      return {
        allowedDirections: [
          [-1, -2],
          [-1, 2],
          [2, 1],
          [2, -1],
          [1, -2],
          [1, 2],
          [-2, 1],
          [-2, -1]
        ],
        maxDistance: 1
      };
    case "rook":
      return {
        allowedDirections: [
          [-1, 0],
          [1, 0],
          [0, 1],
          [0, -1]
        ],
        maxDistance: 8
      };
    default:
      return {
        allowedDirections: [],
        maxDistance: 0
      };
  }
}

function createFieldMarkers(
  board: Board,
  row: number,
  col: number,
  mark: "valid" | "check",
  virtual: boolean,
  moveHistory?: MoveHistoryEntry[]
): Board {
  const figure = board[row][col].figure;

  if (!isPiece(figure)) {
    return board;
  }

  if (mark === "valid" && !virtual) {
    removeMarkers(board, ["valid", "selected", "rochade", "enpassen"]);
    board[row][col].selected = "selected";
  }

  if (figure.type === "pawn") {
    determinePawnMarkers(board, row, col, figure.color, mark, moveHistory);
    return board;
  }

  if (figure.type === "king" && mark === "valid" && moveHistory) {
    markRochade(board, row, col, moveHistory, figure.color);
  }

  const { allowedDirections, maxDistance } = getMoveInstructions(figure.type);

  for (const [rowMovement, colMovement] of allowedDirections) {
    markTiles(
      board,
      row,
      rowMovement,
      col,
      colMovement,
      figure,
      maxDistance,
      0,
      mark,
      row,
      col,
      figure
    );
  }

  return board;
}

function createTilesUnderThreat(board: Board, threateningColor: PieceColor): Board {
  removeMarkers(board, ["check"]);

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const figure = board[row][col].figure;

      if (isPiece(figure) && figure.color === threateningColor) {
        createFieldMarkers(board, row, col, "check", true);
      }
    }
  }

  return board;
}

function refreshThreats(board: Board, turnToMove: PieceColor): Board {
  const nextBoard = cloneBoard(board);
  removeMarkers(nextBoard, ["check"]);
  return createTilesUnderThreat(nextBoard, invertColor(turnToMove));
}

function markTiles(
  board: Board,
  row: number,
  rowMovement: number,
  col: number,
  colMovement: number,
  figure: Piece,
  iterationMax: number,
  iterationCount: number,
  mark: "valid" | "check",
  oldRow: number,
  oldCol: number,
  oldFigure: Piece
): Board {
  const newRow = row + rowMovement;
  const newCol = col + colMovement;

  if (
    newCol > 7 ||
    newRow > 7 ||
    newCol < 0 ||
    newRow < 0 ||
    iterationCount >= iterationMax
  ) {
    return board;
  }

  const nextIterationCount = iterationCount + 1;
  const targetTile = board[newRow][newCol];

  if (targetTile.figure !== "noFigure") {
    if (isPiece(targetTile.figure) && targetTile.figure.color !== figure.color) {
      if (mark === "valid") {
        const boardCopy = cloneBoard(board);
        const move: ChessMove = {
          oldPos: { row: oldRow, col: oldCol },
          newPos: { row: newRow, col: newCol },
          figure: oldFigure,
          secondFigure: targetTile.figure
        };

        updateBoard(boardCopy, move, true);

        if (!checkForCheck(boardCopy, oldFigure.color)) {
          targetTile[mark] = mark;
        }
      } else {
        targetTile[mark] = mark;
      }
    }

    return board;
  }

  if (mark === "valid") {
    const boardCopy = cloneBoard(board);
    const move: ChessMove = {
      oldPos: { row: oldRow, col: oldCol },
      newPos: { row: newRow, col: newCol },
      figure: oldFigure,
      secondFigure: "noFigure"
    };

    updateBoard(boardCopy, move, true);

    if (!checkForCheck(boardCopy, oldFigure.color)) {
      targetTile[mark] = mark;
    }
  } else {
    targetTile[mark] = mark;
  }

  return markTiles(
    board,
    newRow,
    rowMovement,
    newCol,
    colMovement,
    figure,
    iterationMax,
    nextIterationCount,
    mark,
    oldRow,
    oldCol,
    oldFigure
  );
}

function determinePawnMarkers(
  board: Board,
  row: number,
  col: number,
  color: PieceColor,
  mark: "valid" | "check",
  moveHistory?: MoveHistoryEntry[]
): Board {
  if (mark === "valid") {
    straightPawnSteps(board, row, col, color);
  }

  diagonalPawnCaptures(board, row, col, color, mark);

  if (mark === "valid" && moveHistory) {
    enPassenMove(board, row, col, moveHistory, color);
  }

  return board;
}

function straightPawnSteps(
  board: Board,
  row: number,
  col: number,
  color: PieceColor
): Board {
  const oneStep = color === "white" ? -1 : 1;
  const twoStep = color === "white" ? -2 : 2;
  const startRow = color === "white" ? 6 : 1;
  const intermediateRow = row + oneStep;

  if (!isInsideBoard(intermediateRow, col)) {
    return board;
  }

  if (board[intermediateRow][col].figure !== "noFigure") {
    return board;
  }

  markPawnAdvance(board, row, col, intermediateRow);

  if (row === startRow && isInsideBoard(row + twoStep, col)) {
    const targetRow = row + twoStep;

    if (board[targetRow][col].figure === "noFigure") {
      markPawnAdvance(board, row, col, targetRow);
    }
  }

  return board;
}

function markPawnAdvance(
  board: Board,
  row: number,
  col: number,
  targetRow: number
): void {
  const boardCopy = cloneBoard(board);
  const figure = board[row][col].figure;

  if (!isPiece(figure)) {
    return;
  }

  const move: ChessMove = {
    oldPos: { row, col },
    newPos: { row: targetRow, col },
    figure,
    secondFigure: "noFigure"
  };

  updateBoard(boardCopy, move, true);

  if (!checkForCheck(boardCopy, figure.color)) {
    board[targetRow][col].valid = "valid";
  }
}

function diagonalPawnCaptures(
  board: Board,
  row: number,
  col: number,
  color: PieceColor,
  mark: "valid" | "check"
): Board {
  const rowChange = color === "white" ? -1 : 1;

  for (const colChange of [-1, 1]) {
    const nextRow = row + rowChange;
    const nextCol = col + colChange;

    if (!isInsideBoard(nextRow, nextCol)) {
      continue;
    }

    const tile = board[nextRow][nextCol];

    if (mark === "check") {
      tile.check = "check";
      continue;
    }

    if (tile.figure === "noFigure" || !isPiece(tile.figure) || tile.figure.color === color) {
      continue;
    }

    const boardCopy = cloneBoard(board);
    const move: ChessMove = {
      oldPos: { row, col },
      newPos: { row: nextRow, col: nextCol },
      figure: board[row][col].figure as Piece,
      secondFigure: tile.figure
    };

    updateBoard(boardCopy, move, true);

    if (!checkForCheck(boardCopy, color)) {
      tile.valid = "valid";
    }
  }

  return board;
}

function enPassenMove(
  board: Board,
  row: number,
  col: number,
  moveHistory: MoveHistoryEntry[],
  color: PieceColor
): Board {
  const move = getLastMove(moveHistory);

  if (
    !move ||
    move.figure.color === color ||
    move.figure.type !== "pawn" ||
    Math.abs(move.oldPos.row - move.newPos.row) !== 2 ||
    Math.abs(col - move.newPos.col) !== 1 ||
    row !== move.newPos.row
  ) {
    return board;
  }

  const enPassenRow = (move.oldPos.row + move.newPos.row) / 2;
  const enPassenCol = move.oldPos.col;
  const boardCopy = cloneBoard(board);
  const figure = board[row][col].figure;

  if (!isPiece(figure)) {
    return board;
  }

  const enPassen: ChessMove = {
    oldPos: { row, col },
    newPos: { row: enPassenRow, col: enPassenCol },
    figure,
    secondFigure: "noFigure",
    enPassen: {
      figure: move.figure,
      pos: move.newPos
    }
  };

  updateBoard(boardCopy, enPassen, true);

  if (checkForCheck(boardCopy, color)) {
    return board;
  }

  board[enPassenRow][enPassenCol].valid = "valid";
  board[enPassenRow][enPassenCol].enpassen = "enpassen";
  return board;
}

function markRochade(
  board: Board,
  row: number,
  col: number,
  moveHistory: MoveHistoryEntry[],
  color: PieceColor
): void {
  if (isLongRochadePossible(board, row, col, moveHistory, color)) {
    board[row][col - 2].valid = "valid";
    board[row][col - 2].rochade = "rochade";
  }

  if (isShortRochadePossible(board, row, col, moveHistory, color)) {
    board[row][col + 2].valid = "valid";
    board[row][col + 2].rochade = "rochade";
  }
}

function isLongRochadePossible(
  board: Board,
  row: number,
  col: number,
  moveHistory: MoveHistoryEntry[],
  color: PieceColor
): boolean {
  if (checkForMovedKing(moveHistory, color) || checkForMovedLeftRook(moveHistory, color)) {
    return false;
  }

  for (const targetCol of [4, 3, 2]) {
    if (board[row][targetCol].check === "check") {
      return false;
    }
  }

  return (
    board[row][0].figure !== "noFigure" &&
    isPiece(board[row][0].figure) &&
    board[row][0].figure.type === "rook" &&
    board[row][0].figure.color === color &&
    board[row][1].figure === "noFigure" &&
    board[row][2].figure === "noFigure" &&
    board[row][3].figure === "noFigure"
  );
}

function isShortRochadePossible(
  board: Board,
  row: number,
  col: number,
  moveHistory: MoveHistoryEntry[],
  color: PieceColor
): boolean {
  if (checkForMovedKing(moveHistory, color) || checkForMovedRightRook(moveHistory, color)) {
    return false;
  }

  for (const targetCol of [4, 5, 6]) {
    if (board[row][targetCol].check === "check") {
      return false;
    }
  }

  return (
    board[row][7].figure !== "noFigure" &&
    isPiece(board[row][7].figure) &&
    board[row][7].figure.type === "rook" &&
    board[row][7].figure.color === color &&
    board[row][5].figure === "noFigure" &&
    board[row][6].figure === "noFigure"
  );
}

function checkForMovedKing(moveHistory: MoveHistoryEntry[], color: PieceColor): boolean {
  return moveHistory.some(
    (move) =>
      !("kind" in move) &&
      move.figure.color === color &&
      move.figure.type === "king"
  );
}

function checkForMovedLeftRook(
  moveHistory: MoveHistoryEntry[],
  color: PieceColor
): boolean {
  return moveHistory.some(
    (move) =>
      !("kind" in move) &&
      move.figure.color === color &&
      move.figure.type === "rook" &&
      move.oldPos.col === 0
  );
}

function checkForMovedRightRook(
  moveHistory: MoveHistoryEntry[],
  color: PieceColor
): boolean {
  return moveHistory.some(
    (move) =>
      !("kind" in move) &&
      move.figure.color === color &&
      move.figure.type === "rook" &&
      move.oldPos.col === 7
  );
}

function updateBoard(
  board: Board,
  move: ChessMove,
  virtual = false,
  undo = false
): Board {
  removeMarkers(board, ["valid", "selected", "check", "rochade", "enpassen"]);

  if (!undo) {
    removePiece(board, move.oldPos);

    if (move.enPassen) {
      removePiece(board, move.enPassen.pos);
    }
  } else {
    if (move.enPassen) {
      generatePiece(board, move.enPassen.pos, move.enPassen.figure, false);
    }

    generatePiece(board, move.oldPos, move.secondFigure, virtual);
  }

  if (move.rochadeRook) {
    updateBoard(board, move.rochadeRook, true);
  }

  generatePiece(board, move.newPos, move.figure, virtual);
  return board;
}

function removeMarkers(
  board: Board,
  marks: Array<"valid" | "selected" | "check" | "rochade" | "enpassen">
): Board {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      for (const mark of marks) {
        board[row][col][mark] = "";
      }
    }
  }

  return board;
}

function removePiece(board: Board, pos: Position): Board {
  board[pos.row][pos.col].figure = "noFigure";
  return board;
}

function generatePiece(
  board: Board,
  pos: Position,
  figure: Figure,
  virtual: boolean
): Board {
  board[pos.row][pos.col].figure = figure;
  removeMarkers(board, ["check"]);

  if (isPiece(figure)) {
    return virtual
      ? createTilesUnderThreat(board, invertColor(figure.color))
      : createTilesUnderThreat(board, figure.color);
  }

  return board;
}

function checkForCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  return board[kingPos.row][kingPos.col].check === "check";
}

function checkForCheckMate(
  board: Board,
  color: PieceColor,
  moveHistory: MoveHistoryEntry[]
): boolean {
  return checkForCheck(board, color) && checkForRemis(board, color, moveHistory);
}

function checkForRemis(
  board: Board,
  color: PieceColor,
  moveHistory: MoveHistoryEntry[]
): boolean {
  const boardCopy = cloneBoard(board);
  const possibleFiguresToMove = findFigures(boardCopy, color);

  for (const tile of possibleFiguresToMove) {
    createFieldMarkers(boardCopy, tile.row, tile.col, "valid", true, moveHistory);
  }

  return areThereNoMoreValidMoves(boardCopy);
}

function areThereNoMoreValidMoves(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col].valid === "valid") {
        return false;
      }
    }
  }

  return true;
}

function findFigures(board: Board, color: PieceColor): Position[] {
  const figurePositions: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const tile = board[row][col];

      if (isPiece(tile.figure) && tile.figure.color === color) {
        figurePositions.push({ row, col });
      }
    }
  }

  return figurePositions;
}

function findKing(board: Board, color: PieceColor): Position {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const figure = board[row][col].figure;

      if (isPiece(figure) && figure.type === "king" && figure.color === color) {
        return { row, col };
      }
    }
  }

  throw new Error(`Could not find ${color} king on the board`);
}

function getLastMove(moveHistory: MoveHistoryEntry[]): ChessMove | null {
  for (let index = moveHistory.length - 1; index >= 0; index -= 1) {
    const move = moveHistory[index];

    if (!("kind" in move)) {
      return move;
    }
  }

  return null;
}

function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function isPiece(figure: Figure): figure is Piece {
  return figure !== "noFigure";
}
