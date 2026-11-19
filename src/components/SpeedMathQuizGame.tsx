import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flame, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import { PIECE_SPECS, PieceSkin, TeamScore } from '../types/chess';
import { ChessPieceSvg, PieceType } from './ChessPieces';
import { sound } from '../utils/sound';

interface QuizQuestion {
  id: string;
  prompt: string;
  leftPieces: PieceType[];
  rightPieces?: PieceType[];
  operatorLabel: string;
  options: { label: string; value: string }[];
  correctValue: string;
  explanation: string;
}

const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Tổng điểm của các quân cờ này bằng bao nhiêu?',
    leftPieces: ['r', 'p', 'p'],
    operatorLabel: '+',
    options: [
      { label: '6 điểm', value: '6' },
      { label: '7 điểm', value: '7' },
      { label: '8 điểm', value: '8' },
      { label: '9 điểm', value: '9' },
    ],
    correctValue: '7',
    explanation: 'Xe (5đ) + Tốt (1đ) + Tốt (1đ) = 7 điểm!',
  },
  {
    id: 'q2',
    prompt: 'Cặp quân nào có tổng điểm LỚN HƠN quân Hậu (9đ)?',
    leftPieces: ['r', 'r'],
    rightPieces: ['q'],
    operatorLabel: 'so với',
    options: [
      { label: 'Lớn hơn (+1đ)', value: 'more' },
      { label: 'Bằng nhau (0đ)', value: 'equal' },
      { label: 'Nhỏ hơn (-1đ)', value: 'less' },
      { label: 'Nhỏ hơn (-2đ)', value: 'less2' },
    ],
    correctValue: 'more',
    explanation: 'Hai quân Xe = 5 + 5 = 10 điểm > Hậu (9 điểm) -> Lời +1 điểm!',
  },
  {
    id: 'q3',
    prompt: 'Lấy Mã (3đ) + Tốt (1đ) bằng bao nhiêu điểm?',
    leftPieces: ['n', 'p'],
    operatorLabel: '+',
    options: [
      { label: '3 điểm', value: '3' },
      { label: '4 điểm', value: '4' },
      { label: '5 điểm', value: '5' },
      { label: '6 điểm', value: '6' },
    ],
    correctValue: '4',
    explanation: 'Mã (3đ) + Tốt (1đ) = 4 điểm!',
  },
  {
    id: 'q4',
    prompt: 'Đổi 1 Tượng (3đ) lấy 1 Xe (5đ), em LỜI hay LỖ?',
    leftPieces: ['r'],
    rightPieces: ['b'],
    operatorLabel: 'đổi lấy',
    options: [
      { label: 'Lời +2 điểm', value: '+2' },
      { label: 'Lỗ -2 điểm', value: '-2' },
      { label: 'Hòa 0 điểm', value: '0' },
      { label: 'Lời +3 điểm', value: '+3' },
    ],
    correctValue: '+2',
    explanation: 'Ăn được Xe (5đ) trừ đi mất Tượng (3đ) = Lời +2 điểm!',
  },
  {
    id: 'q5',
    prompt: 'Tổng điểm của Hậu + Mã + Tốt là bao nhiêu?',
    leftPieces: ['q', 'n', 'p'],
    operatorLabel: '+',
    options: [
      { label: '11 điểm', value: '11' },
      { label: '12 điểm', value: '12' },
      { label: '13 điểm', value: '13' },
      { label: '14 điểm', value: '14' },
    ],
    correctValue: '13',
    explanation: 'Hậu (9đ) + Mã (3đ) + Tốt (1đ) = 13 điểm!',
  },
  {
    id: 'q6',
    prompt: 'Nếu đổi Hậu (9đ) lấy Xe (5đ) + Mã (3đ), kết quả thế nào?',
    leftPieces: ['r', 'n'],
    rightPieces: ['q'],
    operatorLabel: 'đổi với',
    options: [
      { label: 'Lời +1 điểm', value: '+1' },
      { label: 'Hòa 0 điểm', value: '0' },
      { label: 'Lỗ -1 điểm', value: '-1' },
      { label: 'Lời +2 điểm', value: '+2' },
    ],
    correctValue: '-1',
    explanation: 'Xe (5đ) + Mã (3đ) = 8 điểm < Hậu (9đ) -> Bị lỗ -1 điểm!',
  },
  {
    id: 'q7',
    prompt: 'Mã (3đ) + Tượng (3đ) + Tốt (1đ) bằng mấy điểm?',
    leftPieces: ['n', 'b', 'p'],
    operatorLabel: '+',
    options: [
      { label: '6 điểm', value: '6' },
      { label: '7 điểm', value: '7' },
      { label: '8 điểm', value: '8' },
      { label: '9 điểm', value: '9' },
    ],
    correctValue: '7',
    explanation: 'Mã (3đ) + Tượng (3đ) + Tốt (1đ) = 7 điểm!',
  },
  {
    id: 'q8',
    prompt: 'Đổi 1 Xe (5đ) lấy 1 Mã (3đ) + 1 Tượng (3đ), kết quả là:',
    leftPieces: ['n', 'b'],
    rightPieces: ['r'],
    operatorLabel: 'đổi với',
    options: [
      { label: 'Lời +1 điểm', value: '+1' },
      { label: 'Lỗ -1 điểm', value: '-1' },
      { label: 'Hòa 0 điểm', value: '0' },
      { label: 'Lời +2 điểm', value: '+2' },
    ],
    correctValue: '+1',
    explanation: 'Mã (3đ) + Tượng (3đ) = 6 điểm > Xe (5đ) -> Lời +1 điểm!',
  },
];

interface SpeedMathQuizGameProps {
  skin: PieceSkin;
  teams: TeamScore[];
  onAwardTeam: (teamId: string, delta: number) => void;
}

export const SpeedMathQuizGame: React.FC<SpeedMathQuizGameProps> = ({
  skin,
  teams,
  onAwardTeam,
}) => {
  const [qIdx, setQIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);

  const currentQ = useMemo(() => QUIZ_BANK[qIdx] || QUIZ_BANK[0], [qIdx]);
  const isAnswered = selectedOption !== null;
  const isRight = selectedOption === currentQ.correctValue;

  const handleAnswer = (val: string) => {
    if (isAnswered) return;
    setSelectedOption(val);
    if (val === currentQ.correctValue) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      sound.playSuccess();
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.65 } });
    } else {
      setStreak(0);
      sound.playError();
    }
  };

  const handleNext = () => {
    if (qIdx + 1 >= QUIZ_BANK.length) {
      setFinished(true);
      sound.playSuccess();
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } else {
      setQIdx((i) => i + 1);
      setSelectedOption(null);
      sound.playMove();
    }
  };

  const handleRestart = () => {
    setQIdx(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setStreak(0);
    setFinished(false);
    sound.playMove();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 max-w-4xl mx-auto space-y-6">
      {/* Header Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Đấu Trường Tính Điểm Siêu Tốc
          </h3>
        </div>

        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="text-slate-600 font-mono tabular-nums">
            Câu {Math.min(qIdx + 1, QUIZ_BANK.length)} / {QUIZ_BANK.length}
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono tabular-nums flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-600" />
            Chuỗi x{streak}
          </span>
          <span className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-mono tabular-nums">
            Đúng: {correctCount}
          </span>
        </div>
      </div>

      {finished ? (
        <div className="py-8 text-center space-y-5">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Hoàn thành vòng thi! Đúng {correctCount} / {QUIZ_BANK.length} câu
            </h4>
            <p className="text-slate-600 mt-1">
              Các em đã phản xạ tính điểm đổi quân rất nhanh! Hãy thưởng sao cho đội chiến thắng nhé.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onAwardTeam(t.id, 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-sm font-bold text-amber-900 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                +1 ⭐ cho {t.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Chơi lại từ đầu
          </button>
        </div>
      ) : (
        <>
          {/* Visual Question Stage */}
          <div className="text-center space-y-4">
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {currentQ.prompt}
            </h4>

            <div className="flex flex-wrap items-center justify-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {currentQ.leftPieces.map((pt, idx) => (
                  <div
                    key={`lp-${idx}`}
                    className="flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs w-20"
                  >
                    <div className="w-12 h-12">
                      <ChessPieceSvg
                        type={pt}
                        color="w"
                        skin={skin === 'cartoon' ? 'cartoon' : 'fide'}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 mt-1">
                      {PIECE_SPECS[pt].nameVi}
                    </span>
                  </div>
                ))}
              </div>

              {currentQ.rightPieces && (
                <>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-sm">
                    {currentQ.operatorLabel}
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {currentQ.rightPieces.map((pt, idx) => (
                      <div
                        key={`rp-${idx}`}
                        className="flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs w-20"
                      >
                        <div className="w-12 h-12">
                          <ChessPieceSvg
                            type={pt}
                            color="b"
                            skin={skin === 'cartoon' ? 'cartoon' : 'fide'}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 mt-1">
                          {PIECE_SPECS[pt].nameVi}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4 Big Projector-Friendly Answer Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt.value;
              const isCorrectChoice = opt.value === currentQ.correctValue;

              let btnClass =
                'bg-white border-slate-200 hover:bg-teal-50 hover:border-teal-400 text-slate-900';
              if (isAnswered) {
                if (isCorrectChoice) {
                  btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/30';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 border-rose-500 text-rose-950';
                } else {
                  btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-70';
                }
              }

              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswer(opt.value)}
                  className={`p-4 sm:p-5 rounded-xl border-2 text-left flex items-center gap-3.5 transition-colors cursor-pointer disabled:cursor-default ${btnClass}`}
                >
                  <span className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-extrabold text-slate-700 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                isRight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div>
                <p className="font-extrabold text-base">
                  {isRight ? 'Chính xác tuyệt đối!' : 'Chưa đúng rồi! Ghi nhớ phép tính nhé:'}
                </p>
                <p className="text-sm font-medium mt-0.5">{currentQ.explanation}</p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                {qIdx + 1 >= QUIZ_BANK.length ? 'Xem tổng kết →' : 'Câu tiếp theo →'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
