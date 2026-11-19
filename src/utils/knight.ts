const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function getKnightMovesFrom(square: string): string[] {
  const fileIndex = FILES.indexOf(square[0]);
  const rankIndex = RANKS.indexOf(square[1]);
  if (fileIndex < 0 || rankIndex < 0) return [];

  const moves: string[] = [];
  for (const [fileDelta, rankDelta] of [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ]) {
    const nextFile = fileIndex + fileDelta;
    const nextRank = rankIndex + rankDelta;
    if (nextFile >= 0 && nextFile < 8 && nextRank >= 0 && nextRank < 8) {
      moves.push(`${FILES[nextFile]}${RANKS[nextRank]}`);
    }
  }
  return moves;
}
