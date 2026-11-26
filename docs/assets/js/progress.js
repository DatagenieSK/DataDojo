/**
 * Progress, XP, Streak, and Belt Store
 * Pure logic with injected storage adapter.
 */

import { CONFIG } from './config.js';

export function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function daysBetween(dateStrA, dateStrB) {
  const d1 = parseLocalDate(dateStrA);
  const d2 = parseLocalDate(dateStrB);
  if (!d1 || !d2) return Infinity;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function createDefaultState(todayStr = getLocalDateString()) {
  return {
    v: 2,
    xp: 0,
    completed: {},
    belts: {},
    streak: { count: 0, lastDay: null },
    createdAt: todayStr,
  };
}

export function migrateState(raw) {
  if (!raw || typeof raw !== 'object') {
    return createDefaultState();
  }

  const completed = {};
  if (raw.completed && typeof raw.completed === 'object' && !Array.isArray(raw.completed)) {
    for (const [id, rec] of Object.entries(raw.completed)) {
      if (rec && typeof rec === 'object') {
        completed[id] = {
          at: typeof rec.at === 'string' ? rec.at : getLocalDateString(),
          kind: rec.kind || 'exercise',
          usedTips: typeof rec.usedTips === 'number' ? Math.max(0, rec.usedTips) : 0,
        };
      }
    }
  }

  const belts = {};
  if (raw.belts && typeof raw.belts === 'object' && !Array.isArray(raw.belts)) {
    for (const [beltId, bRec] of Object.entries(raw.belts)) {
      if (bRec && typeof bRec === 'object' && typeof bRec.earnedAt === 'string') {
        belts[beltId] = { earnedAt: bRec.earnedAt };
      }
    }
  }

  return {
    v: 2,
    xp: typeof raw.xp === 'number' ? Math.max(0, raw.xp) : 0,
    completed,
    belts,
    streak: {
      count: (raw.streak && typeof raw.streak.count === 'number') ? Math.max(0, raw.streak.count) : 0,
      lastDay: (raw.streak && typeof raw.streak.lastDay === 'string') ? raw.streak.lastDay : null,
    },
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : getLocalDateString(),
  };
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid format: root must be a JSON object.');
  }
  if (typeof data.v !== 'number' || (data.v !== 1 && data.v !== 2)) {
    throw new Error('Invalid or missing schema version.');
  }
  if (typeof data.xp !== 'number' || data.xp < 0) {
    throw new Error('Invalid XP value: must be a positive number.');
  }
  if (!data.completed || typeof data.completed !== 'object' || Array.isArray(data.completed)) {
    throw new Error('Invalid completed map.');
  }
  for (const [id, record] of Object.entries(data.completed)) {
    if (typeof id !== 'string' || !record || typeof record !== 'object') {
      throw new Error(`Invalid completion record for ${id}.`);
    }
    if (typeof record.at !== 'string') {
      throw new Error(`Missing completion date for ${id}.`);
    }
    if (typeof record.usedTips !== 'number' || record.usedTips < 0) {
      throw new Error(`Invalid tips count for ${id}.`);
    }
  }
  if (data.belts !== undefined) {
    if (!data.belts || typeof data.belts !== 'object' || Array.isArray(data.belts)) {
      throw new Error('Invalid belts data.');
    }
    for (const [beltId, bRec] of Object.entries(data.belts)) {
      if (!bRec || typeof bRec !== 'object' || typeof bRec.earnedAt !== 'string') {
        throw new Error(`Invalid belt record for ${beltId}.`);
      }
    }
  }
  if (!data.streak || typeof data.streak !== 'object' || typeof data.streak.count !== 'number') {
    throw new Error('Invalid streak data.');
  }
  return true;
}

export class MemoryStorageAdapter {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
}

export class ProgressStore {
  constructor(storage = null, onStorageUnavailable = null) {
    this.storage = storage;
    this.storageAvailable = true;
    this.onStorageUnavailable = onStorageUnavailable;
    this.state = null;

    if (!this.storage) {
      let isAvailable = false;
      if (typeof window !== 'undefined') {
        try {
          const testKey = '__storage_test__';
          window.localStorage.setItem(testKey, '1');
          window.localStorage.removeItem(testKey);
          this.storage = window.localStorage;
          isAvailable = true;
        } catch {
          // localStorage disabled / blocked (e.g. private mode or strict privacy)
        }
      }

      if (!isAvailable) {
        this.storageAvailable = false;
        this.storage = new MemoryStorageAdapter();
        if (this.onStorageUnavailable) {
          try {
            this.onStorageUnavailable();
          } catch (e) {
            console.warn('onStorageUnavailable callback error', e);
          }
        }
      }
    }

    this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) {
        this.state = createDefaultState();
        this.save();
        return;
      }
      const parsed = JSON.parse(raw);
      this.state = migrateState(parsed);
      if (parsed.v !== 2) {
        this.save();
      }
    } catch {
      this.state = createDefaultState();
      this.save();
    }
  }

  save() {
    try {
      this.storage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      this.storageAvailable = false;
      if (this.onStorageUnavailable) this.onStorageUnavailable();
    }
  }

  getState() {
    return { ...this.state };
  }

  recordActivity(todayStr = getLocalDateString()) {
    const lastDay = this.state.streak.lastDay;
    if (!lastDay) {
      this.state.streak.count = 1;
      this.state.streak.lastDay = todayStr;
      this.save();
      return;
    }

    const diff = daysBetween(lastDay, todayStr);
    if (diff === 0) {
      // Same day activity, streak maintained
      return;
    } else if (diff === 1) {
      // Consecutive day
      this.state.streak.count += 1;
      this.state.streak.lastDay = todayStr;
      this.save();
    } else if (diff > 1) {
      // Broken streak
      this.state.streak.count = 1;
      this.state.streak.lastDay = todayStr;
      this.save();
    }
  }

  completeExercise(exerciseId, usedTips = 0, todayStr = getLocalDateString()) {
    if (!exerciseId) return { addedXp: 0, firstCompletion: false };

    this.recordActivity(todayStr);

    if (this.state.completed[exerciseId]) {
      return { addedXp: 0, firstCompletion: false };
    }

    let earnedXp = CONFIG.XP.COMPLETE_EXERCISE;
    if (usedTips === 0) {
      earnedXp += CONFIG.XP.HINT_FREE_BONUS;
    }

    this.state.xp += earnedXp;
    this.state.completed[exerciseId] = {
      at: todayStr,
      kind: 'exercise',
      usedTips: Number(usedTips) || 0,
    };

    this.save();
    return { addedXp: earnedXp, firstCompletion: true };
  }

  completeQuiz(quizId, xp = CONFIG.XP.COMPLETE_QUIZ, todayStr = getLocalDateString()) {
    if (!quizId) return { addedXp: 0, firstCompletion: false };
    this.recordActivity(todayStr);
    if (this.state.completed[quizId]) {
      return { addedXp: 0, firstCompletion: false };
    }
    const earnedXp = Math.max(0, Number(xp) || CONFIG.XP.COMPLETE_QUIZ);
    this.state.xp += earnedXp;
    this.state.completed[quizId] = {
      at: todayStr,
      kind: 'quiz',
      usedTips: 0,
    };
    this.save();
    return { addedXp: earnedXp, firstCompletion: true };
  }

  completeOrder(orderId, usedTips = 0, xp = 10, todayStr = getLocalDateString()) {
    if (!orderId) return { addedXp: 0, firstCompletion: false };
    this.recordActivity(todayStr);
    if (this.state.completed[orderId]) {
      return { addedXp: 0, firstCompletion: false };
    }
    let earnedXp = Number(xp) || 10;
    if (usedTips === 0) {
      earnedXp += CONFIG.XP.HINT_FREE_BONUS;
    }
    this.state.xp += earnedXp;
    this.state.completed[orderId] = {
      at: todayStr,
      kind: 'order',
      usedTips: Number(usedTips) || 0,
    };
    this.save();
    return { addedXp: earnedXp, firstCompletion: true };
  }

  completeGradingTask(taskId, todayStr = getLocalDateString()) {
    if (!taskId) return { addedXp: 0, firstCompletion: false };
    this.recordActivity(todayStr);
    const firstTime = !this.state.completed[taskId];
    this.state.completed[taskId] = {
      at: todayStr,
      kind: 'grading-task',
      usedTips: 0,
    };
    this.save();
    return { addedXp: 0, firstCompletion: firstTime };
  }

  claimBelt(beltId, todayStr = getLocalDateString()) {
    if (!beltId) return { success: false, addedXp: 0 };
    if (!this.state.belts) this.state.belts = {};
    if (this.state.belts[beltId]) {
      return { success: false, addedXp: 0, alreadyClaimed: true };
    }
    this.state.belts[beltId] = { earnedAt: todayStr };
    const addedXp = CONFIG.XP.CLAIM_BELT;
    this.state.xp += addedXp;
    this.save();
    return { success: true, addedXp, alreadyClaimed: false };
  }

  isBeltClaimed(beltId) {
    return Boolean(this.state.belts && this.state.belts[beltId]);
  }

  getCurrentBelt() {
    for (const belt of CONFIG.BELTS) {
      if (!this.isBeltClaimed(belt.id)) {
        return belt;
      }
    }
    return CONFIG.BELTS[CONFIG.BELTS.length - 1];
  }

  isCompleted(exerciseId) {
    return Boolean(this.state.completed[exerciseId]);
  }

  calculateBeltProgress(beltExerciseIds = []) {
    if (!beltExerciseIds || beltExerciseIds.length === 0) {
      return { total: 0, completed: 0, percent: 0, isComplete: false };
    }
    let count = 0;
    for (const id of beltExerciseIds) {
      if (this.isCompleted(id)) {
        count++;
      }
    }
    const percent = Math.round((count / beltExerciseIds.length) * 100);
    return {
      total: beltExerciseIds.length,
      completed: count,
      percent,
      isComplete: count === beltExerciseIds.length,
    };
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    validateImportData(parsed);
    this.state = migrateState(parsed);
    this.save();
    return this.state;
  }

  resetProgress() {
    this.state = createDefaultState();
    this.save();
    return this.state;
  }
}
