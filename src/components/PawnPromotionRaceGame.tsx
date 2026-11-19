import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Play, RotateCcw, Timer, Trophy } from 'lucide-react';
import { BOARD_THEMES, BoardThemeId, PieceSkin, TeamScore } from '../types/chess';
import { sound } from '../utils/sound';
import { ChessPieceSvg, PieceColor, PieceType } from './ChessPieces';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PROMOTION_PIECES: PieceType[] = ['q', 'r', 'b', 'n'];
const PIECE_NAMES: Record<PieceType, string> = {
  p: 'Tốt',
  n: 'Mã',
  b: 'Tượng',
  r: 'Xe',
  q: 'Hậu',
  k: 'Vua',
};

interface PawnObstacle {
  square: string;
  type: PieceType;
}

interface RaceResult {
  id: number;
  name: string;
  teamName: string;
  color: PieceColor;
  promotedTo: PieceType;
  seconds: number;
  moves: number;
}

interface PawnPromotionRaceGameProps {
  theme: BoardThemeId;
  skin: PieceSkin;
  teams: TeamScore[];
}

function getObstacles(color: PieceColor): PawnObstacle[] {
  const whiteObstacles: PawnObstacle[] = [
    { square: 'd5', type: 'n' },
    { square: 'e5', type: 'b' },
    { square: 'e7', type: 'r' },
    { square: 'f7', type: 'q' },
  ];
  if (color === 'w') return whiteObstacles;

  return whiteObstacles.map(({ square, type }) => {
    const file = square[0];
    const rank = Number(square[1]);
    return { square: `${file}${9 - rank}`, type };
  });
}

function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)} giây`;
}

export const PawnPromotionRaceGame: React.FC<PawnPromotionRaceGameProps> = ({
  theme,
  skin,
  teams,
}) => {
  const [color, setColor] = useState<PieceColor>('w');
  const [playerName, setPlayerName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [pawnSquare, setPawnSquare] = useState('d2');
  const [capturedObstacles, setCapturedObstacles] = useState<string[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<'idle' | 'promoting' | 'won'>('idle');
  const [promotedPiece, setPromotedPiece] = useState<PieceType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<RaceResult[]>([]);
  const startedAt = useRef<number | null>(null);
  const nextResultId = useRef(0);

  const themeColors = BOARD_THEMES[theme];
  const direction = color === 'w' ? 1 : -1;
  const startRank = color === 'w' ? 2 : 7;
  const finalRank = color === 'w' ? 8 : 1;
  const activeObstacles = useMemo(
    () => getObstacles(color).filter((obstacle) => !capturedObstacles.includes(obstacle.square)),
    [color, capturedObstacles],
  );
  const currentTeam = teams.find((team) => team.id === teamId);
  const colorResults = results.filter((result) => result.color === color);
  const bestResult = colorResults[0];

  const legalTargets = useMemo(() => {
    const fileIndex = FILES.indexOf(pawnSquare[0]);
    const rank = Number(pawnSquare[1]);
    const occupied = new Set(activeObstacles.map((obstacle) => obstacle.square));
    const targets: string[] = [];
    const nextRank = rank + direction;

    if (nextRank >= 1 && nextRank <= 8) {
      const forwardSquare = `${FILES[fileIndex]}${nextRank}`;
      if (!occupied.has(forwardSquare)) targets.push(forwardSquare);

      for (const fileDelta of [-1, 1]) {
        const nextFileIndex = fileIndex + fileDelta;
        if (nextFileIndex < 0 || nextFileIndex >= 8) continue;
        const captureSquare = `${FILES[nextFileIndex]}${nextRank}`;
        if (occupied.has(captureSquare)) targets.push(captureSquare);
      }

      if (moveCount === 0 && rank === startRank) {
        const doubleSquare = `${FILES[fileIndex]}${rank + direction * 2}`;
        if (
          !occupied.has(forwardSquare) &&
          !occupied.has(doubleSquare)
        ) {
          targets.push(doubleSquare);
        }
      }
    }

    return targets;
  }, [activeObstacles, direction, moveCount, pawnSquare, startRank]);

  useEffect(() => {
    if (!isRunning) return;
    const timerId = window.setInterval(() => {
      if (startedAt.current !== null) {
        setElapsed((performance.now() - startedAt.current) / 1000);
      }
    }, 50);
    return () => window.clearInterval(timerId);
  }, [isRunning]);

  const resetAttempt = () => {
    setPawnSquare(color === 'w' ? 'd2' : 'd7');
    setCapturedObstacles([]);
    setMoveCount(0);
    setElapsed(0);
    setPromotedPiece(null);
    setStatus('idle');
    setMessage(null);
  };

  const startAttempt = () => {
    if (!playerName.trim()) {
      setMessage('Hãy nhập tên học sinh trước khi bắt đầu cuộc đua.');
      return;
    }
    resetAttempt();
    startedAt.current = performance.now();
    setIsRunning(true);
    sound.playMove();
  };

  const finishPromotion = (piece: PieceType) => {
    if (status !== 'promoting') return;
    const finishTime =
      startedAt.current === null
        ? elapsed
        : (performance.now() - startedAt.current) / 1000;
    const result: RaceResult = {
      id: nextResultId.current++,
      name: playerName.trim(),
      teamName: currentTeam?.name ?? '',
      color,
      promotedTo: piece,
      seconds: finishTime,
      moves: moveCount,
    };
    setElapsed(finishTime);
    setPromotedPiece(piece);
    setStatus('won');
    setIsRunning(false);
    setMessage(null);
    setResults((previous) =>
      [...previous, result].sort((a, b) => a.seconds - b.seconds),
    );
    sound.playSuccess();
    confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
  };

  const handleSquareClick = (square: string) => {
    if (!isRunning || status !== 'idle') return;

    const fileDelta = FILES.indexOf(square[0]) - FILES.indexOf(pawnSquare[0]);
    const rankDelta = Number(square[1]) - Number(pawnSquare[1]);
    const obstacle = activeObstacles.find((piece) => piece.square === square);
    const isSingleForward = fileDelta === 0 && rankDelta === direction;
    const isDoubleForward =
      fileDelta === 0 &&
      rankDelta === direction * 2 &&
      moveCount === 0 &&
      Number(pawnSquare[1]) === startRank;
    const isDiagonalCapture =
      Math.abs(fileDelta) === 1 &&
      rankDelta === direction &&
      Boolean(obstacle);

    if (isSingleForward || isDoubleForward) {
      const intermediateSquare =
        isDoubleForward
          ? `${pawnSquare[0]}${Number(pawnSquare[1]) + direction}`
          : null;
      const blocked =
        Boolean(obstacle) ||
        (intermediateSquare !== null &&
          activeObstacles.some((piece) => piece.square === intermediateSquare));
      if (blocked) {
        setMessage('Có quân cản đường. Tốt chỉ tiến thẳng nếu ô phía trước thông thoáng.');
        sound.playError();
        return;
      }
    } else if (!isDiagonalCapture) {
      setMessage(
        'Nước đi chưa đúng: Tốt tiến thẳng 1 ô (hoặc 2 ô lượt đầu), chỉ ăn chéo khi có quân đối phương.',
      );
      sound.playError();
      return;
    }

    if (obstacle) {
      setCapturedObstacles((previous) => [...previous, obstacle.square]);
      sound.playCapture();
    } else {
      sound.playMove();
    }

    setPawnSquare(square);
    setMoveCount((count) => count + 1);
    setMessage(null);

    if (Number(square[1]) === finalRank) {
      setStatus('promoting');
      setMessage('Hô to “PHONG CẤP!” rồi chọn quân mới cho Tốt nhé!');
    }
  };

  const margin = 36;
  const squareSize = 80;
  const boardSize = margin * 2 + squareSize * 8;
  const pieceColor: PieceColor = color === 'w' ? 'w' : 'b';
  const obstacleColor: PieceColor = color === 'w' ? 'b' : 'w';
  const pieceType = promotedPiece ?? 'p';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7">
        <div
          className="rounded-2xl overflow-hidden shadow-md border-4 max-w-[640px] mx-auto select-none"
          style={{
            borderColor: themeColors.border,
            backgroundColor: themeColors.light,
          }}
        >
          <svg
            viewBox={`0 0 ${boardSize} ${boardSize}`}
            className="w-full h-auto block"
            role="img"
            aria-label={`Bàn cờ cuộc đua phong cấp của Tốt ${color === 'w' ? 'Trắng' : 'Đen'}`}
          >
            <rect
              x="0"
              y="0"
              width={boardSize}
              height={boardSize}
              fill={themeColors.light}
            />
            {FILES.map((file, index) => (
              <g key={`file-${file}`}>
                <text
                  x={margin + index * squareSize + squareSize / 2}
                  y="24"
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="18"
                  fontWeight="800"
                >
                  {file}
                </text>
                <text
                  x={margin + index * squareSize + squareSize / 2}
                  y={boardSize - 7}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="18"
                  fontWeight="800"
                >
                  {file}
                </text>
              </g>
            ))}
            {RANKS.map((rank, index) => (
              <g key={`rank-${rank}`}>
                <text
                  x="17"
                  y={margin + index * squareSize + squareSize / 2 + 6}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="18"
                  fontWeight="800"
                >
                  {rank}
                </text>
                <text
                  x={boardSize - 17}
                  y={margin + index * squareSize + squareSize / 2 + 6}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="18"
                  fontWeight="800"
                >
                  {rank}
                </text>
              </g>
            ))}
            {RANKS.map((rank, rankIndex) =>
              FILES.map((file, fileIndex) => {
                const square = `${file}${rank}`;
                const x = margin + fileIndex * squareSize;
                const y = margin + rankIndex * squareSize;
                const obstacle = activeObstacles.find((piece) => piece.square === square);
                const isPawn = pawnSquare === square;
                const isLegal = isRunning && legalTargets.includes(square);
                const isPromotionRank = Number(rank) === finalRank;

                return (
                  <g
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSquareClick(square);
                      }
                    }}
                    role="button"
                    aria-label={`Ô ${square}${obstacle ? ', có quân cản' : ''}${isPromotionRank ? ', hàng phong cấp' : ''}`}
                    tabIndex={isRunning && status === 'idle' ? 0 : -1}
                    className={isRunning && status === 'idle' ? 'cursor-pointer' : ''}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={squareSize}
                      height={squareSize}
                      fill={
                        (rankIndex + fileIndex) % 2 === 0
                          ? themeColors.light
                          : themeColors.dark
                      }
                    />
                    {isPromotionRank && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={squareSize - 4}
                        height={squareSize - 4}
                        fill="none"
                        stroke="#F59E0B"
                        strokeOpacity="0.65"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                    )}
                    {isLegal && (
                      <circle
                        cx={x + squareSize / 2}
                        cy={y + squareSize / 2}
                        r="10"
                        fill="#0f172a"
                        fillOpacity="0.35"
                      />
                    )}
                    {obstacle && (
                      <g>
                        <rect
                          x={x + 4}
                          y={y + 4}
                          width={squareSize - 8}
                          height={squareSize - 8}
                          rx="10"
                          fill="rgba(244, 63, 94, 0.13)"
                          stroke="#E11D48"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                        />
                        <svg
                          x={x + 10}
                          y={y + 9}
                          width={squareSize - 20}
                          height={squareSize - 18}
                          viewBox="0 0 45 45"
                        >
                          <ChessPieceSvg
                            type={obstacle.type}
                            color={obstacleColor}
                            skin={skin}
                          />
                        </svg>
                      </g>
                    )}
                    {isPawn && (
                      <g>
                        <circle
                          cx={x + squareSize / 2}
                          cy={y + squareSize / 2}
                          r="34"
                          fill="rgba(14, 165, 233, 0.3)"
                          stroke="#0284C7"
                          strokeWidth="3"
                        />
                        <svg
                          x={x + 7}
                          y={y + 7}
                          width={squareSize - 14}
                          height={squareSize - 14}
                          viewBox="0 0 45 45"
                        >
                          <ChessPieceSvg
                            type={pieceType}
                            color={pieceColor}
                            skin={skin}
                          />
                        </svg>
                        {status === 'promoting' && (
                          <text
                            x={x + squareSize - 9}
                            y={y + 18}
                            textAnchor="middle"
                            fontSize="24"
                            aria-hidden="true"
                          >
                            👑
                          </text>
                        )}
                      </g>
                    )}
                    {isRunning && status === 'idle' && (
                      <rect
                        x={x}
                        y={y}
                        width={squareSize}
                        height={squareSize}
                        fill="transparent"
                        className="hover:fill-white/15"
                      />
                    )}
                  </g>
                );
              }),
            )}
          </svg>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-extrabold text-slate-900">
              Cuộc đua Phong cấp của Tốt nhỏ
            </h3>
          </div>
          <p className="text-sm text-slate-600">
            Tốt đi thẳng, được tiến 2 ô ở nước đầu nếu đường thông. Chỉ ăn chéo
            một ô khi có quân đối phương; đến hàng cuối phải chọn quân để phong cấp.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(['w', 'b'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => {
                  if (isRunning) return;
                  setColor(side);
                  setPawnSquare(side === 'w' ? 'd2' : 'd7');
                  setCapturedObstacles([]);
                  setMoveCount(0);
                  setElapsed(0);
                  setPromotedPiece(null);
                  setStatus('idle');
                  setMessage(null);
                }}
                disabled={isRunning}
                className={`rounded-xl border p-3 text-sm font-bold transition-colors ${
                  color === side
                    ? 'border-sky-400 bg-sky-50 text-sky-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                } disabled:cursor-not-allowed`}
              >
                {side === 'w' ? '♙ Tốt Trắng · d2 → 8' : '♟ Tốt Đen · d7 → 1'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-700">
              Tên học sinh
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                disabled={isRunning}
                placeholder="Nhập tên người chơi"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Đội (không bắt buộc)
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                disabled={isRunning}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium disabled:bg-slate-100"
              >
                <option value="">Không chọn đội</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <Timer className="h-4 w-4" />
                Thời gian
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-sky-950">
                {formatTime(elapsed)}
              </p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
              <span className="text-xs font-bold text-teal-900">Số nước đi</span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-teal-950">
                {moveCount}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startAttempt}
            disabled={isRunning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {status === 'won' ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {status === 'won' ? 'Bắt đầu lượt mới' : 'Bắt đầu cuộc đua'}
          </button>

          {isRunning && status === 'idle' && (
            <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-bold text-sky-900">
              {playerName.trim()} đang chạy đua đến hàng {finalRank}…
            </p>
          )}
          {status === 'promoting' && (
            <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-center text-xl font-black tracking-wide text-amber-950">
                PHONG CẤP!
              </p>
              <p className="text-center text-sm font-semibold text-amber-900">
                Chọn chiếc vương miện và quân cờ chiến thuật cho Tốt.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PROMOTION_PIECES.map((piece) => (
                  <button
                    key={piece}
                    type="button"
                    onClick={() => finishPromotion(piece)}
                    aria-label={`Phong cấp thành ${PIECE_NAMES[piece]}`}
                    className="flex flex-col items-center gap-1 rounded-lg border border-amber-300 bg-white p-2 text-xs font-bold text-amber-950 hover:bg-amber-100"
                  >
                    <ChessPieceSvg
                      type={piece}
                      color={pieceColor}
                      skin={skin}
                      className="h-9 w-9"
                    />
                    {PIECE_NAMES[piece]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {message && status !== 'promoting' && (
            <p
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950"
            >
              {message}
            </p>
          )}
          {status === 'won' && promotedPiece && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 font-extrabold text-emerald-950">
              <Trophy className="h-5 w-5 text-amber-500" />
              {playerName.trim()} phong cấp thành {PIECE_NAMES[promotedPiece]} trong{' '}
              {formatTime(elapsed)}!
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <h4 className="mb-2 text-sm font-extrabold text-slate-800">
              Thành tích nhanh nhất · {color === 'w' ? 'Tốt Trắng' : 'Tốt Đen'}
            </h4>
            {bestResult ? (
              <ol className="space-y-2">
                {colorResults.slice(0, 5).map((result, index) => (
                  <li
                    key={result.id}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                      index === 0
                        ? 'bg-amber-50 text-amber-950'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="min-w-0 truncate font-bold">
                      {index + 1}. {result.name}
                      {result.teamName ? ` · ${result.teamName}` : ''}
                      <span className="ml-1 font-medium">
                        ({PIECE_NAMES[result.promotedTo]})
                      </span>
                    </span>
                    <span className="shrink-0 font-mono font-extrabold">
                      {formatTime(result.seconds)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">
                Chưa có thành tích. Hãy thi từng lượt để tìm Tốt nhanh nhất!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
