import React, { useMemo, useState } from 'react';
import { Check, Printer } from 'lucide-react';
import { ChessPuzzle } from '../types/chess';
import { BUILTIN_PUZZLES, GRADE_LABELS } from '../data/puzzles';
import { StaticPrintBoard } from './StaticPrintBoard';
import { parseFenPlacement } from '../utils/fen';

interface WorksheetModuleProps {
  customPuzzles: ChessPuzzle[];
}

export const WorksheetModule: React.FC<WorksheetModuleProps> = ({ customPuzzles }) => {
  const allPuzzles = useMemo(
    () => [...customPuzzles, ...BUILTIN_PUZZLES],
    [customPuzzles],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    BUILTIN_PUZZLES.slice(0, 4).map((p) => p.id),
  );
  const [sheetTitle, setSheetTitle] = useState('PHIẾU BÀI TẬP CỜ VUA TIỂU HỌC');
  const [classLabel, setClassLabel] = useState('Lớp Cờ Vua Cơ Bản · Khối 1–3');
  const [instructionText, setInstructionText] = useState(
    'Em hãy dùng bút chì vẽ mũi tên nước đi tốt nhất trên bàn cờ và viết phép tính điểm đổi quân vào ô bên cạnh.',
  );
  const [showCoords, setShowCoords] = useState(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);

  const selectedPuzzles = useMemo(
    () => allPuzzles.filter((p) => selectedIds.includes(p.id)),
    [allPuzzles, selectedIds],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 4) return prev; // keep at least 4
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 6) return prev; // max 6
      return [...prev, id];
    });
  };

  const applyQuickPreset = (count: 4 | 6, grade?: 'k12' | 'k3' | 'k45') => {
    const pool = grade ? allPuzzles.filter((p) => p.grade === grade) : allPuzzles;
    const picked = pool.slice(0, count);
    if (picked.length < count) {
      const rest = allPuzzles.filter((p) => !picked.some((x) => x.id === p.id));
      picked.push(...rest.slice(0, count - picked.length));
    }
    setSelectedIds(picked.map((p) => p.id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* LEFT PANEL: WORKSHEET CONFIGURATION (HIDDEN WHEN PRINTING) */}
      <div className="no-print xl:col-span-4 space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">Thông tin phiếu bài tập</h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              In Phiếu A4
            </button>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tiêu đề phiếu
              </label>
              <input
                type="text"
                value={sheetTitle}
                onChange={(e) => setSheetTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên lớp / Tuần học
              </label>
              <input
                type="text"
                value={classLabel}
                onChange={(e) => setClassLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Hướng dẫn làm bài
              </label>
              <textarea
                rows={2}
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCoords}
                  onChange={(e) => setShowCoords(e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-600"
                />
                Hiển thị tọa độ (a–h, 1–8) trên bàn cờ
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnswerKey}
                  onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-600"
                />
                In kèm trang Đáp án cho giáo viên
              </label>
            </div>
          </div>
        </section>

        {/* Puzzle Picker (4 to 6 puzzles) */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Chọn 4 – 6 thế cờ in bài tập
              </h2>
              <p className="text-xs text-slate-500">
                Đã chọn:{' '}
                <span className="font-bold text-teal-700 font-mono">
                  {selectedIds.length} / 6
                </span>{' '}
                (tối thiểu 4 bài)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyQuickPreset(4, 'k12')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              4 bài Khối 1–2
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset(4, 'k3')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              4 bài Khối 3
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset(6)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              6 bài tổng hợp
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {allPuzzles.map((puzzle) => {
              const checked = selectedIds.includes(puzzle.id);
              const disabledAdd = !checked && selectedIds.length >= 6;
              const disabledRemove = checked && selectedIds.length <= 4;
              return (
                <button
                  key={puzzle.id}
                  type="button"
                  disabled={disabledAdd || disabledRemove}
                  onClick={() => toggleSelect(puzzle.id)}
                  className={`w-full text-left p-2.5 flex items-start gap-2.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    checked ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      checked
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {puzzle.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {GRADE_LABELS[puzzle.grade]} · {puzzle.tradeFormula}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* RIGHT PANEL: LIVE A4 PRINTABLE PREVIEW */}
      <div className="xl:col-span-8 flex justify-center">
        <div className="print-only-sheet w-full max-w-[820px] bg-white border border-slate-300 shadow-lg p-6 sm:p-8 text-black">
          {/* A4 Sheet Header */}
          <div className="border-b-2 border-black pb-3 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {classLabel}
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black mt-0.5">
                  {sheetTitle}
                </h1>
              </div>
              <div className="border-2 border-black px-3 py-1.5 text-center min-w-[90px]">
                <p className="text-[11px] font-bold uppercase">Điểm</p>
                <div className="h-6" />
              </div>
            </div>

            {/* Student Name / Date Lines */}
            <div className="grid grid-cols-12 gap-4 mt-3 text-sm font-semibold">
              <div className="col-span-6 flex items-end gap-1.5">
                <span className="whitespace-nowrap">Họ và tên:</span>
                <span className="flex-1 border-b border-dotted border-black h-4" />
              </div>
              <div className="col-span-3 flex items-end gap-1.5">
                <span className="whitespace-nowrap">Lớp:</span>
                <span className="flex-1 border-b border-dotted border-black h-4" />
              </div>
              <div className="col-span-3 flex items-end gap-1.5">
                <span className="whitespace-nowrap">Ngày:</span>
                <span className="flex-1 border-b border-dotted border-black h-4" />
              </div>
            </div>

            <p className="text-xs italic text-slate-800 mt-2.5">{instructionText}</p>
          </div>

          {/* 2-Column Exercises Grid (4 or 6 boards fit cleanly on A4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedPuzzles.map((puzzle, idx) => {
              const { turn } = parseFenPlacement(puzzle.fen);
              return (
                <div
                  key={puzzle.id}
                  className="print-break-inside-avoid border border-black rounded-lg p-2.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-1">
                    <span className="text-xs font-extrabold">
                      Bài {idx + 1}: {puzzle.title}
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 border border-black rounded-sm whitespace-nowrap">
                      {turn === 'w' ? 'Trắng đi' : 'Đen đi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2.5 items-stretch">
                    {/* Crisp Monochrome Chessboard */}
                    <div className="col-span-7">
                      <StaticPrintBoard fen={puzzle.fen} showCoords={showCoords} />
                    </div>

                    {/* Pencil Writing Lines */}
                    <div className="col-span-5 flex flex-col justify-between border border-dashed border-slate-400 rounded p-2 text-[11px]">
                      <div>
                        <p className="font-bold text-black leading-snug">
                          1. Vẽ mũi tên nước đi trên bàn cờ
                        </p>
                        <p className="font-bold text-black mt-2 leading-snug">
                          2. Phép tính điểm đổi quân:
                        </p>
                        <div className="mt-2 space-y-3.5">
                          <div className="border-b border-dotted border-black h-3" />
                          <div className="border-b border-dotted border-black h-3" />
                          <div className="border-b border-dotted border-black h-3" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-300 font-bold flex items-end gap-1">
                        <span>Lời/Lỗ:</span>
                        <span className="flex-1 border-b border-dotted border-black h-3" />
                        <span>đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-700">
            <span>Quy ước điểm: Tốt = 1đ · Mã = 3đ · Tượng = 3đ · Xe = 5đ · Hậu = 9đ</span>
            <span>ChessClass Studio</span>
          </div>

          {/* Optional Teacher Answer Key Page */}
          {includeAnswerKey && (
            <div className="print-page-break-before mt-8 pt-6 border-t-2 border-dashed border-slate-400">
              <h2 className="text-lg font-extrabold text-black mb-3">
                ĐÁP ÁN DÀNH CHO GIÁO VIÊN — {sheetTitle}
              </h2>
              <div className="space-y-2.5">
                {selectedPuzzles.map((puzzle, idx) => (
                  <div
                    key={`ans-${puzzle.id}`}
                    className="border border-slate-300 rounded p-2.5 text-xs"
                  >
                    <p className="font-extrabold">
                      Bài {idx + 1}: {puzzle.title} — Đáp án:{' '}
                      {puzzle.solutionMoves[0]
                        ? `${puzzle.solutionMoves[0].slice(0, 2)} → ${puzzle.solutionMoves[0].slice(2, 4)}`
                        : 'Thảo luận trên lớp'}
                    </p>
                    <p className="font-bold mt-0.5">{puzzle.tradeFormula}</p>
                    <p className="text-slate-700 mt-0.5">{puzzle.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
