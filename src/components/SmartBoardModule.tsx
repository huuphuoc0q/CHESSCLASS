import React, { useCallback, useEffect, useState } from 'react';
import { Chess, Square } from 'chess.js';
import {
  ArrowUpDown,
  BookOpen,
  Check,
  Copy,
  Eraser,
  Eye,
  FolderPlus,
  Highlighter,
  MousePointer,
  Navigation,
  PencilRuler,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  ArrowColor,
  BOARD_THEMES,
  BoardArrow,
  BoardThemeId,
  ChessPuzzle,
  PieceSkin,
  SquareHighlight,
  TouchTool,
} from '../types/chess';
import { ChessPieceSvg, PieceColor, PieceType } from './ChessPieces';
import { EditorBrush, InteractiveBoard } from './InteractiveBoard';
import { BUILTIN_PUZZLES } from '../data/puzzles';
import { isPlayableFen, parseFenPlacement, serializeBoardToFen } from '../utils/fen';
import { sound } from '../utils/sound';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface SmartBoardModuleProps {
  theme: BoardThemeId;
  onChangeTheme: (t: BoardThemeId) => void;
  skin: PieceSkin;
  onChangeSkin: (s: PieceSkin) => void;
  customPuzzles: ChessPuzzle[];
  onSaveCustomPuzzle: (puzzle: ChessPuzzle) => void;
  onDeleteCustomPuzzle: (id: string) => void;
}

export const SmartBoardModule: React.FC<SmartBoardModuleProps> = ({
  theme,
  onChangeTheme,
  skin,
  onChangeSkin,
  customPuzzles,
  onSaveCustomPuzzle,
  onDeleteCustomPuzzle,
}) => {
  const [history, setHistory] = useState<string[]>([INITIAL_FEN]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);

  // Drawing & Tactical Fog
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [highlights, setHighlights] = useState<SquareHighlight[]>([]);
  const [activeArrowColor, setActiveArrowColor] = useState<ArrowColor>('green');
  const [touchTool, setTouchTool] = useState<TouchTool>('move');
  const [focusMode, setFocusMode] = useState(false);
  const [focusedSquares, setFocusedSquares] = useState<string[]>([]);

  // Board Editor
  const [editorMode, setEditorMode] = useState(false);
  const [editorBrush, setEditorBrush] = useState<EditorBrush>({
    kind: 'piece',
    piece: { type: 'q', color: 'w' },
  });

  // FEN Input & Save Custom Modal
  const currentFen = history[historyIndex];
  const [fenInput, setFenInput] = useState(currentFen);
  const [fenFeedback, setFenFeedback] = useState<string | null>(null);
  const [copiedFen, setCopiedFen] = useState(false);

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveFormula, setSaveFormula] = useState('');
  const [saveExplanation, setSaveExplanation] = useState('');
  const [showLibraryDrawer, setShowLibraryDrawer] = useState(false);

  useEffect(() => {
    setFenInput(currentFen);
  }, [currentFen]);

  const clearDrawings = useCallback(() => {
    setArrows([]);
    setHighlights([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((i) => i - 1);
      setLastMove(null);
      sound.playMove();
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((i) => i + 1);
      setLastMove(null);
      sound.playMove();
    }
  }, [historyIndex, history.length]);

  // Keyboard shortcuts: C (clear arrows), F (flip), Ctrl+Z (undo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        clearDrawings();
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearDrawings, handleUndo]);

  const pushFen = (newFen: string, moveInfo?: { from: string; to: string }) => {
    const sliced = history.slice(0, historyIndex + 1);
    setHistory([...sliced, newFen]);
    setHistoryIndex(sliced.length);
    setLastMove(moveInfo || null);
  };

  const handleMove = (from: string, to: string, promotion?: PieceType): boolean => {
    try {
      const chess = new Chess(currentFen);
      const result = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion || 'q',
      });
      if (!result) {
        sound.playError();
        return false;
      }
      if (chess.inCheck()) {
        sound.playCheck();
      } else if (result.captured) {
        sound.playCapture();
      } else {
        sound.playMove();
      }
      pushFen(chess.fen(), { from, to });
      return true;
    } catch {
      sound.playError();
      return false;
    }
  };

  const handleToggleArrow = (arrow: BoardArrow) => {
    setArrows((prev) => {
      const exists = prev.find(
        (a) => a.from === arrow.from && a.to === arrow.to && a.color === arrow.color,
      );
      if (exists) {
        return prev.filter((a) => a !== exists);
      }
      const withoutSamePair = prev.filter(
        (a) => !(a.from === arrow.from && a.to === arrow.to),
      );
      return [...withoutSamePair, arrow];
    });
  };

  const handleToggleHighlight = (sq: string, color: ArrowColor) => {
    setHighlights((prev) => {
      const exists = prev.find((h) => h.square === sq && h.color === color);
      if (exists) {
        return prev.filter((h) => h.square !== sq);
      }
      return [...prev.filter((h) => h.square !== sq), { square: sq, color }];
    });
  };

  const handleToggleFocusSquare = (sq: string) => {
    setFocusedSquares((prev) =>
      prev.includes(sq) ? prev.filter((s) => s !== sq) : [...prev, sq],
    );
  };

  const handleEditorSquareClick = (sq: string) => {
    const { grid, turn } = parseFenPlacement(currentFen);
    const nextGrid = { ...grid };
    if (editorBrush.kind === 'erase') {
      delete nextGrid[sq];
    } else if (editorBrush.piece) {
      const existing = nextGrid[sq];
      if (
        existing &&
        existing.type === editorBrush.piece.type &&
        existing.color === editorBrush.piece.color
      ) {
        delete nextGrid[sq];
      } else {
        nextGrid[sq] = editorBrush.piece;
      }
    }
    const nextFen = serializeBoardToFen(nextGrid, turn);
    pushFen(nextFen);
    sound.playMove();
  };

  const handleEditorSetTurn = (turn: PieceColor) => {
    const { grid } = parseFenPlacement(currentFen);
    pushFen(serializeBoardToFen(grid, turn));
  };

  const handleApplyFen = () => {
    const trimmed = fenInput.trim();
    const check = isPlayableFen(trimmed);
    if (!check.valid) {
      setFenFeedback(check.error || 'Mã FEN chưa hợp lệ.');
      sound.playError();
      return;
    }
    setFenFeedback(null);
    clearDrawings();
    setFocusedSquares([]);
    pushFen(trimmed);
    sound.playMove();
  };

  const handleCopyFen = () => {
    navigator.clipboard?.writeText(currentFen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 1800);
  };

  const handleLoadPreset = (puzzle: ChessPuzzle) => {
    clearDrawings();
    setFocusedSquares([]);
    setEditorMode(false);
    setTouchTool('move');
    pushFen(puzzle.fen);
    setShowLibraryDrawer(false);
    sound.playMove();
  };

  const handleToggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    if (next) {
      setEditorMode(false);
      setTouchTool('focus');
    } else {
      setFocusedSquares([]);
      setTouchTool('move');
    }
  };

  const handleToggleEditor = () => {
    const next = !editorMode;
    setEditorMode(next);
    if (next) {
      setFocusMode(false);
    } else {
      setTouchTool('move');
    }
  };

  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    const newPuzzle: ChessPuzzle = {
      id: `custom-${Date.now()}`,
      title: saveTitle.trim(),
      grade: 'custom',
      fen: currentFen,
      solutionMoves: [],
      tradeFormula: saveFormula.trim() || 'Thế cờ thảo luận trên lớp',
      explanation: saveExplanation.trim() || 'Giáo viên dựng trực tiếp trong buổi giảng.',
      isCustom: true,
    };
    onSaveCustomPuzzle(newPuzzle);
    setSaveTitle('');
    setSaveFormula('');
    setSaveExplanation('');
    setShowSaveForm(false);
    sound.playSuccess();
  };

  const { turn } = parseFenPlacement(currentFen);
  const playableCheck = isPlayableFen(currentFen);
  const allLibrary = [...customPuzzles, ...BUILTIN_PUZZLES];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT / CENTER: INTERACTIVE BOARD STAGE */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        {/* Compact Projector Controls Strip */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Dual-Skin Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
              Giao diện quân:
            </span>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => onChangeSkin('fide')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  skin === 'fide'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chuẩn FIDE (Khối 3–5)
              </button>
              <button
                type="button"
                onClick={() => onChangeSkin('cartoon')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  skin === 'cartoon'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hoạt hình + Điểm (Khối 1–2)
              </button>
            </div>
          </div>

          {/* Board Theme Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
              Màu bàn:
            </span>
            <div className="inline-flex items-center gap-1.5">
              {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((tId) => {
                const t = BOARD_THEMES[tId];
                const active = theme === tId;
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => onChangeTheme(tId)}
                    title={t.name}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-sm border border-slate-300 shrink-0"
                      style={{ backgroundColor: t.dark }}
                    />
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main SVG Chessboard */}
        <InteractiveBoard
          fen={currentFen}
          flipped={flipped}
          theme={theme}
          skin={skin}
          arrows={arrows}
          highlights={highlights}
          activeArrowColor={activeArrowColor}
          touchTool={touchTool}
          focusMode={focusMode}
          focusedSquares={focusedSquares}
          editorMode={editorMode}
          editorBrush={editorBrush}
          lastMove={lastMove}
          disabled={!playableCheck.valid && !editorMode}
          onMove={handleMove}
          onToggleArrow={handleToggleArrow}
          onToggleHighlight={handleToggleHighlight}
          onToggleFocusSquare={handleToggleFocusSquare}
          onEditorSquareClick={handleEditorSquareClick}
        />

        {/* Turn Status & Classroom Quick Hint Bar */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-4 h-4 rounded-full border border-slate-400 shrink-0 ${
                turn === 'w' ? 'bg-white' : 'bg-slate-800'
              }`}
            />
            <span className="font-bold text-slate-900">
              {turn === 'w' ? 'Lượt quân Trắng đi' : 'Lượt quân Đen đi'}
            </span>
            {!playableCheck.valid && !editorMode && (
              <span className="text-rose-600 font-medium">
                · Cần đặt đủ Vua Trắng và Vua Đen để di chuyển quân
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Mẹo: Kéo chuột phải vẽ mũi tên · Nhấp chuột phải tô ô · Phím{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">
              C
            </kbd>{' '}
            xóa vẽ ·{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">
              F
            </kbd>{' '}
            lật bàn
          </p>
        </div>
      </div>

      {/* RIGHT: TEACHER CONTROL DECK */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
        {/* 1. Tactical Drawing & Focus Tools */}
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">
              Công cụ giảng dạy trực quan
            </h2>
            <button
              type="button"
              onClick={clearDrawings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa mũi tên (C)
            </button>
          </div>

          {/* Touch / Smartboard Tool Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setEditorMode(false);
                setTouchTool('move');
              }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                !editorMode && touchTool === 'move'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <MousePointer className="w-4 h-4 shrink-0" />
              <span className="truncate">Đi quân</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditorMode(false);
                setTouchTool('arrow');
              }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                !editorMode && touchTool === 'arrow'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span className="truncate">Vẽ mũi tên</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditorMode(false);
                setTouchTool('highlight');
              }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                !editorMode && touchTool === 'highlight'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Highlighter className="w-4 h-4 shrink-0" />
              <span className="truncate">Tô sáng ô</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFocusMode}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                focusMode
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">Sương mù</span>
            </button>
          </div>

          {/* 3 Tactical Arrow / Highlight Colors */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Màu mũi tên & ô tô sáng:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveArrowColor('green')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  activeArrowColor === 'green'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                Tối ưu
              </button>
              <button
                type="button"
                onClick={() => setActiveArrowColor('red')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  activeArrowColor === 'red'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                Nguy hiểm
              </button>
              <button
                type="button"
                onClick={() => setActiveArrowColor('yellow')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  activeArrowColor === 'yellow'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                Kiểm soát
              </button>
            </div>
          </div>

          {/* Focus Mode Instructions */}
          {focusMode && (
            <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between gap-2">
              <span>
                Chạm vào quân cờ trên bàn để chọn tâm điểm ({focusedSquares.length} quân đang sáng).
              </span>
              {focusedSquares.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFocusedSquares([])}
                  className="px-2 py-1 rounded bg-white border border-indigo-200 font-semibold text-indigo-700 hover:bg-indigo-100 shrink-0 cursor-pointer"
                >
                  Hiện tất cả
                </button>
              )}
            </div>
          )}
        </section>

        {/* 2. Board Actions & Board Editor */}
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">Điều khiển bàn cờ</h2>
            <button
              type="button"
              onClick={handleToggleEditor}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                editorMode
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <PencilRuler className="w-3.5 h-3.5" />
              {editorMode ? 'Đang xếp cờ' : 'Tự xếp thế cờ'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex === 0}
              title="Đi lại (Ctrl+Z)"
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              Đi lại
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Tiến tới"
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <Redo2 className="w-4 h-4" />
              Tiến tới
            </button>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              title="Lật bàn cờ (F)"
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
              Lật bàn
            </button>
            <button
              type="button"
              onClick={() => {
                clearDrawings();
                setFocusedSquares([]);
                pushFen(INITIAL_FEN);
                sound.playMove();
              }}
              title="Đặt lại bàn cờ ban đầu"
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Ban đầu
            </button>
          </div>

          {/* Board Editor Palette */}
          {editorMode && (
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  Chọn quân để đặt lên bàn:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    pushFen('8/8/8/8/8/8/8/8 w - - 0 1');
                    clearDrawings();
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa trống bàn cờ
                </button>
              </div>

              {(['w', 'b'] as PieceColor[]).map((color) => (
                <div key={color} className="grid grid-cols-6 gap-1.5">
                  {(['k', 'q', 'r', 'b', 'n', 'p'] as PieceType[]).map((type) => {
                    const active =
                      editorBrush.kind === 'piece' &&
                      editorBrush.piece?.color === color &&
                      editorBrush.piece?.type === type;
                    return (
                      <button
                        key={`${color}-${type}`}
                        type="button"
                        onClick={() =>
                          setEditorBrush({ kind: 'piece', piece: { type, color } })
                        }
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400/30'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <ChessPieceSvg type={type} color={color} skin={skin} className="w-8 h-8 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditorBrush({ kind: 'erase' })}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
                    editorBrush.kind === 'erase'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Tẩy quân
                </button>

                <div className="inline-flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleEditorSetTurn('w')}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                      turn === 'w' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Trắng đi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditorSetTurn('b')}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                      turn === 'b' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Đen đi
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. FEN & Preset Library */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">Mã FEN & Kho thế cờ</h2>
            <button
              type="button"
              onClick={() => setShowLibraryDrawer((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Mở kho thế cờ ({allLibrary.length})
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={fenInput}
              onChange={(e) => {
                setFenInput(e.target.value);
                setFenFeedback(null);
              }}
              placeholder="Dán mã FEN vào đây..."
              className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={handleApplyFen}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Nạp FEN
            </button>
            <button
              type="button"
              onClick={handleCopyFen}
              title="Sao chép mã FEN"
              className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              {copiedFen ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {fenFeedback && <p className="text-xs font-medium text-rose-600">{fenFeedback}</p>}

          {/* Save current board to library */}
          {!showSaveForm ? (
            <button
              type="button"
              onClick={() => setShowSaveForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-teal-600" />
              Lưu thế cờ hiện tại vào kho bài giảng
            </button>
          ) : (
            <form
              onSubmit={handleSavePosition}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
            >
              <input
                type="text"
                required
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Tên thế cờ (vd: Đòn bắt đôi của Mã)"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                value={saveFormula}
                onChange={(e) => setSaveFormula(e.target.value)}
                placeholder="Công thức điểm (vd: Xe 5đ - Mã 3đ = +2đ)"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                value={saveExplanation}
                onChange={(e) => setSaveExplanation(e.target.value)}
                placeholder="Ghi chú ngắn cho học sinh..."
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                >
                  Lưu thế cờ
                </button>
              </div>
            </form>
          )}

          {/* Quick Library List */}
          {showLibraryDrawer && (
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {allLibrary.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 p-2.5 hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => handleLoadPreset(p)}
                    className="flex-1 text-left cursor-pointer min-w-0"
                  >
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500 truncate">{p.tradeFormula}</p>
                  </button>
                  {p.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomPuzzle(p.id)}
                      title="Xóa thế cờ tự lưu"
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
