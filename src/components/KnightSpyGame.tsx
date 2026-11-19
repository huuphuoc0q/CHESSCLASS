import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Shield, Timer, Trophy } from 'lucide-react';
import { BOARD_THEMES, BoardThemeId, PieceSkin, TeamScore } from '../types/chess';
import { sound } from '../utils/sound';
import { getKnightMovesFrom } from '../utils/knight';
import { ChessPieceSvg } from './ChessPieces';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const START_SQUARE = 'b1';
const OBSTACLES: Record<string, 'pawn' | 'toy'> = {
  a4: 'pawn',
  b3: 'toy',
  c2: 'pawn',
  d3: 'toy',
  e2: 'pawn',
  f4: 'toy',
  g5: 'pawn',
  b6: 'toy',
};

interface RaceResult {
  id: number;
  name: string;
  teamId: string;
  teamName: string;
  target: string;
  seconds: number;
  moves: number;
}

interface KnightSpyGameProps {
  theme: BoardThemeId;
  skin: PieceSkin;
  teams: TeamScore[];
}

function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)} giây`;
}

export const KnightSpyGame: React.FC<KnightSpyGameProps> = ({
  theme,
  skin,
  teams,
}) => {
  const [target, setTarget] = useState('e4');
  const [playerName, setPlayerName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [knightSquare, setKnightSquare] = useState(START_SQUARE);
  const [moveCount, setMoveCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<'idle' | 'won' | 'collision'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<RaceResult[]>([]);
  const startedAt = useRef<number | null>(null);
  const nextResultId = useRef(0);

  const themeColors = BOARD_THEMES[theme];
  const validMoves = useMemo(
    () => getKnightMovesFrom(knightSquare),
    [knightSquare],
  );
  const currentTeam = teams.find((team) => team.id === teamId);
  const targetResults = results.filter((result) => result.target === target);
  const fastestResult = targetResults[0];

  useEffect(() => {
    if (!isRunning) return;
    const timerId = window.setInterval(() => {
      if (startedAt.current !== null) {
        setElapsed((performance.now() - startedAt.current) / 1000);
      }
    }, 50);
    return () => window.clearInterval(timerId);
  }, [isRunning]);

  const startAttempt = () => {
    if (!playerName.trim()) {
      setMessage('Hãy nhập tên học sinh trước khi bắt đầu nhiệm vụ.');
      return;
    }
    setKnightSquare(START_SQUARE);
    setMoveCount(0);
    setElapsed(0);
    setStatus('idle');
    setMessage(null);
    startedAt.current = performance.now();
    setIsRunning(true);
    sound.playMove();
  };

  const handleSquareClick = (square: string) => {
    if (!isRunning) return;

    if (!validMoves.includes(square)) {
      sound.playError();
      setMessage('Nước đi chưa đúng hình chữ L. Mã đi 2 ô rồi rẽ 1 ô nhé!');
      return;
    }

    if (OBSTACLES[square]) {
      setIsRunning(false);
      setStatus('collision');
      setMessage(`Va vào chướng ngại vật tại ô ${square}. Hãy bắt đầu lượt mới!`);
      sound.playError();
      return;
    }

    setKnightSquare(square);
    setMoveCount((count) => count + 1);
    setMessage(null);

    if (square === target) {
      const finishTime =
        startedAt.current === null
          ? elapsed
          : (performance.now() - startedAt.current) / 1000;
      const result: RaceResult = {
        id: nextResultId.current++,
        name: playerName.trim(),
        teamId,
        teamName: currentTeam?.name ?? '',
        target,
        seconds: finishTime,
        moves: moveCount + 1,
      };
      setElapsed(finishTime);
      setResults((previous) =>
        [...previous, result].sort((a, b) => a.seconds - b.seconds),
      );
      setIsRunning(false);
      setStatus('won');
      sound.playSuccess();
      confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
    } else {
      sound.playMove();
    }
  };

  const margin = 36;
  const squareSize = 80;
  const boardSize = margin * 2 + squareSize * 8;

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
            aria-label="Bàn cờ nhiệm vụ Điệp viên Mã thần tốc"
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
                const obstacle = OBSTACLES[square];
                const isKnight = knightSquare === square;
                const isTarget = target === square;
                const isValidMove =
                  isRunning && validMoves.includes(square) && !obstacle;

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
                    aria-label={`Ô ${square}${obstacle ? ', có chướng ngại vật' : ''}${isTarget ? ', kho báu' : ''}`}
                    tabIndex={isRunning ? 0 : -1}
                    className={isRunning ? 'cursor-pointer' : ''}
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
                    {isValidMove && (
                      <circle
                        cx={x + squareSize / 2}
                        cy={y + squareSize / 2}
                        r="10"
                        fill="#0f172a"
                        fillOpacity="0.35"
                      />
                    )}
                    {isTarget && (
                      <g>
                        <rect
                          x={x + 3}
                          y={y + 3}
                          width={squareSize - 6}
                          height={squareSize - 6}
                          fill="rgba(250, 204, 21, 0.35)"
                          stroke="#EAB308"
                          strokeWidth="4"
                        />
                        <text
                          x={x + squareSize / 2}
                          y={y + squareSize / 2 + 13}
                          textAnchor="middle"
                          fontSize="42"
                          aria-hidden="true"
                        >
                          💎
                        </text>
                      </g>
                    )}
                    {obstacle && (
                      <g>
                        <rect
                          x={x + 4}
                          y={y + 4}
                          width={squareSize - 8}
                          height={squareSize - 8}
                          rx="10"
                          fill="rgba(244, 63, 94, 0.16)"
                          stroke="#E11D48"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                        />
                        {obstacle === 'pawn' ? (
                          <svg
                            x={x + 12}
                            y={y + 10}
                            width={squareSize - 24}
                            height={squareSize - 20}
                            viewBox="0 0 45 45"
                          >
                            <ChessPieceSvg type="p" color="b" skin={skin} />
                          </svg>
                        ) : (
                          <text
                            x={x + squareSize / 2}
                            y={y + squareSize / 2 + 13}
                            textAnchor="middle"
                            fontSize="38"
                            aria-hidden="true"
                          >
                            🧸
                          </text>
                        )}
                      </g>
                    )}
                    {isKnight && (
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
                          viewBox="0 0 90 90"
                        >
                          <ChessPieceSvg type="n" color="w" skin={skin} />
                        </svg>
                      </g>
                    )}
                    {isRunning && (
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
            <Shield className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-extrabold text-slate-900">
              Điệp viên Mã thần tốc
            </h3>
          </div>
          <p className="text-sm text-slate-600">
            Nhảy theo chữ L đến kho báu. Mã có thể nhảy qua quân cản, nhưng
            không được đáp xuống ô có Tốt hoặc đồ chơi.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {['e4', 'd5'].map((square) => (
              <button
                key={square}
                type="button"
                onClick={() => {
                  if (isRunning) return;
                  setTarget(square);
                  setKnightSquare(START_SQUARE);
                  setMoveCount(0);
                  setStatus('idle');
                  setMessage(null);
                }}
                disabled={isRunning}
                className={`rounded-xl border p-3 text-sm font-bold transition-colors ${
                  target === square
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                } disabled:cursor-not-allowed`}
              >
                💎 Kho báu {square}
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
              <span className="text-xs font-bold text-teal-900">Số lần nhảy</span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-teal-950">
                {moveCount}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startAttempt}
            disabled={isRunning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {status === 'won' || status === 'collision' ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {status === 'won' || status === 'collision'
              ? 'Bắt đầu lượt mới'
              : 'Bắt đầu nhiệm vụ'}
          </button>

          {isRunning && (
            <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-bold text-sky-900">
              {playerName.trim()} đang thực hiện nhiệm vụ đến ô {target}…
            </p>
          )}
          {message && (
            <p
              role="status"
              className={`rounded-xl border p-3 text-sm font-semibold ${
                status === 'collision'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {message}
            </p>
          )}

          {status === 'won' && (
            <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 font-extrabold text-emerald-950">
                <Trophy className="h-5 w-5 text-amber-500" />
                {playerName.trim()} đã lấy được kho báu trong {formatTime(elapsed)}!
              </p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <h4 className="mb-2 text-sm font-extrabold text-slate-800">
                Bảng thành tích nhanh nhất · {target}
            </h4>
            {fastestResult ? (
              <ol className="space-y-2">
                  {targetResults.slice(0, 5).map((result, index) => (
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
                    </span>
                    <span className="shrink-0 font-mono font-extrabold">
                      {formatTime(result.seconds)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">
                Chưa có thành tích. Hãy thi từng lượt để tìm điệp viên nhanh nhất!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
