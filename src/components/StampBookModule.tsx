import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowDownWideNarrow,
  ClipboardPaste,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { BADGE_META, BadgeType, Student } from '../types/chess';
import { sound } from '../utils/sound';

interface StampBookModuleProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
}

interface CelebrationBanner {
  id: number;
  studentName: string;
  badgeLabel: string;
  badgeIcon: string;
  totalStars: number;
}

export const StampBookModule: React.FC<StampBookModuleProps> = ({
  students,
  onUpdateStudents,
}) => {
  const [singleName, setSingleName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'stars' | 'name'>('stars');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [celebration, setCelebration] = useState<CelebrationBanner | null>(null);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? students.filter((s) => s.name.toLowerCase().includes(q))
      : [...students];

    if (sortBy === 'stars') {
      list.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name, 'vi'));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    return list;
  }, [students, searchQuery, sortBy]);

  const totalClassStars = useMemo(
    () => students.reduce((acc, s) => acc + s.stars, 0),
    [students],
  );

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const name = singleName.trim();
    if (!name) return;
    const newStudent: Student = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      stars: 0,
      badges: { worksheet: 0, speed: 0, touchMove: 0, winner: 0 },
      createdAt: Date.now(),
    };
    onUpdateStudents([newStudent, ...students]);
    setSingleName('');
    sound.playMove();
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split(/\r?\n/)
      .map((line) => line.replace(/^\d+[\.\)\-\s]+/, '').trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const existingNames = new Set(students.map((s) => s.name.toLowerCase()));
    const newOnes: Student[] = [];
    lines.forEach((name, idx) => {
      if (!existingNames.has(name.toLowerCase())) {
        existingNames.add(name.toLowerCase());
        newOnes.push({
          id: `st-${Date.now()}-${idx}`,
          name,
          stars: 0,
          badges: { worksheet: 0, speed: 0, touchMove: 0, winner: 0 },
          createdAt: Date.now() + idx,
        });
      }
    });

    if (newOnes.length > 0) {
      onUpdateStudents([...students, ...newOnes]);
      sound.playSuccess();
    }
    setBulkText('');
    setShowBulkModal(false);
  };

  const handleAwardBadge = (studentId: string, badge: BadgeType) => {
    let awardedStudent: Student | null = null;
    const next = students.map((s) => {
      if (s.id !== studentId) return s;
      const updated: Student = {
        ...s,
        stars: s.stars + 1,
        badges: {
          ...s.badges,
          [badge]: (s.badges[badge] || 0) + 1,
        },
      };
      awardedStudent = updated;
      return updated;
    });
    onUpdateStudents(next);

    if (awardedStudent) {
      const target = awardedStudent as Student;
      const meta = BADGE_META[badge];
      const bannerId = Date.now();
      setCelebration({
        id: bannerId,
        studentName: target.name,
        badgeLabel: meta.label,
        badgeIcon: meta.icon,
        totalStars: target.stars,
      });
      sound.playSuccess();
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.7 },
      });
      setTimeout(() => {
        setCelebration((curr) => (curr && curr.id === bannerId ? null : curr));
      }, 3600);
    }
  };

  const handleAdjustStar = (studentId: string, delta: number) => {
    const next = students.map((s) =>
      s.id === studentId ? { ...s, stars: Math.max(0, s.stars + delta) } : s,
    );
    onUpdateStudents(next);
    sound.playMove();
  };

  const handleDeleteStudent = (studentId: string) => {
    onUpdateStudents(students.filter((s) => s.id !== studentId));
  };

  return (
    <div className="space-y-5">
      {/* Celebratory Projector Banner when awarding a star */}
      {celebration && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="text-3xl shrink-0">{celebration.badgeIcon}</span>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-amber-300 truncate">
                Chúc mừng {celebration.studentName}! +1 ⭐
              </p>
              <p className="text-xs sm:text-sm text-slate-200 truncate">
                Huy hiệu: {celebration.badgeLabel} · Tổng cộng {celebration.totalStars} sao
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCelebration(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Top Controls & Roster Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Sổ Tích Điểm & Khen Thưởng Lớp Học
            </h2>
            <p className="text-sm text-slate-500">
              {students.length} học sinh · Tổng cộng{' '}
              <span className="font-bold text-amber-600 font-mono tabular-nums">
                ⭐ {totalClassStars}
              </span>{' '}
              sao toàn lớp
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Add 1 Student */}
          <form onSubmit={handleAddSingle} className="flex items-center gap-2">
            <input
              type="text"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Tên học sinh mới..."
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-44 sm:w-52"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Thêm em
            </button>
          </form>

          {/* Bulk Import */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-bold whitespace-nowrap cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4 text-teal-600" />
            Dán danh sách Excel
          </button>
        </div>
      </div>

      {/* Filter & Sort Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhanh tên học sinh..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="inline-flex items-center gap-2">
          <ArrowDownWideNarrow className="w-4 h-4 text-slate-500" />
          <div className="inline-flex bg-white border border-slate-200 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSortBy('stars')}
              className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                sortBy === 'stars'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xếp theo sao
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xếp A–Z
            </button>
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900">
            Chưa có học sinh nào trong danh sách
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Hãy nhập tên từng em ở ô phía trên hoặc bấm "Dán danh sách Excel" để thêm cả lớp trong 1 giây!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student, index) => (
            <div
              key={student.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3.5"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 truncate">
                      {student.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Phiếu: {student.badges.worksheet} · Siêu tốc: {student.badges.speed} · Chạm quân:{' '}
                    {student.badges.touchMove} · Thắng: {student.badges.winner}
                  </p>
                </div>

                {/* Star Counter + Quick Adjust */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustStar(student.id, -1)}
                    title="Trừ 1 sao"
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-lg font-mono tabular-nums">
                    ⭐ {student.stars}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(student.id)}
                    title="Xóa học sinh khỏi danh sách"
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 One-Tap Reward Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BADGE_META) as BadgeType[]).map((bKey) => {
                  const meta = BADGE_META[bKey];
                  const count = student.badges[bKey] || 0;
                  return (
                    <button
                      key={bKey}
                      type="button"
                      onClick={() => handleAwardBadge(student.id, bKey)}
                      className={`flex items-center justify-between gap-1.5 px-2.5 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${meta.colorClass}`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">{meta.icon}</span>
                        <span className="text-xs font-bold leading-tight truncate">
                          {meta.shortLabel}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-extrabold font-mono tabular-nums shrink-0">
                        <Plus className="w-3 h-3" />
                        {count > 0 ? count : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Nhập nhanh danh sách học sinh
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Dán danh sách tên học sinh từ Excel hoặc Word (mỗi học sinh 1 dòng). Hệ thống tự động bỏ qua số thứ tự đầu dòng nếu có.
            </p>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <textarea
                rows={7}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'1. Nguyễn Minh Anh\n2. Trần Gia Bảo\n3. Lê Bảo Ngọc\n4. Phạm Hoàng Nam'}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold cursor-pointer"
                >
                  Thêm vào lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
