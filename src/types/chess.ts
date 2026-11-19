export type ModuleId = 'board' | 'arena' | 'stamps' | 'worksheet';

export type BoardThemeId = 'moss' | 'ocean' | 'wood';

export type PieceSkin = 'fide' | 'cartoon';

export type ArrowColor = 'green' | 'red' | 'yellow';

export type TouchTool = 'move' | 'arrow' | 'highlight' | 'focus';

export type GradeLevel = 'k12' | 'k3' | 'k45' | 'custom';

export interface BoardArrow {
  from: string;
  to: string;
  color: ArrowColor;
}

export interface SquareHighlight {
  square: string;
  color: ArrowColor;
}

export interface ChessPuzzle {
  id: string;
  title: string;
  grade: GradeLevel;
  fen: string;
  solutionMoves: string[]; // UCI format e.g. 'd4a7'
  tradeFormula: string;
  explanation: string;
  hintArrow?: [string, string];
  isCustom?: boolean;
}

export type BadgeType = 'worksheet' | 'speed' | 'touchMove' | 'winner';

export interface Student {
  id: string;
  name: string;
  teamId?: string;
  stars: number;
  badges: Record<BadgeType, number>;
  createdAt: number;
}

export interface TeamScore {
  id: string;
  name: string;
  color: 'red' | 'blue' | 'amber';
  stars: number;
}

export interface PieceSpec {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  nameVi: string;
  points: number;
  pointsLabel: string;
}

export const PIECE_SPECS: Record<'p' | 'n' | 'b' | 'r' | 'q' | 'k', PieceSpec> = {
  p: { type: 'p', nameVi: 'Tốt', points: 1, pointsLabel: '1đ' },
  n: { type: 'n', nameVi: 'Mã', points: 3, pointsLabel: '3đ' },
  b: { type: 'b', nameVi: 'Tượng', points: 3, pointsLabel: '3đ' },
  r: { type: 'r', nameVi: 'Xe', points: 5, pointsLabel: '5đ' },
  q: { type: 'q', nameVi: 'Hậu', points: 9, pointsLabel: '9đ' },
  k: { type: 'k', nameVi: 'Vua', points: 0, pointsLabel: 'Vô giá' },
};

export const BOARD_THEMES: Record<
  BoardThemeId,
  { name: string; light: string; dark: string; coord: string; border: string }
> = {
  moss: {
    name: 'Xanh rêu – Kem',
    light: '#EEEED2',
    dark: '#769656',
    coord: '#4D6B33',
    border: '#5A783F',
  },
  ocean: {
    name: 'Xanh dương – Trắng',
    light: '#F1F5F9',
    dark: '#5B8BB4',
    coord: '#335C81',
    border: '#477299',
  },
  wood: {
    name: 'Gỗ ấm',
    light: '#F5E6CA',
    dark: '#B58863',
    coord: '#7C5434',
    border: '#8D6240',
  },
};

export const BADGE_META: Record<
  BadgeType,
  { label: string; shortLabel: string; icon: string; colorClass: string }
> = {
  worksheet: {
    label: 'Hoàn thành phiếu bài tập',
    shortLabel: 'Phiếu bài tập',
    icon: '⭐',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  speed: {
    label: 'Tính điểm đổi quân siêu tốc',
    shortLabel: 'Tính siêu tốc',
    icon: '⚡',
    colorClass: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100',
  },
  touchMove: {
    label: 'Tuân thủ luật chạm quân',
    shortLabel: 'Luật chạm quân',
    icon: '🤝',
    colorClass: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
  },
  winner: {
    label: 'Chiến thắng ván đấu',
    shortLabel: 'Chiến thắng',
    icon: '🏆',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
  },
};
