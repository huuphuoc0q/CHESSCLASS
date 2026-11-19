import React, { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Crosshair, Eye, EyeOff, Flame, Play, RotateCcw, Trophy } from 'lucide-react';
import { BOARD_THEMES, BoardThemeId, TeamScore } from '../types/chess';
import { sound } from '../utils/sound';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function randomSquare(exclude?: string): string {
  let sq = '';
  do {
    const f = FILES[Math.floor(Math.random() * 8)];
    const r = RANKS[Math.floor(Math.random() * 8)];
    sq = `${f}${r}`;
  } while (sq === exclude);
  return sq;
}

interface CoordinateHuntGameProps {
  theme: BoardThemeId;
  teams: TeamScore[];
  onAwardTeam: (teamId: string, delta: number) => void;
}

export const CoordinateHuntGame: React.FC<CoordinateHuntGameProps> = ({
  theme,
  teams,
  onAwardTeam,
}) => {
  const [targetSq, setTargetSq] = useState<string>(() => randomSquare());
  const [showCoords, setShowCoords] = useState<boolean>(true);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    sq: string;
    ok: boolean;
    hint?: string;
  } | null>(null);

  // Quick 30s Sprint Mode
  const [sprintActive, setSprintActive] = useState<boolean>(false);
  const [sprintTime, setSprintTime] = useState<number>(30);
  const [sprintFinished, setSprintFinished] = useState<boolean>(false);

  const themeColors = BOARD_THEMES[theme];
  const orderedFiles = useMemo(() => (flipped ? [...FILES].reverse() : FILES), [flipped]);
  const orderedRanks = useMemo(() => (flipped ? [...RANKS].reverse() : RANKS), [flipped]);

  useEffect(() => {
    if (!sprintActive) return;
    const id = window.setInterval(() => {
      setSprintTime((prev) => {
        if (prev <= 1) {
          setSprintActive(false);
          setSprintFinished(true);
          sound.playTimeUp();
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
          return 0;
        }
        if (prev - 1 <= 5) sound.playTick(true);
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sprintActive]);

  const startSprint = useCallback(() => {
    setScore(0);
    setStreak(0);
    setSprintTime(30);
    setSprintFinished(false);
    setSprintActive(true);
    setFeedback(null);
    setTargetSq(randomSquare());
    sound.playMove();
  }, []);

  const handleSquareClick = (sq: string) => {
    if (sprintFinished) return;

    if (sq === targetSq) {
      const nextStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setFeedback({ sq, ok: true });

      if (nextStreak % 5 === 0) {
        sound.playSuccess();
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.65 } });
      } else {
        sound.playCheck();
      }

      const nextTarget = randomSquare(sq);
      setTargetSq(nextTarget);
      window.setTimeout(() => {
        setFeedback((curr) => (curr && curr.sq === sq ? null : curr));
      }, 450);
    } else {
      setStreak(0);
      sound.playError();
      setFeedback({
        sq,
        ok: false,
        hint: `Bạn vừa bấm ô ${sq}. Hãy tìm Cột ${targetSq[0]} · Hàng ${targetSq[1]}!`,
      });
    }
  };

  const MARGIN = showCoords ? 44 : 12;
  const SQ = 100;
  const TOTAL = MARGIN * 2 + SQ * 8;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: INTERACTIVE COORDINATE BOARD */}
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

            {showCoords &&
              orderedFiles.map((file, idx) => {
                const cx = MARGIN + idx * SQ + SQ / 2;
                return (
                  <g key={`cf-${file}`}>
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

            {showCoords &&
              orderedRanks.map((rank, idx) => {
                const cy = MARGIN + idx * SQ + SQ / 2 + 8;
                return (
                  <g key={`cr-${rank}`}>
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

            {orderedRanks.map((rank, rIdx) =>
              orderedFiles.map((file, fIdx) => {
                const sq = `${file}${rank}`;
                const isLight = (rIdx + fIdx) % 2 === 0;
                const x = MARGIN + fIdx * SQ;
                const y = MARGIN + rIdx * SQ;
                const isFeedback = feedback?.sq === sq;

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
                    {isFeedback && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={SQ - 4}
                        height={SQ - 4}
                        fill={
                          feedback.ok
                            ? 'rgba(16, 185, 129, 0.65)'
                            : 'rgba(225, 29, 72, 0.58)'
                        }
                        stroke={feedback.ok ? '#059669' : '#E11D48'}
                        strokeWidth="5"
                      />
                    )}
                    {/* Subtle hover highlight */}
                    <rect
                      x={x}
                      y={y}
                      width={SQ}
                      height={SQ}
                      fill="transparent"
                      className="hover:fill-white/20 transition-colors"
                    />
                  </g>
                );
              }),
            )}
          </svg>
        </div>
      </div>

      {/* RIGHT: TARGET RADAR & GAME HUD */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-extrabold text-slate-900">
                Truy Tìm Tọa Độ Siêu Tốc
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCoords((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
            >
              {showCoords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showCoords ? 'Ẩn chữ (Khó)' : 'Hiện chữ (Dễ)'}
            </button>
          </div>

          {/* Giant Target Square Display */}
          <div className="rounded-2xl bg-slate-900 text-white p-6 text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Hãy chạm vào ô cờ:
            </p>
            <p className="text-6xl font-extrabold font-mono tracking-wider text-amber-300">
              {targetSq}
            </p>
            <p className="text-sm text-slate-300">
              Cột <span className="font-bold text-white">{targetSq[0]}</span> · Hàng{' '}
              <span className="font-bold text-white">{targetSq[1]}</span>
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <p className="text-xs font-semibold text-teal-800">Số ô đúng</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-teal-900">
                {score}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                Chuỗi
              </p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-amber-900">
                x{streak}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600">Kỷ lục</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                {bestStreak}
              </p>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && !feedback.ok && feedback.hint && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold">
              {feedback.hint}
            </div>
          )}

          {/* Sprint Mode Controls */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Thi đua 30 giây siêu tốc
                </p>
                <p className="text-xs text-slate-500">
                  Mỗi đội lên bảng thi xem 30 giây bấm được bao nhiêu ô!
                </p>
              </div>
              {sprintActive && (
                <span className="text-2xl font-extrabold font-mono tabular-nums text-rose-600">
                  {sprintTime}s
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startSprint}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {sprintActive ? 'Chơi lại 30s' : 'Bắt đầu vòng 30s'}
              </button>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Lật bàn cờ
              </button>
              <button
                type="button"
                onClick={() => {
                  setSprintActive(false);
                  setSprintFinished(false);
                  setScore(0);
                  setStreak(0);
                  setFeedback(null);
                  setTargetSq(randomSquare());
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Đặt lại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {sprintFinished && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base">
                <Trophy className="w-5 h-5 text-amber-500" />
                Hết giờ! Kết quả: {score} ô chính xác!
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onAwardTeam(t.id, 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-xs font-bold text-emerald-900 cursor-pointer"
                  >
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
