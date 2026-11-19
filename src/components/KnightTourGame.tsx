import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Lightbulb, RotateCcw, Sparkles, Star, Trophy } from 'lucide-react';
import { BOARD_THEMES, BoardThemeId, PieceSkin, TeamScore } from '../types/chess';
import { ChessPieceSvg } from './ChessPieces';
import { sound } from '../utils/sound';
import { getKnightMovesFrom } from '../utils/knight';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface KnightLevel {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  stars: string[];
  traps: string[];
}

const KNIGHT_LEVELS: KnightLevel[] = [
  {
    id: 'lvl-1',
    title: 'Màn 1: Bước nhảy chữ L đầu tiên',
    subtitle: 'Thu thập 3 ngôi sao vàng bằng bước nhảy chữ L của chú Mã!',
    start: 'b1',
    stars: ['c3', 'd5', 'f4'],
    traps: [],
  },
  {
    id: 'lvl-2',
    title: 'Màn 2: Vượt qua hố bùn',
    subtitle: 'Ăn hết 4 ngôi sao và tránh giẫm vào các ô hố đỏ nguy hiểm!',
    start: 'd4',
    stars: ['e6', 'g5', 'f3', 'c2'],
    traps: ['c6', 'f5', 'e2', 'b3'],
  },
  {
    id: 'lvl-3',
    title: 'Màn 3: Hành trình xuyên bàn cờ',
    subtitle: 'Thu thập 5 ngôi sao từ góc a1 lên tới góc h8!',
    start: 'a1',
    stars: ['b3', 'd4', 'e6', 'g7', 'h5'],
    traps: ['c2', 'c5', 'f4', 'f8', 'd2'],
  },
  {
    id: 'lvl-4',
    title: 'Màn 4: Thử thách Kỵ Sĩ Siêu Đẳng',
    subtitle: 'Ăn đủ 6 ngôi sao với số bước nhảy ít nhất có thể!',
    start: 'e4',
    stars: ['c5', 'd7', 'f6', 'h5', 'g3', 'e2'],
    traps: ['d6', 'f8', 'g7', 'f4', 'd2', 'c3'],
  },
];

interface KnightTourGameProps {
  theme: BoardThemeId;
  skin: PieceSkin;
  teams: TeamScore[];
  onAwardTeam: (teamId: string, delta: number) => void;
}

export const KnightTourGame: React.FC<KnightTourGameProps> = ({
  theme,
  skin,
  teams,
  onAwardTeam,
}) => {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const level = KNIGHT_LEVELS[levelIdx];

  const [knightSq, setKnightSq] = useState<string>(level.start);
  const [remainingStars, setRemainingStars] = useState<string[]>(level.stars);
  const [visited, setVisited] = useState<string[]>([level.start]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [showLHints, setShowLHints] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const themeColors = BOARD_THEMES[theme];
  const validKnightTargets = useMemo(() => getKnightMovesFrom(knightSq), [knightSq]);
  const isWon = remainingStars.length === 0;

  const loadLevel = (idx: number) => {
    const target = KNIGHT_LEVELS[idx];
    setLevelIdx(idx);
    setKnightSq(target.start);
    setRemainingStars([...target.stars]);
    setVisited([target.start]);
    setMovesCount(0);
    setErrorMsg(null);
    sound.playMove();
  };

  const handleSquareClick = (sq: string) => {
    if (isWon) return;

    if (!validKnightTargets.includes(sq)) {
      sound.playError();
      setErrorMsg('Chú Mã chỉ nhảy theo hình chữ L (2 ô thẳng + 1 ô ngang) thôi nhé!');
      return;
    }

    if (level.traps.includes(sq)) {
      sound.playError();
      setErrorMsg(`Ô ${sq} có hố bẫy nguy hiểm! Hãy chọn ô chữ L an toàn khác.`);
      return;
    }

    setErrorMsg(null);
    setKnightSq(sq);
    setMovesCount((c) => c + 1);
    setVisited((prev) => (prev.includes(sq) ? prev : [...prev, sq]));

    if (remainingStars.includes(sq)) {
      const nextStars = remainingStars.filter((s) => s !== sq);
      setRemainingStars(nextStars);
      if (nextStars.length === 0) {
        sound.playSuccess();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        sound.playCapture();
      }
    } else {
      sound.playMove();
    }
  };

  const MARGIN = 44;
  const SQ = 100;
  const TOTAL = MARGIN * 2 + SQ * 8;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: KNIGHT ADVENTURE BOARD */}
      <div className="lg:col-span-7">
        <div
          className="rounded-2xl overflow-hidden shadow-md border-4 max-w-[640px] mx-auto select-none"
          style={{
            borderColor: themeColors.border,
            backgroundColor: themeColors.light,
          }}
        >
          <svg viewBox={`0 0 ${TOTAL} ${TOTAL}`} className="w-full h-auto block">
            <rect x="0" y="0" width={TOTAL} height={TOTAL} fill={themeColors.light} />

            {/* Coordinates */}
            {FILES.map((file, idx) => {
              const cx = MARGIN + idx * SQ + SQ / 2;
              return (
                <g key={`kf-${file}`}>
                  <text
                    x={cx}
                    y={30}
                    textAnchor="middle"
                    fill={themeColors.coord}
                    fontSize="24"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {file}
                  </text>
                  <text
                    x={cx}
                    y={TOTAL - 14}
                    textAnchor="middle"
                    fill={themeColors.coord}
                    fontSize="24"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {file}
                  </text>
                </g>
              );
            })}

            {RANKS.map((rank, idx) => {
              const cy = MARGIN + idx * SQ + SQ / 2 + 8;
              return (
                <g key={`kr-${rank}`}>
                  <text
                    x={22}
                    y={cy}
                    textAnchor="middle"
                    fill={themeColors.coord}
                    fontSize="24"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {rank}
                  </text>
                  <text
                    x={TOTAL - 22}
                    y={cy}
                    textAnchor="middle"
                    fill={themeColors.coord}
                    fontSize="24"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {rank}
                  </text>
                </g>
              );
            })}

            {/* Squares + Traps + Stars + Knight */}
            {RANKS.map((rank, rIdx) =>
              FILES.map((file, fIdx) => {
                const sq = `${file}${rank}`;
                const isLight = (rIdx + fIdx) % 2 === 0;
                const x = MARGIN + fIdx * SQ;
                const y = MARGIN + rIdx * SQ;
                const isTrap = level.traps.includes(sq);
                const hasStar = remainingStars.includes(sq);
                const isVisited = visited.includes(sq);
                const isValidJump = validKnightTargets.includes(sq) && !isTrap;
                const isKnightHere = knightSq === sq;

                return (
                  <g
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={SQ}
                      height={SQ}
                      fill={isLight ? themeColors.light : themeColors.dark}
                    />

                    {/* Visited breadcrumb tint */}
                    {isVisited && !isKnightHere && (
                      <rect
                        x={x}
                        y={y}
                        width={SQ}
                        height={SQ}
                        fill="rgba(20, 184, 166, 0.25)"
                      />
                    )}

                    {/* Active Knight square glow */}
                    {isKnightHere && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={SQ - 4}
                        height={SQ - 4}
                        fill="rgba(14, 165, 233, 0.35)"
                        stroke="#0284C7"
                        strokeWidth="4"
                      />
                    )}

                    {/* Trap X Tile */}
                    {isTrap && (
                      <g>
                        <rect
                          x={x + 6}
                          y={y + 6}
                          width={SQ - 12}
                          height={SQ - 12}
                          rx="14"
                          fill="rgba(225, 29, 72, 0.22)"
                          stroke="#E11D48"
                          strokeWidth="3"
                        />
                        <path
                          d={`M ${x + 30} ${y + 30} L ${x + 70} ${y + 70} M ${x + 70} ${y + 30} L ${x + 30} ${y + 70}`}
                          stroke="#BE123C"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                      </g>
                    )}

                    {/* Collectible Gold Star */}
                    {hasStar && (
                      <g transform={`translate(${x + 18}, ${y + 18})`}>
                        <polygon
                          points="32,4 40,22 60,24 45,38 49,58 32,48 15,58 19,38 4,24 24,22"
                          fill="#FACC15"
                          stroke="#B45309"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                      </g>
                    )}

                    {/* L-Jump Hint Dots */}
                    {showLHints && isValidJump && !isWon && (
                      <circle
                        cx={x + SQ / 2}
                        cy={y + SQ / 2}
                        r={hasStar ? 42 : 16}
                        fill={hasStar ? 'none' : 'rgba(15, 23, 42, 0.28)'}
                        stroke={hasStar ? '#16A34A' : 'none'}
                        strokeWidth={hasStar ? '6' : '0'}
                      />
                    )}

                    {/* Knight Piece */}
                    {isKnightHere && (
                      <g transform={`translate(${x + 5}, ${y + 5})`}>
                        <svg width={90} height={90} viewBox="0 0 90 90">
                          <ChessPieceSvg type="n" color="w" skin={skin} />
                        </svg>
                      </g>
                    )}
                  </g>
                );
              }),
            )}
          </svg>
        </div>
      </div>

      {/* RIGHT: LEVEL PICKER & MISSION PANEL */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold text-slate-900">
              Mã Phi Nước Đại
            </h3>
            <button
              type="button"
              onClick={() => setShowLHints((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                showLHints
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showLHints ? 'Đang bật gợi ý L' : 'Đang tắt gợi ý'}
            </button>
          </div>

          {/* Level Selector */}
          <div className="grid grid-cols-4 gap-2">
            {KNIGHT_LEVELS.map((lvl, idx) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => loadLevel(idx)}
                className={`py-2 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                  levelIdx === idx
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Màn {idx + 1}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-base font-extrabold text-slate-900">{level.title}</p>
            <p className="text-sm text-slate-600">{level.subtitle}</p>
          </div>

          {/* Progress Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-600" />
                Sao còn lại
              </span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-amber-900">
                {remainingStars.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900">Số bước nhảy</span>
              <span className="text-2xl font-extrabold font-mono tabular-nums text-teal-900">
                {movesCount}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadLevel(levelIdx)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-bold text-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Chơi lại màn này
            </button>
            {levelIdx < KNIGHT_LEVELS.length - 1 && (
              <button
                type="button"
                onClick={() => loadLevel(levelIdx + 1)}
                className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold cursor-pointer"
              >
                Màn tiếp →
              </button>
            )}
          </div>

          {isWon && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base">
                <Trophy className="w-5 h-5 text-amber-500" />
                Hoàn thành xuất sắc trong {movesCount} bước nhảy!
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onAwardTeam(t.id, 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-xs font-bold text-emerald-900 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    +1 ⭐ {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
