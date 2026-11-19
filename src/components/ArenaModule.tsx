import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Crown,
  HelpCircle,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Shield,
  Swords,
  Timer,
  Trophy,
  UserPlus,
  Zap,
} from 'lucide-react';
import {
  BoardArrow,
  BoardThemeId,
  ChessPuzzle,
  GradeLevel,
  PieceSkin,
  TeamScore,
} from '../types/chess';
import { BUILTIN_PUZZLES, GRADE_LABELS } from '../data/puzzles';
import { InteractiveBoard } from './InteractiveBoard';
import { TradeScaleGame } from './TradeScaleGame';
import { CoordinateHuntGame } from './CoordinateHuntGame';
import { KnightTourGame } from './KnightTourGame';
import { KnightSpyGame } from './KnightSpyGame';
import { PawnPromotionRaceGame } from './PawnPromotionRaceGame';
import { KingRescueAlarmGame } from './KingRescueAlarmGame';
import { SpeedMathQuizGame } from './SpeedMathQuizGame';
import { PieceType } from './ChessPieces';
import { sound } from '../utils/sound';

interface ArenaModuleProps {
  theme: BoardThemeId;
  skin: PieceSkin;
  teams: TeamScore[];
  onUpdateTeams: (teams: TeamScore[]) => void;
  customPuzzles: ChessPuzzle[];
}

const TEAM_STYLES: Record<
  TeamScore['color'],
  { card: string; badge: string; btn: string }
> = {
  red: {
    card: 'bg-rose-50/80 border-rose-200',
    badge: 'text-rose-700',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  blue: {
    card: 'bg-sky-50/80 border-sky-200',
    badge: 'text-sky-700',
    btn: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  amber: {
    card: 'bg-amber-50/80 border-amber-200',
    badge: 'text-amber-700',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
};

export const ArenaModule: React.FC<ArenaModuleProps> = ({
  theme,
  skin,
  teams,
  onUpdateTeams,
  customPuzzles,
}) => {
  const [subGame, setSubGame] = useState<
    | 'scale'
    | 'puzzle'
    | 'coords'
    | 'knight'
    | 'spy'
    | 'pawn-race'
    | 'king-rescue'
    | 'quiz'
  >('scale');

  // Countdown Timer state
  const [presetSeconds, setPresetSeconds] = useState<number>(20);
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Team editing state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Puzzle challenge state
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel>('all');
  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [boardFen, setBoardFen] = useState<string>(BUILTIN_PUZZLES[0].fen);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState<boolean>(false);

  const solvablePuzzles = useMemo(() => {
    const all = [...BUILTIN_PUZZLES, ...customPuzzles];
    if (gradeFilter === 'all') return all;
    return all.filter((p) => p.grade === gradeFilter);
  }, [gradeFilter, customPuzzles]);

  const currentPuzzle =
    solvablePuzzles[puzzleIdx] || solvablePuzzles[0] || BUILTIN_PUZZLES[0];

  const loadPuzzleAt = useCallback(
    (index: number, list: ChessPuzzle[]) => {
      const target = list[index] || list[0];
      if (!target) return;
      setPuzzleIdx(index);
      setBoardFen(target.fen);
      setPuzzleStatus('playing');
      setArrows([]);
      setLastMove(null);
    },
    [],
  );

  // Sync when filter changes
  useEffect(() => {
    loadPuzzleAt(0, solvablePuzzles);
  }, [gradeFilter, solvablePuzzles.length, loadPuzzleAt]);

  // Countdown timer loop
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          sound.playTimeUp();
          return 0;
        }
        const next = prev - 1;
        if (next <= 5) {
          sound.playTick(true);
        } else {
          sound.playTick(false);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // Keyboard shortcuts: Space (timer start/pause), F (flip board)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (secondsLeft === 0) {
          setSecondsLeft(presetSeconds);
          setTimerRunning(true);
        } else {
          setTimerRunning((r) => !r);
        }
      } else if (e.key.toLowerCase() === 'f' && subGame === 'puzzle') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [secondsLeft, presetSeconds, subGame]);

  const handleSelectPreset = (sec: number) => {
    setPresetSeconds(sec);
    setSecondsLeft(sec);
    setTimerRunning(false);
  };

  const handleTeamStars = (teamId: string, delta: number) => {
    const updated = teams.map((t) =>
      t.id === teamId ? { ...t, stars: Math.max(0, t.stars + delta) } : t,
    );
    onUpdateTeams(updated);
    if (delta > 0) {
      sound.playSuccess();
    } else {
      sound.playMove();
    }
  };

  const handleAddThirdTeam = () => {
    if (teams.length >= 3) return;
    onUpdateTeams([
      ...teams,
      { id: 'team-amber', name: 'Đại Bàng Vàng', color: 'amber', stars: 0 },
    ]);
  };

  const handleRemoveThirdTeam = () => {
    if (teams.length <= 2) return;
    onUpdateTeams(teams.slice(0, 2));
  };

  const handleStartEditTeam = (team: TeamScore) => {
    setEditingTeamId(team.id);
    setEditingName(team.name);
  };

  const handleCommitEditTeam = () => {
    if (!editingTeamId) return;
    if (editingName.trim()) {
      onUpdateTeams(
        teams.map((t) =>
          t.id === editingTeamId ? { ...t, name: editingName.trim() } : t,
        ),
      );
    }
    setEditingTeamId(null);
  };

  const handlePuzzleMove = (from: string, to: string, promotion?: PieceType): boolean => {
    if (puzzleStatus === 'solved') return false;
    try {
      const chess = new Chess(boardFen);
      const moveObj = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion || 'q',
      });
      if (!moveObj) {
        sound.playError();
        return false;
      }

      const uci = `${from}${to}`;
      const hasSolutions = currentPuzzle.solutionMoves.length > 0;
      const isCorrect =
        !hasSolutions ||
        currentPuzzle.solutionMoves.includes(uci) ||
        currentPuzzle.solutionMoves.includes(`${uci}${promotion || ''}`);

      if (isCorrect) {
        setBoardFen(chess.fen());
        setLastMove({ from, to });
        setPuzzleStatus('solved');
        setArrows([{ from, to, color: 'green' }]);
        sound.playSuccess();
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
        return true;
      } else {
        // Wrong move: gentle feedback & reset to puzzle start
        sound.playError();
        setPuzzleStatus('wrong');
        return false;
      }
    } catch {
      sound.playError();
      return false;
    }
  };

  const handleShowHint = () => {
    if (currentPuzzle.hintArrow) {
      setArrows([
        {
          from: currentPuzzle.hintArrow[0],
          to: currentPuzzle.hintArrow[1],
          color: 'yellow',
        },
      ]);
    } else if (currentPuzzle.solutionMoves[0]) {
      const m = currentPuzzle.solutionMoves[0];
      setArrows([{ from: m.slice(0, 2), to: m.slice(2, 4), color: 'yellow' }]);
    }
    sound.playMove();
  };

  return (
    <div className="space-y-5">
      {/* TOP BAR: TEAM SCOREBOARD + COUNTDOWN TIMER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Teams Race Panel */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Bảng Thi Đua Đội</h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                (Bấm vào tên đội để đổi tên)
              </span>
            </div>
            {teams.length < 3 ? (
              <button
                type="button"
                onClick={handleAddThirdTeam}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Thêm đội 3
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemoveThirdTeam}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                Thu gọn 2 đội
              </button>
            )}
          </div>

          <div
            className={`grid gap-3 ${
              teams.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {teams.map((team) => {
              const st = TEAM_STYLES[team.color];
              const isEditing = editingTeamId === team.id;
              return (
                <div
                  key={team.id}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${st.card}`}
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleCommitEditTeam}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitEditTeam();
                        }}
                        className="w-full px-2 py-1 text-sm font-bold bg-white border border-slate-300 rounded"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEditTeam(team)}
                        className={`text-left text-base font-extrabold truncate block w-full hover:underline cursor-pointer ${st.badge}`}
                      >
                        {team.name}
                      </button>
                    )}
                    <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                      ⭐ {team.stars}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTeamStars(team.id, -1)}
                      aria-label={`Trừ 1 sao đội ${team.name}`}
                      className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTeamStars(team.id, 1)}
                      aria-label={`Cộng 1 sao đội ${team.name}`}
                      className={`h-10 px-3.5 rounded-lg font-extrabold text-sm flex items-center gap-1 shadow-xs cursor-pointer ${st.btn}`}
                    >
                      <Plus className="w-4 h-4" />1 ⭐
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Countdown Timer Panel */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Đồng hồ đếm ngược</h2>
            </div>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg">
              {[15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleSelectPreset(sec)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono cursor-pointer ${
                    presetSeconds === sec
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div
              className={`text-4xl font-extrabold font-mono tabular-nums tracking-tight ${
                secondsLeft <= 5 && secondsLeft > 0
                  ? 'text-rose-600'
                  : secondsLeft === 0
                    ? 'text-rose-700'
                    : 'text-slate-900'
              }`}
            >
              00:{String(secondsLeft).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (secondsLeft === 0) {
                    setSecondsLeft(presetSeconds);
                    setTimerRunning(true);
                  } else {
                    setTimerRunning((r) => !r);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-white cursor-pointer whitespace-nowrap ${
                  timerRunning
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {timerRunning ? 'Tạm dừng' : 'Bắt đầu'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(presetSeconds);
                }}
                title="Đặt lại đồng hồ"
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Phím{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono">
              Space
            </kbd>{' '}
            để Bắt đầu / Tạm dừng · Tíc-tắc 5 giây cuối
          </p>
        </div>
      </div>

      {/* GAME SELECTOR TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
        <button
          type="button"
          onClick={() => setSubGame('scale')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'scale'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          Cái Cân Công Lý
        </button>

        <button
          type="button"
          onClick={() => setSubGame('puzzle')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'puzzle'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Swords className="w-4 h-4" />
          Giải Thế Cờ ({BUILTIN_PUZZLES.length + customPuzzles.length})
        </button>

        <button
          type="button"
          onClick={() => setSubGame('coords')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'coords'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          Truy Tìm Tọa Độ
        </button>

        <button
          type="button"
          onClick={() => setSubGame('knight')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'knight'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          Mã Phi Nước Đại
        </button>

        <button
          type="button"
          onClick={() => setSubGame('spy')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'spy'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          Điệp viên Mã thần tốc
        </button>

        <button
          type="button"
          onClick={() => setSubGame('pawn-race')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'pawn-race'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Crown className="w-4 h-4" />
          Cuộc đua Phong cấp của Tốt
        </button>

        <button
          type="button"
          onClick={() => setSubGame('king-rescue')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'king-rescue'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          Báo động cứu Vua!
        </button>

        <button
          type="button"
          onClick={() => setSubGame('quiz')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            subGame === 'quiz'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          Tính Điểm Siêu Tốc
        </button>
      </div>

      {/* GAME CONTENT */}
      {subGame === 'scale' && (
        <TradeScaleGame
          skin={skin}
          onAwardActiveTeam={() => {
            if (teams[0]) handleTeamStars(teams[0].id, 1);
          }}
        />
      )}

      {subGame === 'coords' && (
        <CoordinateHuntGame
          theme={theme}
          teams={teams}
          onAwardTeam={handleTeamStars}
        />
      )}

      {subGame === 'knight' && (
        <KnightTourGame
          theme={theme}
          skin={skin}
          teams={teams}
          onAwardTeam={handleTeamStars}
        />
      )}

      {subGame === 'spy' && (
        <KnightSpyGame
          theme={theme}
          skin={skin}
          teams={teams}
        />
      )}

      {subGame === 'pawn-race' && (
        <PawnPromotionRaceGame
          theme={theme}
          skin={skin}
          teams={teams}
        />
      )}

      {subGame === 'king-rescue' && (
        <KingRescueAlarmGame
          theme={theme}
          skin={skin}
          teams={teams}
          onAwardTeam={handleTeamStars}
        />
      )}

      {subGame === 'quiz' && (
        <SpeedMathQuizGame
          skin={skin}
          teams={teams}
          onAwardTeam={handleTeamStars}
        />
      )}

      {subGame === 'puzzle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: PUZZLE BOARD */}
          <div className="lg:col-span-7 xl:col-span-7">
            <InteractiveBoard
              fen={boardFen}
              flipped={flipped}
              theme={theme}
              skin={skin}
              arrows={arrows}
              lastMove={lastMove}
              disabled={puzzleStatus === 'solved'}
              onMove={handlePuzzleMove}
            />
          </div>

          {/* RIGHT: GRADE FILTER + PUZZLE INFO + FEEDBACK */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            {/* Grade Level Filter */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-slate-800">Chọn cấp độ bài tập:</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'k12', 'k3', 'k45'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeFilter(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      gradeFilter === g
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {GRADE_LABELS[g]}
                  </button>
                ))}
                {customPuzzles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setGradeFilter('custom')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      gradeFilter === 'custom'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Của giáo viên ({customPuzzles.length})
                  </button>
                )}
              </div>
            </div>

            {/* Active Puzzle Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-teal-700">
                  Bài {puzzleIdx + 1} / {solvablePuzzles.length} ·{' '}
                  {GRADE_LABELS[currentPuzzle.grade]}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      loadPuzzleAt(
                        (puzzleIdx - 1 + solvablePuzzles.length) % solvablePuzzles.length,
                        solvablePuzzles,
                      )
                    }
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    title="Bài trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      loadPuzzleAt(
                        (puzzleIdx + 1) % solvablePuzzles.length,
                        solvablePuzzles,
                      )
                    }
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    title="Bài tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900">
                {currentPuzzle.title}
              </h3>

              {/* Turn & Prompt */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800">
                Nhiệm vụ: Hãy kéo quân Trắng đi nước chính xác nhất trên bàn cờ!
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleShowHint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-sm font-bold cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  Xem gợi ý
                </button>
                <button
                  type="button"
                  onClick={() => loadPuzzleAt(puzzleIdx, solvablePuzzles)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Thử lại bài này
                </button>
              </div>

              {/* Feedback Boxes */}
              {puzzleStatus === 'wrong' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                  <p className="font-bold text-base">Chưa chính xác rồi!</p>
                  <p className="text-sm mt-1">
                    Các em hãy quan sát lại xem quân nào của Đen chưa được bảo vệ hoặc ta đổi quân nào lời điểm hơn nhé.
                  </p>
                </div>
              )}

              {puzzleStatus === 'solved' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3">
                  <div>
                    <p className="text-lg font-extrabold text-emerald-800">
                      Tuyệt vời! Chính xác!
                    </p>
                    <p className="text-base font-extrabold font-mono text-emerald-900 mt-1">
                      {currentPuzzle.tradeFormula}
                    </p>
                    <p className="text-sm text-emerald-900 mt-1.5 leading-relaxed">
                      {currentPuzzle.explanation}
                    </p>
                  </div>

                  {/* Quick Team Star Award */}
                  <div className="pt-2 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {teams.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTeamStars(t.id, 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-xs font-bold text-emerald-900 cursor-pointer"
                        >
                          +1 ⭐ {t.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        loadPuzzleAt(
                          (puzzleIdx + 1) % solvablePuzzles.length,
                          solvablePuzzles,
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
                    >
                      Bài tiếp theo →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Puzzle Jump List */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-500 mb-2">
                Chuyển nhanh thế cờ:
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {solvablePuzzles.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadPuzzleAt(idx, solvablePuzzles)}
                    title={p.title}
                    className={`py-2 rounded-lg text-xs font-bold font-mono border cursor-pointer ${
                      idx === puzzleIdx
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
