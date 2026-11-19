import React, { useMemo } from 'react';
import { ChessPieceSvg } from './ChessPieces';
import { parseFenPlacement } from '../utils/fen';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface StaticPrintBoardProps {
  fen: string;
  showCoords?: boolean;
}

export const StaticPrintBoard: React.FC<StaticPrintBoardProps> = ({
  fen,
  showCoords = true,
}) => {
  const { grid } = useMemo(() => parseFenPlacement(fen), [fen]);
  const MARGIN = showCoords ? 36 : 8;
  const SQ = 80;
  const TOTAL = MARGIN * 2 + SQ * 8;

  return (
    <svg
      viewBox={`0 0 ${TOTAL} ${TOTAL}`}
      className="w-full h-auto block bg-white"
      aria-label="Bàn cờ bài tập in giấy"
    >
      <rect x="0" y="0" width={TOTAL} height={TOTAL} fill="#FFFFFF" />

      {showCoords &&
        FILES.map((file, idx) => {
          const cx = MARGIN + idx * SQ + SQ / 2;
          return (
            <g key={`pf-${file}`}>
              <text
                x={cx}
                y={24}
                textAnchor="middle"
                fill="#111827"
                fontSize="20"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {file}
              </text>
              <text
                x={cx}
                y={TOTAL - 10}
                textAnchor="middle"
                fill="#111827"
                fontSize="20"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {file}
              </text>
            </g>
          );
        })}

      {showCoords &&
        RANKS.map((rank, idx) => {
          const cy = MARGIN + idx * SQ + SQ / 2 + 7;
          return (
            <g key={`pr-${rank}`}>
              <text
                x={18}
                y={cy}
                textAnchor="middle"
                fill="#111827"
                fontSize="20"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {rank}
              </text>
              <text
                x={TOTAL - 18}
                y={cy}
                textAnchor="middle"
                fill="#111827"
                fontSize="20"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {rank}
              </text>
            </g>
          );
        })}

      <rect
        x={MARGIN - 1.5}
        y={MARGIN - 1.5}
        width={SQ * 8 + 3}
        height={SQ * 8 + 3}
        fill="none"
        stroke="#000000"
        strokeWidth="3"
      />

      {RANKS.map((rank, rIdx) =>
        FILES.map((file, fIdx) => {
          const sq = `${file}${rank}`;
          const isLight = (rIdx + fIdx) % 2 === 0;
          const x = MARGIN + fIdx * SQ;
          const y = MARGIN + rIdx * SQ;
          const piece = grid[sq];

          return (
            <g key={sq}>
              <rect
                x={x}
                y={y}
                width={SQ}
                height={SQ}
                fill={isLight ? '#FFFFFF' : '#CBD5E1'}
                stroke="#94A3B8"
                strokeWidth="0.5"
              />
              {piece && (
                <g transform={`translate(${x + 4}, ${y + 4})`}>
                  <svg width={SQ - 8} height={SQ - 8} viewBox="0 0 72 72">
                    <ChessPieceSvg type={piece.type} color={piece.color} skin="print" />
                  </svg>
                </g>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
};
