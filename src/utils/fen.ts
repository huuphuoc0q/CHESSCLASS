import { Chess, Square } from 'chess.js';
import { PieceColor, PieceType } from '../components/ChessPieces';

export interface BoardPiece {
  type: PieceType;
  color: PieceColor;
}

export type BoardGrid = Record<string, BoardPiece>;

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function parseFenPlacement(fen: string): {
  grid: BoardGrid;
  turn: PieceColor;
} {
  const parts = fen.trim().split(/\s+/);
  const placement = parts[0] || '8/8/8/8/8/8/8/8';
  const turn: PieceColor = parts[1] === 'b' ? 'b' : 'w';
  const grid: BoardGrid = {};

  const rows = placement.split('/');
  for (let r = 0; r < 8 && r < rows.length; r++) {
    const row = rows[r];
    let fileIdx = 0;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch >= '1' && ch <= '8') {
        fileIdx += parseInt(ch, 10);
      } else if ('pnbrqkPNBRQK'.includes(ch) && fileIdx < 8) {
        const sq = `${FILES[fileIdx]}${RANKS[r]}`;
        const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toLowerCase() as PieceType;
        grid[sq] = { type, color };
        fileIdx++;
      }
    }
  }
  return { grid, turn };
}

export function serializeBoardToFen(grid: BoardGrid, turn: PieceColor): string {
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    let rowStr = '';
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${RANKS[r]}`;
      const piece = grid[sq];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          rowStr += String(empty);
          empty = 0;
        }
        rowStr += piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
      }
    }
    if (empty > 0) rowStr += String(empty);
    rows.push(rowStr);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

export function isPlayableFen(fen: string): { valid: boolean; error?: string } {
  try {
    const chess = new Chess(fen);
    return { valid: Boolean(chess.fen()) };
  } catch {
    return { valid: false, error: 'Thế cờ cần có đủ 1 Vua Trắng và 1 Vua Đen hợp lệ để đi quân.' };
  }
}

export function getLegalDestinations(fen: string, fromSquare: string): string[] {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: fromSquare as Square, verbose: true });
    return moves.map((m) => m.to);
  } catch {
    return [];
  }
}

export function getCheckedKingSquare(fen: string): string | null {
  try {
    const chess = new Chess(fen);
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const { grid } = parseFenPlacement(fen);
    for (const [sq, piece] of Object.entries(grid)) {
      if (piece.type === 'k' && piece.color === turn) {
        return sq;
      }
    }
    return null;
  } catch {
    return null;
  }
}
