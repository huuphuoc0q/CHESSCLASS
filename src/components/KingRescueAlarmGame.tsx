import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { Bell, RotateCcw, Timer, Trophy } from 'lucide-react';
import {
  BoardArrow,
  BoardThemeId,
  PieceSkin,
  TeamScore,
} from '../types/chess';
import { getCheckedKingSquare } from '../utils/fen';
import { sound } from '../utils/sound';
import { InteractiveBoard } from './InteractiveBoard';

type RescueCommand = 'capture' | 'block' | 'run';
type RoundStatus =
  | 'ready'
  | 'awaiting-command'
  | 'making-move'
  | 'won'
  | 'timeout';

interface RescueScenario {
  id: string;
  fen: string;
  arrow: BoardArrow;
}

interface RescueResult {
  id: number;
  scenarioId: string;
  name: string;
  teamName: string;
  seconds: number;
  command: RescueCommand;
}

interface KingRescueAlarmGameProps {
  theme: BoardThemeId;
  skin: PieceSkin;
  teams: TeamScore[];
  onAwardTeam: (teamId: string, delta: number) => void;
}

const SCENARIOS: RescueScenario[] = [
  {
    id: 'scenario-1',
    fen: 'k7/8/8/8/8/3n4/4Q3/4K3 w - - 0 1',
    arrow: { from: 'd3', to: 'e1', color: 'red' },
  },
  {
    id: 'scenario-2',
    fen: 'k3r3/8/8/8/8/8/1Q6/4K3 w - - 0 1',
    arrow: { from: 'e8', to: 'e1', color: 'red' },
  },
  {
    id: 'scenario-3',
    fen: 'k3r3/8/8/8/8/8/8/4K3 w - - 0 1',
    arrow: { from: 'e8', to: 'e1', color: 'red' },
  },
];

const COMMAND_LABELS: Record<RescueCommand, string> = {
  capture: 'BẮT!',
  block: 'CHE!',
  run: 'CHẠY!',
};

const COMMAND_HELP: Record<RescueCommand, string> = {
  capture: 'Tiêu diệt quân đang chiếu',
  block: 'Che chắn đường chiếu',
  run: 'Chạy Vua đến ô an toàn',
};

function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)} giây`;
}

export const KingRescueAlarmGame: React.FC<KingRescueAlarmGameProps> = ({
  theme,
  skin,
  teams,
  onAwardTeam,
}) => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = SCENARIOS[scenarioIndex];
  const [boardFen, setBoardFen] = useState(scenario.fen);
  const [participantName, setParticipantName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<RescueCommand | null>(null);
  const [roundStatus, setRoundStatus] = useState<RoundStatus>('ready');
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [message, setMessage] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [results, setResults] = useState<RescueResult[]>([]);
  const [awardGranted, setAwardGranted] = useState(false);
  const timerRunning = roundStatus === 'awaiting-command' || roundStatus === 'making-move';
  const startTime = useRef<number | null>(null);
  const deadline = useRef<number | null>(null);
  const nextResultId = useRef(0);

  const currentTeam = teams.find((team) => team.id === teamId);
  const kingSquare = getCheckedKingSquare(scenario.fen);
  const checkArrows = roundStatus === 'ready' ? [scenario.arrow] : [];
  const scenarioResults = useMemo(
    () => results.filter((result) => result.scenarioId === scenario.id),
    [results, scenario.id],
  );
  const bestResult = scenarioResults[0];

  useEffect(() => {
    if (!timerRunning) return;
    const timerId = window.setInterval(() => {
      if (deadline.current === null) return;
      const remaining = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setRoundStatus('timeout');
        setMessage('Hết 10 giây! Hãy thử cứu Vua ở lượt tiếp theo.');
        sound.playTimeUp();
      } else if (remaining <= 5) {
        sound.playTick(true);
      }
    }, 100);
    return () => window.clearInterval(timerId);
  }, [timerRunning]);

  const resetRound = (nextScenarioIndex = scenarioIndex) => {
    const nextScenario = SCENARIOS[nextScenarioIndex];
    setScenarioIndex(nextScenarioIndex);
    setBoardFen(nextScenario.fen);
    setSelectedCommand(null);
    setRoundStatus('ready');
    setSecondsLeft(10);
    setMessage(null);
    setLastMove(null);
    setAwardGranted(false);
    startTime.current = null;
    deadline.current = null;
  };

  const ringBell = () => {
    if (!participantName.trim()) {
      setMessage('Nhập tên học sinh trước khi bấm chuông nhé.');
      return;
    }
    setBoardFen(scenario.fen);
    setSelectedCommand(null);
    setLastMove(null);
    setSecondsLeft(10);
    setMessage('Đã bấm chuông! Hãy hô khẩu lệnh cứu Vua.');
    setAwardGranted(false);
    startTime.current = performance.now();
    deadline.current = startTime.current + 10_000;
    setRoundStatus('awaiting-command');
    sound.playCheck();
  };

  const chooseCommand = (command: RescueCommand) => {
    if (roundStatus !== 'awaiting-command') return;
    setSelectedCommand(command);
    setRoundStatus('making-move');
    setMessage(`Đã hô “${COMMAND_LABELS[command]}” — hãy thực hiện nước đi!`);
    sound.playMove();
  };

  const handleMove = (from: string, to: string, promotion?: string): boolean => {
    if (
      roundStatus !== 'making-move' ||
      !selectedCommand ||
      deadline.current === null
    ) {
      return false;
    }

    if (performance.now() >= deadline.current) {
      setSecondsLeft(0);
      setRoundStatus('timeout');
      setMessage('Hết 10 giây! Hãy thử cứu Vua ở lượt tiếp theo.');
      sound.playTimeUp();
      return false;
    }

    const chess = new Chess(boardFen);
    const checkedKing = getCheckedKingSquare(boardFen);
    if (!checkedKing) {
      setMessage('Thế cờ này không còn Vua đang bị chiếu. Hãy chọn thế cờ khác.');
      sound.playError();
      return false;
    }

    const attackingPieces = chess.attackers(
      checkedKing as Square,
      chess.turn() === 'w' ? 'b' : 'w',
    );
    const movingPiece = chess.get(from as Square);
    if (!movingPiece) return false;

    try {
      const move = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion || 'q',
      });
      const actualCommand: RescueCommand = attackingPieces.includes(move.to)
        ? 'capture'
        : movingPiece.type === 'k'
          ? 'run'
          : 'block';

      if (actualCommand !== selectedCommand) {
        setMessage(
          `Nước đi hợp lệ nhưng chưa khớp khẩu lệnh “${COMMAND_LABELS[selectedCommand]}”. Hãy thử nước khác trước khi hết giờ.`,
        );
        sound.playError();
        return false;
      }

      const secondsUsed =
        startTime.current === null
          ? 0
          : (performance.now() - startTime.current) / 1000;
      setBoardFen(chess.fen());
      setLastMove({ from, to });
      setSecondsLeft(Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000)));
      setRoundStatus('won');
      setMessage(`Giải cứu thành công bằng lệnh “${COMMAND_LABELS[actualCommand]}”!`);
      setResults((previous) =>
        [...previous, {
          id: nextResultId.current++,
          scenarioId: scenario.id,
          name: participantName.trim(),
          teamName: currentTeam?.name ?? '',
          seconds: secondsUsed,
          command: actualCommand,
        }].sort((a, b) => a.seconds - b.seconds),
      );
      sound.playSuccess();
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      return true;
    } catch {
      setMessage('Không thể thực hiện nước đi này. Hãy chọn một nước đi hợp lệ.');
      sound.playError();
      return false;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7">
        <InteractiveBoard
          fen={boardFen}
          theme={theme}
          skin={skin}
          arrows={checkArrows}
          lastMove={lastMove}
          disabled={roundStatus !== 'making-move'}
          onMove={handleMove}
        />
      </div>

      <div className="lg:col-span-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-extrabold text-slate-900">
              Báo động cứu Vua!
            </h3>
          </div>
          <p className="text-sm text-slate-600">
            Vua Trắng đang bị chiếu. Bấm chuông, hô đúng khẩu lệnh rồi thực hiện
            nước đi cứu Vua trong 10 giây.
          </p>

          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => resetRound(index)}
                disabled={timerRunning}
                className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                  scenarioIndex === index
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Thế cờ {index + 1}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-700">
              Tên học sinh
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                disabled={timerRunning}
                placeholder="Nhập tên người chơi"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:bg-slate-100"
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Đội (không bắt buộc)
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                disabled={timerRunning}
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

          <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Timer className="h-4 w-4" />
              Thời gian còn lại
            </div>
            <span
              className={`font-mono text-4xl font-black tabular-nums ${
                secondsLeft <= 3 && timerRunning ? 'text-rose-300' : 'text-amber-300'
              }`}
              aria-live="polite"
            >
              {secondsLeft}s
            </span>
          </div>

          <button
            type="button"
            onClick={ringBell}
            disabled={timerRunning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {roundStatus === 'won' || roundStatus === 'timeout' ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {roundStatus === 'won' || roundStatus === 'timeout'
              ? 'Bắt đầu lượt mới'
              : 'BẤM CHUÔNG!'}
          </button>

          {(roundStatus === 'awaiting-command' ||
            roundStatus === 'making-move') && (
            <div className="grid grid-cols-3 gap-2">
              {(['capture', 'block', 'run'] as const).map((command) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => chooseCommand(command)}
                  disabled={roundStatus !== 'awaiting-command'}
                  className={`rounded-xl border p-3 text-center disabled:cursor-not-allowed ${
                    selectedCommand === command
                      ? 'border-amber-400 bg-amber-50 text-amber-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-base font-black">
                    {COMMAND_LABELS[command]}
                  </span>
                  <span className="mt-1 block text-[10px] leading-tight">
                    {COMMAND_HELP[command]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {message && (
            <p
              role="status"
              className={`rounded-xl border p-3 text-sm font-semibold ${
                roundStatus === 'won'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : roundStatus === 'timeout'
                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                    : 'border-sky-200 bg-sky-50 text-sky-900'
              }`}
            >
              {message}
            </p>
          )}

          {roundStatus === 'won' && (
            <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 font-extrabold text-emerald-950">
                <Trophy className="h-5 w-5 text-amber-500" />
                {participantName.trim()} cứu Vua trong{' '}
                {formatTime(
                  results.find((result) => result.id === nextResultId.current - 1)
                    ?.seconds ?? 0,
                )}
              </p>
              {currentTeam && (
                <button
                  type="button"
                  onClick={() => {
                    if (awardGranted) return;
                    onAwardTeam(currentTeam.id, 1);
                    setAwardGranted(true);
                  }}
                  disabled={awardGranted}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {awardGranted ? 'Đã cộng 1 ⭐' : `+1 ⭐ cho ${currentTeam.name}`}
                </button>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <h4 className="mb-2 text-sm font-extrabold text-slate-800">
              Thành tích nhanh nhất · Thế cờ {scenarioIndex + 1}
            </h4>
            {bestResult ? (
              <ol className="space-y-2">
                {scenarioResults.slice(0, 5).map((result, index) => (
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
                        ({COMMAND_LABELS[result.command]})
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
                Chưa có thành tích cho thế cờ này.
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {kingSquare ? `Vua đang bị chiếu tại ô ${kingSquare}.` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
