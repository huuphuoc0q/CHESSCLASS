import { useEffect, useState } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import {
  BoardThemeId,
  ChessPuzzle,
  ModuleId,
  PieceSkin,
  Student,
  TeamScore,
} from './types/chess';
import {
  loadCustomPuzzles,
  loadStudents,
  loadTeams,
  saveCustomPuzzles,
  saveStudents,
  saveTeams,
} from './utils/storage';
import { sound } from './utils/sound';
import { SmartBoardModule } from './components/SmartBoardModule';
import { ArenaModule } from './components/ArenaModule';
import { StampBookModule } from './components/StampBookModule';
import { WorksheetModule } from './components/WorksheetModule';

const NAV_ITEMS: { id: ModuleId; label: string }[] = [
  { id: 'board', label: 'Bàn Cờ Giảng Dạy' },
  { id: 'arena', label: 'Đấu Trường & Cân' },
  { id: 'stamps', label: 'Sổ Tích Điểm' },
  { id: 'worksheet', label: 'Tạo Phiếu In A4' },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('board');
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>('moss');
  const [pieceSkin, setPieceSkin] = useState<PieceSkin>('cartoon');
  const [muted, setMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [teams, setTeams] = useState<TeamScore[]>(() => loadTeams());
  const [customPuzzles, setCustomPuzzles] = useState<ChessPuzzle[]>(() =>
    loadCustomPuzzles(),
  );

  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveTeams(teams);
  }, [teams]);

  useEffect(() => {
    saveCustomPuzzles(customPuzzles);
  }, [customPuzzles]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleSaveCustomPuzzle = (puzzle: ChessPuzzle) => {
    setCustomPuzzles((prev) => [puzzle, ...prev]);
  };

  const handleDeleteCustomPuzzle = (id: string) => {
    setCustomPuzzles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Compact Top Navigation Bar (Hidden during A4 Print) */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => setActiveModule('board')}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 text-teal-600 shrink-0"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="9" height="9" rx="1.5" />
            <rect x="13" y="2" width="9" height="9" rx="1.5" opacity="0.25" />
            <rect x="2" y="13" width="9" height="9" rx="1.5" opacity="0.25" />
            <rect x="13" y="13" width="9" height="9" rx="1.5" />
          </svg>
          <span>ChessClass Studio</span>
        </button>

        {/* Zone 2: 4 Module Navigation Links */}
        <nav
          aria-label="Phân hệ giảng dạy"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Classroom Utility Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            title={muted ? 'Bật âm thanh lớp học' : 'Tắt âm thanh'}
            className={`p-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
              muted
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Chiếu toàn màn hình'}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
            {isFullscreen ? 'Thu nhỏ' : 'Máy chiếu'}
          </button>
        </div>
      </header>

      {/* Main 85%+ Workspace */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6">
        {activeModule === 'board' && (
          <SmartBoardModule
            theme={boardTheme}
            onChangeTheme={setBoardTheme}
            skin={pieceSkin}
            onChangeSkin={setPieceSkin}
            customPuzzles={customPuzzles}
            onSaveCustomPuzzle={handleSaveCustomPuzzle}
            onDeleteCustomPuzzle={handleDeleteCustomPuzzle}
          />
        )}

        {activeModule === 'arena' && (
          <ArenaModule
            theme={boardTheme}
            skin={pieceSkin}
            teams={teams}
            onUpdateTeams={setTeams}
            customPuzzles={customPuzzles}
          />
        )}

        {activeModule === 'stamps' && (
          <StampBookModule students={students} onUpdateStudents={setStudents} />
        )}

        {activeModule === 'worksheet' && (
          <WorksheetModule customPuzzles={customPuzzles} />
        )}
      </main>
    </div>
  );
}
