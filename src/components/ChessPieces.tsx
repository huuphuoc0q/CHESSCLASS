import React from 'react';
import { PieceSkin } from '../types/chess';

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

interface ChessPieceSvgProps {
  type: PieceType;
  color: PieceColor;
  skin: PieceSkin | 'print';
  className?: string;
}

const POINT_LABELS: Record<PieceType, string> = {
  p: '1',
  n: '3',
  b: '3',
  r: '5',
  q: '9',
  k: '∞',
};

const BADGE_BG: Record<PieceType, string> = {
  p: '#0EA5E9',
  n: '#8B5CF6',
  b: '#10B981',
  r: '#F97316',
  q: '#E11D48',
  k: '#D97706',
};

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({
  type,
  color,
  skin,
  className = 'w-full h-full',
}) => {
  if (skin === 'cartoon') {
    return <CartoonPiece type={type} color={color} className={className} />;
  }
  return <StauntonPiece type={type} color={color} isPrint={skin === 'print'} className={className} />;
};

const StauntonPiece: React.FC<{
  type: PieceType;
  color: PieceColor;
  isPrint: boolean;
  className?: string;
}> = ({ type, color, isPrint, className }) => {
  const isWhite = color === 'w';
  const fill = isPrint
    ? isWhite
      ? '#FFFFFF'
      : '#111827'
    : isWhite
      ? '#FFFDF7'
      : '#1E293B';
  const stroke = isPrint ? '#000000' : isWhite ? '#1E293B' : '#0F172A';
  const detailStroke = isPrint
    ? isWhite
      ? '#000000'
      : '#FFFFFF'
    : isWhite
      ? '#1E293B'
      : '#F8FAFC';

  return (
    <svg
      viewBox="0 0 45 45"
      className={className}
      aria-label={`${isWhite ? 'Trắng' : 'Đen'} ${type}`}
    >
      {type === 'p' && (
        <path
          d="M 22.5,9 C 19.5,9 17.5,11.2 17.5,14 C 17.5,15.6 18.2,17 19.3,17.9 C 16.5,19.3 15,22 15,25.5 C 15,27.5 15.9,29.5 17.2,30.8 L 13,37.5 L 32,37.5 L 27.8,30.8 C 29.1,29.5 30,27.5 30,25.5 C 30,22 28.5,19.3 25.7,17.9 C 26.8,17 27.5,15.6 27.5,14 C 27.5,11.2 25.5,9 22.5,9 z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {type === 'r' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
          {!isWhite && (
            <>
              <line x1="14" y1="17" x2="31" y2="17" stroke={detailStroke} strokeWidth="1.3" />
              <line x1="14" y1="29.5" x2="31" y2="29.5" stroke={detailStroke} strokeWidth="1.3" />
              <line x1="12.5" y1="32" x2="32.5" y2="32" stroke={detailStroke} strokeWidth="1.3" />
            </>
          )}
        </g>
      )}

      {type === 'n' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
          <circle cx="15" cy="15.5" r="1.2" fill={detailStroke} stroke="none" />
          {!isWhite && (
            <path
              d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5"
              fill="none"
              stroke={detailStroke}
              strokeWidth="1.2"
            />
          )}
        </g>
      )}

      {type === 'b' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
          <circle cx="22.5" cy="8" r="2.5" />
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke={detailStroke} strokeWidth="1.6" />
        </g>
      )}

      {type === 'q' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="12" r="2.4" />
          <circle cx="14" cy="9" r="2.4" />
          <circle cx="22.5" cy="8" r="2.4" />
          <circle cx="31" cy="9" r="2.4" />
          <circle cx="39" cy="12" r="2.4" />
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
          {!isWhite && (
            <>
              <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" stroke={detailStroke} strokeWidth="1.3" />
              <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke={detailStroke} strokeWidth="1.3" />
            </>
          )}
        </g>
      )}

      {type === 'k' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 22.5,11.63 L 22.5,6" stroke={stroke} strokeWidth="2.2" />
          <path d="M 20,8 L 25,8" stroke={stroke} strokeWidth="2.2" />
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
          <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z" />
          <path d="M 11.5,30 C 17,27 27,27 32.5,30" fill="none" stroke={detailStroke} strokeWidth="1.4" />
          <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" fill="none" stroke={detailStroke} strokeWidth="1.4" />
          <path d="M 11.5,37 C 17,34 27,34 32.5,37" fill="none" stroke={detailStroke} strokeWidth="1.4" />
        </g>
      )}
    </svg>
  );
};

const CartoonPiece: React.FC<{
  type: PieceType;
  color: PieceColor;
  className?: string;
}> = ({ type, color, className }) => {
  const isWhite = color === 'w';
  const bodyFill = isWhite ? '#FFFBEB' : '#334155';
  const bodyShade = isWhite ? '#FDE68A' : '#1E293B';
  const outline = isWhite ? '#334155' : '#0F172A';
  const eyeColor = isWhite ? '#0F172A' : '#F8FAFC';
  const cheekColor = isWhite ? '#FDA4AF' : '#FB7185';
  const accentGold = '#F59E0B';

  return (
    <svg viewBox="0 0 64 64" className={className} aria-label={`${isWhite ? 'Trắng' : 'Đen'} ${type}`}>
      {/* Ground shadow */}
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(15, 23, 42, 0.16)" />

      {/* PAWN (1đ) - Cheerful Little Squire */}
      {type === 'p' && (
        <g stroke={outline} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M 18,54 Q 32,57 46,54 L 42,37 Q 32,34 22,37 Z" fill={bodyShade} />
          <circle cx="32" cy="26" r="12.5" fill={bodyFill} />
          {/* Cute helmet crest */}
          <path d="M 27,14 Q 32,8 37,14" fill={accentGold} />
          {/* Eyes & smile */}
          <circle cx="27.5" cy="25" r="2.1" fill={eyeColor} stroke="none" />
          <circle cx="36.5" cy="25" r="2.1" fill={eyeColor} stroke="none" />
          <circle cx="24" cy="28.5" r="2.2" fill={cheekColor} stroke="none" opacity="0.7" />
          <circle cx="40" cy="28.5" r="2.2" fill={cheekColor} stroke="none" opacity="0.7" />
          <path d="M 29,30 Q 32,33 35,30" fill="none" stroke={eyeColor} strokeWidth="2" />
        </g>
      )}

      {/* KNIGHT (3đ) - Playful Pony */}
      {type === 'n' && (
        <g stroke={outline} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          {/* Mane */}
          <path d="M 35,14 C 45,15 50,24 47,38 L 38,38 Z" fill={accentGold} />
          {/* Body & Head */}
          <path
            d="M 18,54 L 46,54 L 43,35 C 43,23 39,14 29,12 L 26,8 L 22,13 C 16,15 11,22 12,28 C 13,32 18,33 23,31 L 24,35 L 18,54 Z"
            fill={bodyFill}
          />
          {/* Ear & Eye & Smile */}
          <circle cx="24" cy="21" r="2.2" fill={eyeColor} stroke="none" />
          <circle cx="16.5" cy="26" r="1.4" fill={eyeColor} stroke="none" />
          <path d="M 16,29.5 Q 20,31.5 23,29" fill="none" stroke={eyeColor} strokeWidth="1.9" />
          <path d="M 19,48 L 45,48" stroke={outline} strokeWidth="2" />
        </g>
      )}

      {/* BISHOP (3đ) - Friendly Scholar Hat */}
      {type === 'b' && (
        <g stroke={outline} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          <path d="M 17,54 L 47,54 L 41,38 Q 32,35 23,38 Z" fill={bodyShade} />
          <path d="M 20,36 C 18,22 25,13 32,12 C 39,13 46,22 44,36 Z" fill={bodyFill} />
          <circle cx="32" cy="9.5" r="3.5" fill={accentGold} />
          {/* Hat sash */}
          <path d="M 23,22 L 41,22" stroke={accentGold} strokeWidth="3.5" />
          {/* Face */}
          <circle cx="27.5" cy="28" r="2.1" fill={eyeColor} stroke="none" />
          <circle cx="36.5" cy="28" r="2.1" fill={eyeColor} stroke="none" />
          <path d="M 29,33 Q 32,36 35,33" fill="none" stroke={eyeColor} strokeWidth="2" />
        </g>
      )}

      {/* ROOK (5đ) - Sturdy Smiling Castle */}
      {type === 'r' && (
        <g stroke={outline} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          <path d="M 15,54 L 49,54 L 46,47 L 18,47 Z" fill={bodyShade} />
          <rect x="19" y="22" width="26" height="25" rx="2" fill={bodyFill} />
          {/* Battlements */}
          <path
            d="M 16,22 L 16,12 L 22,12 L 22,16 L 28,16 L 28,12 L 36,12 L 36,16 L 42,16 L 42,12 L 48,12 L 48,22 Z"
            fill={bodyShade}
          />
          {/* Castle face */}
          <circle cx="26.5" cy="31" r="2.2" fill={eyeColor} stroke="none" />
          <circle cx="37.5" cy="31" r="2.2" fill={eyeColor} stroke="none" />
          <path d="M 28,37 Q 32,41 36,37" fill="none" stroke={eyeColor} strokeWidth="2.2" />
          <circle cx="23" cy="34.5" r="2" fill={cheekColor} stroke="none" opacity="0.65" />
          <circle cx="41" cy="34.5" r="2" fill={cheekColor} stroke="none" opacity="0.65" />
        </g>
      )}

      {/* QUEEN (9đ) - Radiant Crowned Queen */}
      {type === 'q' && (
        <g stroke={outline} strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M 15,54 L 49,54 L 44,37 Q 32,34 20,37 Z" fill={bodyShade} />
          <circle cx="32" cy="29" r="12.5" fill={bodyFill} />
          {/* Sparkling Crown */}
          <path d="M 18,21 L 15,11 L 24,16 L 32,8 L 40,16 L 49,11 L 46,21 Z" fill={accentGold} />
          <circle cx="32" cy="7.5" r="2.2" fill="#F43F5E" />
          {/* Face */}
          <circle cx="27" cy="28.5" r="2.1" fill={eyeColor} stroke="none" />
          <circle cx="37" cy="28.5" r="2.1" fill={eyeColor} stroke="none" />
          <circle cx="23.5" cy="31.5" r="2.2" fill={cheekColor} stroke="none" opacity="0.75" />
          <circle cx="40.5" cy="31.5" r="2.2" fill={cheekColor} stroke="none" opacity="0.75" />
          <path d="M 28.5,33.5 Q 32,37 35.5,33.5" fill="none" stroke={eyeColor} strokeWidth="2" />
        </g>
      )}

      {/* KING (∞) - Noble Royal King */}
      {type === 'k' && (
        <g stroke={outline} strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M 14,54 L 50,54 L 45,36 Q 32,33 19,36 Z" fill={bodyShade} />
          <circle cx="32" cy="29" r="13" fill={bodyFill} />
          {/* Royal Crown + Cross */}
          <path d="M 32,4 L 32,12 M 28,8 L 36,8" stroke={accentGold} strokeWidth="3.2" />
          <path d="M 19,21 L 21,12 L 28,16 L 32,11 L 36,16 L 43,12 L 45,21 Z" fill={accentGold} />
          {/* Face + friendly smile */}
          <circle cx="27" cy="28" r="2.2" fill={eyeColor} stroke="none" />
          <circle cx="37" cy="28" r="2.2" fill={eyeColor} stroke="none" />
          <path d="M 28,34 Q 32,37.5 36,34" fill="none" stroke={eyeColor} strokeWidth="2.2" />
        </g>
      )}

      {/* Point Value Badge in top-right corner */}
      <g transform="translate(44, 2)">
        <circle
          cx="9"
          cy="9"
          r="9"
          fill={BADGE_BG[type]}
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <text
          x="9"
          y="12.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={type === 'k' ? '11.5' : '11'}
          fontWeight="800"
          fontFamily="Outfit, sans-serif"
        >
          {POINT_LABELS[type]}
        </text>
      </g>
    </svg>
  );
};
