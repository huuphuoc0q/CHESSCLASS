import { ChessPuzzle, Student, TeamScore } from '../types/chess';

const KEYS = {
  STUDENTS: 'chessclass_students_v1',
  TEAMS: 'chessclass_teams_v1',
  CUSTOM_PUZZLES: 'chessclass_custom_puzzles_v1',
};

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'st-1',
    name: 'Nguyễn Minh Anh',
    teamId: 'team-red',
    stars: 6,
    badges: { worksheet: 2, speed: 2, touchMove: 1, winner: 1 },
    createdAt: Date.now() - 100000,
  },
  {
    id: 'st-2',
    name: 'Trần Gia Bảo',
    teamId: 'team-blue',
    stars: 5,
    badges: { worksheet: 1, speed: 2, touchMove: 1, winner: 1 },
    createdAt: Date.now() - 90000,
  },
  {
    id: 'st-3',
    name: 'Lê Bảo Ngọc',
    teamId: 'team-red',
    stars: 4,
    badges: { worksheet: 2, speed: 1, touchMove: 1, winner: 0 },
    createdAt: Date.now() - 80000,
  },
  {
    id: 'st-4',
    name: 'Phạm Hoàng Nam',
    teamId: 'team-blue',
    stars: 4,
    badges: { worksheet: 1, speed: 1, touchMove: 1, winner: 1 },
    createdAt: Date.now() - 70000,
  },
];

const DEFAULT_TEAMS: TeamScore[] = [
  { id: 'team-red', name: 'Rồng Đỏ', color: 'red', stars: 3 },
  { id: 'team-blue', name: 'Cá Mập Xanh', color: 'blue', stars: 3 },
];

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(KEYS.STUDENTS);
    if (!raw) return DEFAULT_STUDENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_STUDENTS;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export function saveStudents(students: Student[]) {
  try {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  } catch {
    // Ignore quota errors
  }
}

export function loadTeams(): TeamScore[] {
  try {
    const raw = localStorage.getItem(KEYS.TEAMS);
    if (!raw) return DEFAULT_TEAMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length >= 2 ? parsed : DEFAULT_TEAMS;
  } catch {
    return DEFAULT_TEAMS;
  }
}

export function saveTeams(teams: TeamScore[]) {
  try {
    localStorage.setItem(KEYS.TEAMS, JSON.stringify(teams));
  } catch {
    // Ignore quota errors
  }
}

export function loadCustomPuzzles(): ChessPuzzle[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_PUZZLES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPuzzles(puzzles: ChessPuzzle[]) {
  try {
    localStorage.setItem(KEYS.CUSTOM_PUZZLES, JSON.stringify(puzzles));
  } catch {
    // Ignore quota errors
  }
}
