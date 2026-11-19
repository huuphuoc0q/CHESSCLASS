import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowColor,
  BOARD_THEMES,
  BoardArrow,
  BoardThemeId,
  PieceSkin,
  SquareHighlight,
  TouchTool,
} from '../types/chess';
import { ChessPieceSvg, PieceColor, PieceType } from './ChessPieces';
import {
  BoardPiece,
  getCheckedKingSquare,
  getLegalDestinations,
  parseFenPlacement,
} from '../utils/fen';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const ARROW_HEX: Record<ArrowColor, string> = {
  green: '#16A34A',
  red: '#DC2626',
  yellow: '#EAB308',
};

const HIGHLIGHT_FILL: Record<ArrowColor, string> = {
  green: 'rgba(22, 163, 74, 0.42)',
  red: 'rgba(220, 38, 38, 0.42)',
  yellow: 'rgba(234, 179, 8, 0.48)',
};

export interface EditorBrush {
  kind: 'piece' | 'erase';
  piece?: BoardPiece;
}

interface InteractiveBoardProps {
  fen: string;
  flipped?: boolean;
  theme?: BoardThemeId;
  skin?: PieceSkin;
  arrows?: BoardArrow[];
  highlights?: SquareHighlight[];
  activeArrowColor?: ArrowColor;
  touchTool?: TouchTool;
  focusMode?: boolean;
  focusedSquares?: string[];
  editorMode?: boolean;
  editorBrush?: EditorBrush;
  lastMove?: { from: string; to: string } | null;
  allowAnyTurnMove?: boolean;
  disabled?: boolean;
  onMove?: (from: string, to: string, promotion?: PieceType) => boolean;
  onToggleArrow?: (arrow: BoardArrow) => void;
  onToggleHighlight?: (sq: string, color: ArrowColor) => void;
  onToggleFocusSquare?: (sq: string) => void;
  onEditorSquareClick?: (sq: string) => void;
}

export const InteractiveBoard: React.FC<InteractiveBoardProps> = ({
  fen,
  flipped = false,
  theme = 'moss',
  skin = 'fide',
  arrows = [],
  highlights = [],
  activeArrowColor = 'green',
  touchTool = 'move',
  focusMode = false,
  focusedSquares = [],
  editorMode = false,
  lastMove = null,
  disabled = false,
  onMove,
  onToggleArrow,
  onToggleHighlight,
  onToggleFocusSquare,
  onEditorSquareClick,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [draggingPiece, setDraggingPiece] = useState<{
    from: string;
    piece: BoardPiece;
    x: number;
    y: number;
  } | null>(null);
  const [drawingArrowStart, setDrawingArrowStart] = useState<string | null>(null);
  const [drawingArrowHover, setDrawingArrowHover] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: PieceColor;
  } | null>(null);

  const { grid, turn } = useMemo(() => parseFenPlacement(fen), [fen]);
  const checkedKingSq = useMemo(() => getCheckedKingSquare(fen), [fen]);
  const themeColors = BOARD_THEMES[theme];

  const legalTargets = useMemo(() => {
    if (!selectedSquare || editorMode || disabled) return [];
    return getLegalDestinations(fen, selectedSquare);
  }, [fen, selectedSquare, editorMode, disabled]);

  const orderedFiles = flipped ? [...FILES].reverse() : FILES;
  const orderedRanks = flipped ? [...RANKS].reverse() : RANKS;

  // Board SVG coordinate system: total 900x900
  // Outer margin for coordinates = 50 on each side, inner 8x8 board = 800x800 (100px per square)
  const MARGIN = 50;
  const SQ_SIZE = 100;

  const squareToCenter = (sq: string) => {
    const f = sq[0];
    const r = sq[1];
    const col = orderedFiles.indexOf(f);
    const row = orderedRanks.indexOf(r);
    return {
      x: MARGIN + col * SQ_SIZE + SQ_SIZE / 2,
      y: MARGIN + row * SQ_SIZE + SQ_SIZE / 2,
    };
  };

  const clientPointToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * 900;
    const y = ((clientY - rect.top) / rect.height) * 900;
    return { x, y };
  };

  const svgPointToSquare = (x: number, y: number): string | null => {
    const col = Math.floor((x - MARGIN) / SQ_SIZE);
    const row = Math.floor((y - MARGIN) / SQ_SIZE);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return `${orderedFiles[col]}${orderedRanks[row]}`;
  };

  const tryExecuteMove = (from: string, to: string) => {
    const movingPiece = grid[from];
    if (!movingPiece || !onMove) return false;
    const isPromotionRank =
      movingPiece.type === 'p' &&
      ((movingPiece.color === 'w' && to[1] === '8') ||
        (movingPiece.color === 'b' && to[1] === '1'));

    const targets = getLegalDestinations(fen, from);
    if (isPromotionRank && targets.includes(to)) {
      setPendingPromotion({ from, to, color: movingPiece.color });
      setSelectedSquare(null);
      return true;
    }

    const ok = onMove(from, to);
    setSelectedSquare(null);
    return ok;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pendingPromotion) return;
    const pt = clientPointToSvg(e.clientX, e.clientY);
    if (!pt) return;
    const sq = svgPointToSquare(pt.x, pt.y);
    if (!sq) return;

    // Right-click always draws arrows / highlights
    if (e.button === 2) {
      e.preventDefault();
      setDrawingArrowStart(sq);
      setDrawingArrowHover(sq);
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    if (e.button !== 0) return;

    // Board Editor mode
    if (editorMode) {
      onEditorSquareClick?.(sq);
      return;
    }

    // Touch tactical tools (for smartboard / single-tap without right mouse)
    if (touchTool === 'arrow') {
      setDrawingArrowStart(sq);
      setDrawingArrowHover(sq);
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    if (touchTool === 'highlight') {
      onToggleHighlight?.(sq, activeArrowColor);
      return;
    }

    if (touchTool === 'focus') {
      if (grid[sq]) {
        onToggleFocusSquare?.(sq);
      }
      return;
    }

    if (disabled) return;

    // Standard Move mode: if clicking a legal destination from already-selected piece
    if (selectedSquare && selectedSquare !== sq && legalTargets.includes(sq)) {
      tryExecuteMove(selectedSquare, sq);
      return;
    }

    const piece = grid[sq];
    // Focus mode shortcut: if focusMode is on and clicking an enemy/non-turn piece or holding Alt, toggle focus?
    // Keep normal move clean for turn piece, and allow drag!
    if (piece && piece.color === turn) {
      setSelectedSquare(sq);
      setDraggingPiece({
        from: sq,
        piece,
        x: pt.x,
        y: pt.y,
      });
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } else {
      setSelectedSquare(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientPointToSvg(e.clientX, e.clientY);
    if (!pt) return;

    if (drawingArrowStart) {
      const sq = svgPointToSquare(pt.x, pt.y);
      if (sq !== drawingArrowHover) {
        setDrawingArrowHover(sq);
      }
      return;
    }

    if (draggingPiece) {
      setDraggingPiece((prev) => (prev ? { ...prev, x: pt.x, y: pt.y } : null));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientPointToSvg(e.clientX, e.clientY);
    const targetSq = pt ? svgPointToSquare(pt.x, pt.y) : null;

    if (drawingArrowStart) {
      if (targetSq) {
        if (targetSq === drawingArrowStart) {
          onToggleHighlight?.(targetSq, activeArrowColor);
        } else {
          onToggleArrow?.({
            from: drawingArrowStart,
            to: targetSq,
            color: activeArrowColor,
          });
        }
      }
      setDrawingArrowStart(null);
      setDrawingArrowHover(null);
      return;
    }

    if (draggingPiece) {
      const from = draggingPiece.from;
      setDraggingPiece(null);
      if (targetSq && targetSq !== from) {
        tryExecuteMove(from, targetSq);
      }
    }
  };

  const hasFocusFilter = focusMode && focusedSquares.length > 0;

  return (
    <div className="relative select-none w-full max-w-[660px] mx-auto">
      <div
        className="rounded-2xl overflow-hidden shadow-md border-4 transition-colors duration-200"
        style={{
          borderColor: themeColors.border,
          backgroundColor: themeColors.light,
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 900 900"
          className="w-full h-auto block touch-none cursor-pointer"
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Outer Coordinate Frame */}
          <rect x="0" y="0" width="900" height="900" fill={themeColors.light} />

          {/* Coordinates on ALL 4 EDGES for classroom projector visibility */}
          {orderedFiles.map((file, idx) => {
            const cx = MARGIN + idx * SQ_SIZE + SQ_SIZE / 2;
            return (
              <g key={`file-${file}`}>
                <text
                  x={cx}
                  y={33}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {file}
                </text>
                <text
                  x={cx}
                  y={883}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {file}
                </text>
              </g>
            );
          })}

          {orderedRanks.map((rank, idx) => {
            const cy = MARGIN + idx * SQ_SIZE + SQ_SIZE / 2 + 8;
            return (
              <g key={`rank-${rank}`}>
                <text
                  x={25}
                  y={cy}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {rank}
                </text>
                <text
                  x={875}
                  y={cy}
                  textAnchor="middle"
                  fill={themeColors.coord}
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {rank}
                </text>
              </g>
            );
          })}

          {/* Inner Board Border */}
          <rect
            x={MARGIN - 2}
            y={MARGIN - 2}
            width={804}
            height={804}
            fill="none"
            stroke={themeColors.border}
            strokeWidth="3"
          />

          {/* 64 Squares */}
          {orderedRanks.map((rank, rIdx) =>
            orderedFiles.map((file, fIdx) => {
              const sq = `${file}${rank}`;
              const isLight = (rIdx + fIdx) % 2 === 0;
              const x = MARGIN + fIdx * SQ_SIZE;
              const y = MARGIN + rIdx * SQ_SIZE;
              const isSelected = selectedSquare === sq;
              const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isCheckKing = checkedKingSq === sq;
              const highlightObj = highlights.find((h) => h.square === sq);
              const isLegalTarget = legalTargets.includes(sq);
              const hasPiece = Boolean(grid[sq]);
              const isFocused = focusedSquares.includes(sq);

              return (
                <g key={sq}>
                  <rect
                    x={x}
                    y={y}
                    width={SQ_SIZE}
                    height={SQ_SIZE}
                    fill={isLight ? themeColors.light : themeColors.dark}
                  />

                  {/* Last move soft amber tint */}
                  {isLastMove && (
                    <rect
                      x={x}
                      y={y}
                      width={SQ_SIZE}
                      height={SQ_SIZE}
                      fill="rgba(250, 204, 21, 0.38)"
                    />
                  )}

                  {/* Selected square highlight */}
                  {isSelected && (
                    <rect
                      x={x}
                      y={y}
                      width={SQ_SIZE}
                      height={SQ_SIZE}
                      fill="rgba(14, 165, 233, 0.42)"
                    />
                  )}

                  {/* Teacher right-click / highlight tint */}
                  {highlightObj && (
                    <rect
                      x={x}
                      y={y}
                      width={SQ_SIZE}
                      height={SQ_SIZE}
                      fill={HIGHLIGHT_FILL[highlightObj.color]}
                    />
                  )}

                  {/* Check halo */}
                  {isCheckKing && (
                    <rect
                      x={x + 2}
                      y={y + 2}
                      width={SQ_SIZE - 4}
                      height={SQ_SIZE - 4}
                      fill="rgba(220, 38, 38, 0.45)"
                      stroke="#DC2626"
                      strokeWidth="4"
                    />
                  )}

                  {/* Focus ring */}
                  {focusMode && isFocused && (
                    <rect
                      x={x + 3}
                      y={y + 3}
                      width={SQ_SIZE - 6}
                      height={SQ_SIZE - 6}
                      fill="rgba(16, 185, 129, 0.14)"
                      stroke="#059669"
                      strokeWidth="4"
                      rx="6"
                    />
                  )}

                  {/* Legal Move Indicator */}
                  {isLegalTarget && !hasPiece && (
                    <circle
                      cx={x + SQ_SIZE / 2}
                      cy={y + SQ_SIZE / 2}
                      r="16"
                      fill="rgba(15, 23, 42, 0.24)"
                    />
                  )}
                  {isLegalTarget && hasPiece && (
                    <circle
                      cx={x + SQ_SIZE / 2}
                      cy={y + SQ_SIZE / 2}
                      r="43"
                      fill="none"
                      stroke="rgba(15, 23, 42, 0.35)"
                      strokeWidth="7"
                    />
                  )}
                </g>
              );
            }),
          )}

          {/* Pieces Layer */}
          {orderedRanks.map((rank, rIdx) =>
            orderedFiles.map((file, fIdx) => {
              const sq = `${file}${rank}`;
              const piece = grid[sq];
              if (!piece) return null;
              if (draggingPiece?.from === sq) return null;

              const x = MARGIN + fIdx * SQ_SIZE;
              const y = MARGIN + rIdx * SQ_SIZE;
              const isDimmed = hasFocusFilter && !focusedSquares.includes(sq);

              return (
                <g
                  key={`piece-${sq}`}
                  transform={`translate(${x + 5}, ${y + 5})`}
                  style={{
                    opacity: isDimmed ? 0.25 : 1,
                    transition: 'opacity 180ms ease',
                  }}
                >
                  <svg width={90} height={90} viewBox="0 0 90 90">
                    <ChessPieceSvg type={piece.type} color={piece.color} skin={skin} />
                  </svg>
                </g>
              );
            }),
          )}

          {/* Tactical Arrows Layer */}
          <defs>
            {(['green', 'red', 'yellow'] as ArrowColor[]).map((c) => (
              <marker
                key={`head-${c}`}
                id={`arrowhead-${c}`}
                markerWidth="5"
                markerHeight="5"
                refX="2.7"
                refY="2.5"
                orient="auto"
              >
                <polygon points="0 0.5, 4.5 2.5, 0 4.5" fill={ARROW_HEX[c]} />
              </marker>
            ))}
          </defs>

          {arrows.map((arrow, idx) => {
            const p1 = squareToCenter(arrow.from);
            const p2 = squareToCenter(arrow.to);
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const startX = p1.x + ux * 16;
            const startY = p1.y + uy * 16;
            const endX = p2.x - ux * 22;
            const endY = p2.y - uy * 22;

            return (
              <line
                key={`arrow-${arrow.from}-${arrow.to}-${idx}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={ARROW_HEX[arrow.color]}
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.86"
                markerEnd={`url(#arrowhead-${arrow.color})`}
                pointerEvents="none"
              />
            );
          })}

          {/* Live Preview Arrow While Dragging */}
          {drawingArrowStart &&
            drawingArrowHover &&
            drawingArrowHover !== drawingArrowStart &&
            (() => {
              const p1 = squareToCenter(drawingArrowStart);
              const p2 = squareToCenter(drawingArrowHover);
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              return (
                <line
                  x1={p1.x + ux * 16}
                  y1={p1.y + uy * 16}
                  x2={p2.x - ux * 22}
                  y2={p2.y - uy * 22}
                  stroke={ARROW_HEX[activeArrowColor]}
                  strokeWidth="14"
                  strokeLinecap="round"
                  opacity="0.65"
                  markerEnd={`url(#arrowhead-${activeArrowColor})`}
                  pointerEvents="none"
                />
              );
            })()}

          {/* Dragged Piece Floating Above Board */}
          {draggingPiece && (
            <g
              transform={`translate(${draggingPiece.x - 52}, ${draggingPiece.y - 52})`}
              pointerEvents="none"
            >
              <svg width={104} height={104} viewBox="0 0 104 104">
                <ChessPieceSvg
                  type={draggingPiece.piece.type}
                  color={draggingPiece.piece.color}
                  skin={skin}
                />
              </svg>
            </g>
          )}
        </svg>
      </div>

      {/* Pawn Promotion Overlay */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-slate-900/45 flex items-center justify-center rounded-2xl z-20">
          <div className="bg-white rounded-xl p-5 shadow-xl border border-slate-200 text-center">
            <p className="text-base font-bold text-slate-900 mb-3">
              Chú Tốt phong cấp thành quân gì?
            </p>
            <div className="flex items-center gap-3">
              {(['q', 'r', 'b', 'n'] as PieceType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => {
                    onMove?.(pendingPromotion.from, pendingPromotion.to, pt);
                    setPendingPromotion(null);
                  }}
                  className="w-16 h-16 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer"
                >
                  <ChessPieceSvg type={pt} color={pendingPromotion.color} skin={skin} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPendingPromotion(null)}
              className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
