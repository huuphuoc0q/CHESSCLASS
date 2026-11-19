import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import { PIECE_SPECS, PieceSkin } from '../types/chess';
import { ChessPieceSvg } from './ChessPieces';
import { sound } from '../utils/sound';

type TradePieceType = 'p' | 'n' | 'b' | 'r' | 'q';

const TRADE_PIECES: TradePieceType[] = ['p', 'n', 'b', 'r', 'q'];

interface ScaleChallenge {
  id: string;
  prompt: string;
  initialWhite: TradePieceType[];
  initialBlack: TradePieceType[];
  targetRule: 'white_win' | 'equal';
  hint: string;
}

const SCALE_CHALLENGES: ScaleChallenge[] = [
  {
    id: 'free',
    prompt: 'Chế độ tự do: Thử đặt quân lên hai đĩa cân để so sánh điểm!',
    initialWhite: [],
    initialBlack: [],
    targetRule: 'white_win',
    hint: 'Chọn hoặc kéo các quân cờ vào đĩa cân bên Trắng hoặc Đen.',
  },
  {
    id: 'ch-1',
    prompt: 'Thử thách 1: Đen đã ăn Xe (5đ). Trắng hãy ăn lại 2 quân sao cho LỜI điểm!',
    initialWhite: [],
    initialBlack: ['r'],
    targetRule: 'white_win',
    hint: 'Ví dụ: Mã (3đ) + Tượng (3đ) = 6đ > Xe (5đ), lời +1đ!',
  },
  {
    id: 'ch-2',
    prompt: 'Thử thách 2: Đen đã ăn Hậu (9đ). Trắng cần ăn những quân gì để HÒA hoặc LỜI?',
    initialWhite: [],
    initialBlack: ['q'],
    targetRule: 'white_win',
    hint: 'Xe (5đ) + Xe (5đ) = 10đ > Hậu (9đ) => Lời +1đ!',
  },
  {
    id: 'ch-3',
    prompt: 'Thử thách 3: Đen đã ăn Mã (3đ) + Tốt (1đ) = 4đ. Trắng ăn quân gì để LỜI +1đ?',
    initialWhite: [],
    initialBlack: ['n', 'p'],
    targetRule: 'white_win',
    hint: 'Trắng chỉ cần ăn 1 quân Xe (5đ) là lời ngay +1 điểm!',
  },
];

interface TradeScaleGameProps {
  skin: PieceSkin;
  onAwardActiveTeam?: () => void;
}

export const TradeScaleGame: React.FC<TradeScaleGameProps> = ({
  skin,
  onAwardActiveTeam,
}) => {
  const [whiteCaptures, setWhiteCaptures] = useState<TradePieceType[]>(['r']);
  const [blackCaptures, setBlackCaptures] = useState<TradePieceType[]>(['n', 'p']);
  const [activeSideTarget, setActiveSideTarget] = useState<'white' | 'black'>('white');
  const [activeChallengeId, setActiveChallengeId] = useState<string>('free');
  const [dragOverSide, setDragOverSide] = useState<'white' | 'black' | null>(null);
  const [celebratedKey, setCelebratedKey] = useState<string>('');

  const whiteScore = useMemo(
    () => whiteCaptures.reduce((acc, p) => acc + PIECE_SPECS[p].points, 0),
    [whiteCaptures],
  );
  const blackScore = useMemo(
    () => blackCaptures.reduce((acc, p) => acc + PIECE_SPECS[p].points, 0),
    [blackCaptures],
  );

  const diff = whiteScore - blackScore;
  // Positive diff -> white pan is heavier -> tilts LEFT (negative angle in CSS)
  const tiltAngle = Math.max(-16, Math.min(16, -diff * 2.4));

  const formatSideExpression = (list: TradePieceType[]) => {
    if (list.length === 0) return '0đ';
    return list.map((t) => `${PIECE_SPECS[t].nameVi} (${PIECE_SPECS[t].points})`).join(' + ');
  };

  const triggerFireworks = () => {
    sound.playSuccess();
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
    });
  };

  const addPieceToSide = (piece: TradePieceType, side: 'white' | 'black') => {
    const nextWhite = side === 'white' ? [...whiteCaptures, piece] : whiteCaptures;
    const nextBlack = side === 'black' ? [...blackCaptures, piece] : blackCaptures;

    if (side === 'white') {
      setWhiteCaptures(nextWhite);
    } else {
      setBlackCaptures(nextBlack);
    }

    const wTotal = nextWhite.reduce((s, p) => s + PIECE_SPECS[p].points, 0);
    const bTotal = nextBlack.reduce((s, p) => s + PIECE_SPECS[p].points, 0);
    sound.playCapture();

    if (activeChallengeId !== 'free' && side === 'white' && wTotal > bTotal) {
      const key = `${activeChallengeId}-${wTotal}-${bTotal}`;
      if (celebratedKey !== key) {
        setCelebratedKey(key);
        setTimeout(() => triggerFireworks(), 180);
      }
    }
  };

  const removePieceAt = (side: 'white' | 'black', idx: number) => {
    if (side === 'white') {
      setWhiteCaptures((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setBlackCaptures((prev) => prev.filter((_, i) => i !== idx));
    }
    sound.playMove();
  };

  const loadChallenge = (ch: ScaleChallenge) => {
    setActiveChallengeId(ch.id);
    setWhiteCaptures([...ch.initialWhite]);
    setBlackCaptures([...ch.initialBlack]);
    setActiveSideTarget('white');
    setCelebratedKey('');
    sound.playMove();
  };

  const activeChallenge =
    SCALE_CHALLENGES.find((c) => c.id === activeChallengeId) || SCALE_CHALLENGES[0];

  return (
    <div className="space-y-5">
      {/* Challenge Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {SCALE_CHALLENGES.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => loadChallenge(ch)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                activeChallengeId === ch.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {idx === 0 ? 'Tự do khám phá' : `Thử thách ${idx}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setWhiteCaptures([]);
            setBlackCaptures([]);
            setCelebratedKey('');
            sound.playMove();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Làm trống cân
        </button>
      </div>

      {/* Prompt Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-amber-950">{activeChallenge.prompt}</p>
          <p className="text-xs sm:text-sm text-amber-800 mt-0.5">{activeChallenge.hint}</p>
        </div>
        {diff > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerFireworks();
              onAwardActiveTeam?.();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Chúc mừng & Pháo hoa!
          </button>
        )}
      </div>

      {/* Main Physics Balance Stage */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        {/* Top Score Headers */}
        <div className="grid grid-cols-3 items-center gap-4 mb-2">
          <div
            onClick={() => setActiveSideTarget('white')}
            className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-colors ${
              activeSideTarget === 'white'
                ? 'border-teal-500 bg-teal-50/70'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Quân Trắng ăn được
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-teal-700 font-mono tabular-nums mt-0.5">
              {whiteScore}đ
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cái Cân Công Lý
            </p>
            <p className="text-lg sm:text-2xl font-extrabold font-mono tabular-nums mt-1 text-slate-900">
              {diff > 0
                ? `Trắng lời +${diff}đ`
                : diff < 0
                  ? `Đen lời +${Math.abs(diff)}đ`
                  : 'Cân bằng (0đ)'}
            </p>
          </div>

          <div
            onClick={() => setActiveSideTarget('black')}
            className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-colors ${
              activeSideTarget === 'black'
                ? 'border-indigo-500 bg-indigo-50/70'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              Quân Đen ăn được
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-700 font-mono tabular-nums mt-0.5">
              {blackScore}đ
            </p>
          </div>
        </div>

        {/* Animated SVG + Interactive Drop Pans */}
        <div className="relative py-4 my-2">
          {/* Central Pillar */}
          <div className="flex flex-col items-center justify-center relative h-[270px] sm:h-[290px]">
            {/* Fulcrum Stand */}
            <svg
              viewBox="0 0 120 220"
              className="w-24 h-48 absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <path
                d="M 20,210 L 100,210 L 85,190 L 35,190 Z"
                fill="#334155"
              />
              <rect x="53" y="34" width="14" height="158" rx="4" fill="#475569" />
              <circle cx="60" cy="34" r="14" fill="#F59E0B" stroke="#1E293B" strokeWidth="4" />
            </svg>

            {/* Rotating Beam + Hanging Trays */}
            <div
              className="w-full max-w-[740px] relative z-10"
              style={{
                transform: `rotate(${tiltAngle}deg)`,
                transformOrigin: '50% 24px',
                transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Horizontal Wooden/Brass Beam */}
              <div className="h-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-full border-2 border-slate-800 shadow-sm mx-12 sm:mx-20 relative">
                <div className="w-4 h-4 rounded-full bg-slate-900 absolute -left-2 -top-0.5" />
                <div className="w-4 h-4 rounded-full bg-slate-900 absolute -right-2 -top-0.5" />
              </div>

              {/* Left & Right Hanging Pans */}
              <div className="flex items-start justify-between px-2 sm:px-6 -mt-1">
                {/* LEFT PAN: WHITE CAPTURES (holds Black pieces captured by White) */}
                <div
                  style={{
                    transform: `rotate(${-tiltAngle}deg)`,
                    transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverSide('white');
                  }}
                  onDragLeave={() => setDragOverSide(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverSide(null);
                    const piece = e.dataTransfer.getData('text/piece') as TradePieceType;
                    if (piece && PIECE_SPECS[piece]) {
                      addPieceToSide(piece, 'white');
                    }
                  }}
                  onClick={() => setActiveSideTarget('white')}
                  className="w-[44%] sm:w-[40%] flex flex-col items-center cursor-pointer"
                >
                  {/* Hanging Chains */}
                  <svg viewBox="0 0 180 65" className="w-40 h-14 pointer-events-none">
                    <line x1="90" y1="0" x2="18" y2="64" stroke="#64748B" strokeWidth="3" />
                    <line x1="90" y1="0" x2="162" y2="64" stroke="#64748B" strokeWidth="3" />
                  </svg>

                  {/* Pan Dish */}
                  <div
                    className={`w-full min-h-[108px] rounded-b-3xl rounded-t-lg border-2 p-2.5 flex flex-wrap items-center justify-center gap-1.5 transition-colors ${
                      dragOverSide === 'white' || activeSideTarget === 'white'
                        ? 'bg-teal-50 border-teal-500 shadow-md'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {whiteCaptures.length === 0 ? (
                      <span className="text-xs font-medium text-slate-400 text-center px-2">
                        Thả hoặc bấm thêm quân Trắng ăn được
                      </span>
                    ) : (
                      whiteCaptures.map((pt, idx) => (
                        <button
                          key={`w-${pt}-${idx}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePieceAt('white', idx);
                          }}
                          title="Bấm để bỏ quân này khỏi đĩa cân"
                          className="group relative w-12 h-12 p-1 rounded-lg bg-white border border-slate-200 hover:border-rose-400 shadow-xs cursor-pointer"
                        >
                          <ChessPieceSvg type={pt} color="b" skin={skin} />
                          <span className="hidden group-hover:flex absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white items-center justify-center">
                            <X className="w-3 h-3" />
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT PAN: BLACK CAPTURES (holds White pieces captured by Black) */}
                <div
                  style={{
                    transform: `rotate(${-tiltAngle}deg)`,
                    transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverSide('black');
                  }}
                  onDragLeave={() => setDragOverSide(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverSide(null);
                    const piece = e.dataTransfer.getData('text/piece') as TradePieceType;
                    if (piece && PIECE_SPECS[piece]) {
                      addPieceToSide(piece, 'black');
                    }
                  }}
                  onClick={() => setActiveSideTarget('black')}
                  className="w-[44%] sm:w-[40%] flex flex-col items-center cursor-pointer"
                >
                  <svg viewBox="0 0 180 65" className="w-40 h-14 pointer-events-none">
                    <line x1="90" y1="0" x2="18" y2="64" stroke="#64748B" strokeWidth="3" />
                    <line x1="90" y1="0" x2="162" y2="64" stroke="#64748B" strokeWidth="3" />
                  </svg>

                  <div
                    className={`w-full min-h-[108px] rounded-b-3xl rounded-t-lg border-2 p-2.5 flex flex-wrap items-center justify-center gap-1.5 transition-colors ${
                      dragOverSide === 'black' || activeSideTarget === 'black'
                        ? 'bg-indigo-50 border-indigo-500 shadow-md'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {blackCaptures.length === 0 ? (
                      <span className="text-xs font-medium text-slate-400 text-center px-2">
                        Thả hoặc bấm thêm quân Đen ăn được
                      </span>
                    ) : (
                      blackCaptures.map((pt, idx) => (
                        <button
                          key={`b-${pt}-${idx}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePieceAt('black', idx);
                          }}
                          title="Bấm để bỏ quân này khỏi đĩa cân"
                          className="group relative w-12 h-12 p-1 rounded-lg bg-white border border-slate-200 hover:border-rose-400 shadow-xs cursor-pointer"
                        >
                          <ChessPieceSvg type={pt} color="w" skin={skin} />
                          <span className="hidden group-hover:flex absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white items-center justify-center">
                            <X className="w-3 h-3" />
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Math Formula Readout */}
        <div
          className={`mt-4 rounded-xl border p-4 text-center transition-colors ${
            diff > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : diff < 0
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <p className="text-base sm:text-xl font-extrabold font-mono tabular-nums">
            {formatSideExpression(whiteCaptures)}{' '}
            <span className="mx-2 text-amber-600">
              {diff > 0 ? '>' : diff < 0 ? '<' : '='}
            </span>{' '}
            {formatSideExpression(blackCaptures)}
            <span className="mx-2">⇒</span>
            {diff > 0
              ? `Lời +${diff} điểm!`
              : diff < 0
                ? `Lỗ ${diff} điểm!`
                : 'Đổi ngang bằng (0 điểm)'}
          </p>
        </div>

        {/* Piece Picker Tray (Click OR Drag-Drop) */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm font-bold text-slate-800">
              Bấm chọn quân để đặt vào{' '}
              <span className={activeSideTarget === 'white' ? 'text-teal-700' : 'text-indigo-700'}>
                {activeSideTarget === 'white' ? 'Đĩa Trắng ăn được' : 'Đĩa Đen ăn được'}
              </span>{' '}
              (hoặc kéo thả quân lên đĩa cân):
            </p>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveSideTarget('white')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                  activeSideTarget === 'white'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Đĩa Trắng
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTarget('black')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                  activeSideTarget === 'black'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Đĩa Đen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {TRADE_PIECES.map((pt) => {
              const spec = PIECE_SPECS[pt];
              return (
                <div
                  key={pt}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/piece', pt);
                  }}
                  onClick={() => addPieceToSide(pt, activeSideTarget)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 transition-colors cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14">
                    <ChessPieceSvg
                      type={pt}
                      color={activeSideTarget === 'white' ? 'b' : 'w'}
                      skin={skin === 'cartoon' ? 'cartoon' : 'fide'}
                    />
                  </div>
                  <span className="mt-1.5 text-sm font-bold text-slate-900">
                    {spec.nameVi}
                  </span>
                  <span className="text-xs font-extrabold font-mono text-amber-700">
                    {spec.pointsLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
