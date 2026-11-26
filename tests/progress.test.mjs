import test from 'node:test';
import assert from 'node:assert/strict';
import { ProgressStore, MemoryStorageAdapter, daysBetween, validateImportData } from '../docs/assets/js/progress.js';
import { CONFIG } from '../docs/assets/js/config.js';

test('first run initializes clean default state', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);
  const state = store.getState();

  assert.equal(state.v, 2);
  assert.equal(state.xp, 0);
  assert.deepEqual(state.completed, {});
  assert.deepEqual(state.belts, {});
  assert.equal(state.streak.count, 0);
  assert.equal(state.streak.lastDay, null);
});

test('completing an exercise awards XP and bonus when no tips used', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  const res = store.completeExercise('white-01-hello', 0, '2026-11-27');
  assert.equal(res.firstCompletion, true);
  assert.equal(res.addedXp, 15); // 10 + 5 bonus
  assert.equal(store.getState().xp, 15);
  assert.equal(store.isCompleted('white-01-hello'), true);
});

test('completing with tips awards base XP only', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  const res = store.completeExercise('white-01-hello', 2, '2026-11-27');
  assert.equal(res.firstCompletion, true);
  assert.equal(res.addedXp, 10);
  assert.equal(store.getState().xp, 10);
});

test('completing twice awards no additional XP', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  store.completeExercise('white-01-hello', 0, '2026-11-27');
  const res2 = store.completeExercise('white-01-hello', 0, '2026-11-27');

  assert.equal(res2.firstCompletion, false);
  assert.equal(res2.addedXp, 0);
  assert.equal(store.getState().xp, 15);
});

test('streak continuity and timezone/date boundary calculation', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  // Day 1
  store.completeExercise('ex-1', 0, '2026-11-27');
  assert.equal(store.getState().streak.count, 1);
  assert.equal(store.getState().streak.lastDay, '2026-11-27');

  // Same day repeated activity does not increment streak
  store.recordActivity('2026-11-27');
  assert.equal(store.getState().streak.count, 1);

  // Consecutive day (Day 2)
  store.recordActivity('2026-11-28');
  assert.equal(store.getState().streak.count, 2);
  assert.equal(store.getState().streak.lastDay, '2026-11-28');

  // Consecutive day across month boundary
  assert.equal(daysBetween('2026-11-30', '2026-12-01'), 1);

  // Consecutive day across year boundary
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);
});

test('streak resets after gap of more than 1 day', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  store.recordActivity('2026-11-20');
  assert.equal(store.getState().streak.count, 1);

  // Jump to 2026-11-25 (5 day gap)
  store.recordActivity('2026-11-25');
  assert.equal(store.getState().streak.count, 1);
  assert.equal(store.getState().streak.lastDay, '2026-11-25');
});

test('handles corrupted JSON in storage gracefully', () => {
  const adapter = new MemoryStorageAdapter();
  adapter.setItem(CONFIG.STORAGE_KEY, '{ invalid json: bad');

  const store = new ProgressStore(adapter);
  assert.equal(store.getState().v, 2);
  assert.equal(store.getState().xp, 0);
});

test('handles unavailable storage with fallback and callback notice', () => {
  let noticeTriggered = false;
  const failingAdapter = {
    getItem() { throw new Error('Storage disabled'); },
    setItem() { throw new Error('Storage disabled'); },
    removeItem() { throw new Error('Storage disabled'); },
  };

  const store = new ProgressStore(null, () => {
    noticeTriggered = true;
  });
  // Simulate unavailable by calling save with error
  store.storage = failingAdapter;
  store.save();

  assert.equal(store.storageAvailable, false);
  assert.equal(noticeTriggered, true);
});

test('schema migration handles legacy v1 data to v2 safely', () => {
  const adapter = new MemoryStorageAdapter();
  adapter.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
    v: 1,
    xp: 50,
    completed: { 'white-01-hello': { at: '2026-11-27', usedTips: 1 } },
    streak: { count: 3, lastDay: '2026-11-26' },
    createdAt: '2026-11-20',
  }));

  const store = new ProgressStore(adapter);
  const state = store.getState();
  assert.equal(state.v, 2);
  assert.equal(state.xp, 50);
  assert.equal(state.streak.count, 3);
  assert.equal(state.completed['white-01-hello'].kind, 'exercise');
  assert.deepEqual(state.belts, {});
});

test('claiming a belt awards 50 XP once and prevents duplicate XP', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  const claim1 = store.claimBelt('white', '2026-11-27');
  assert.equal(claim1.success, true);
  assert.equal(claim1.addedXp, 50);
  assert.equal(store.getState().xp, 50);
  assert.equal(store.isBeltClaimed('white'), true);

  // Claiming again awards 0 XP
  const claim2 = store.claimBelt('white', '2026-11-27');
  assert.equal(claim2.success, false);
  assert.equal(claim2.alreadyClaimed, true);
  assert.equal(claim2.addedXp, 0);
  assert.equal(store.getState().xp, 50);
});

test('completing a quiz awards XP once', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  const q1 = store.completeQuiz('white-03-quiz', 5, '2026-11-27');
  assert.equal(q1.firstCompletion, true);
  assert.equal(q1.addedXp, 5);
  assert.equal(store.getState().xp, 5);

  const q2 = store.completeQuiz('white-03-quiz', 5, '2026-11-27');
  assert.equal(q2.firstCompletion, false);
  assert.equal(q2.addedXp, 0);
  assert.equal(store.getState().xp, 5);
});

test('completing an order problem awards XP once with hint bonus', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  const o1 = store.completeOrder('white-05-order', 0, 10, '2026-11-27');
  assert.equal(o1.firstCompletion, true);
  assert.equal(o1.addedXp, 15); // 10 base + 5 bonus
  assert.equal(store.getState().xp, 15);

  const o2 = store.completeOrder('white-05-order', 0, 10, '2026-11-27');
  assert.equal(o2.firstCompletion, false);
  assert.equal(o2.addedXp, 0);
});

test('import validation of bad belts data', () => {
  assert.throws(() => validateImportData({
    v: 2,
    xp: 0,
    completed: {},
    belts: 'not an object',
    streak: { count: 0, lastDay: null },
  }));

  assert.throws(() => validateImportData({
    v: 2,
    xp: 0,
    completed: {},
    belts: { white: { earnedAt: 12345 } }, // bad earnedAt type
    streak: { count: 0, lastDay: null },
  }));
});

test('import validation accepts valid data and rejects invalid schemas', () => {
  const validData = {
    v: 1,
    xp: 25,
    completed: {
      'white-01-hello': { at: '2026-11-27', usedTips: 0 },
    },
    streak: { count: 1, lastDay: '2026-11-27' },
    createdAt: '2026-11-27',
  };

  assert.doesNotThrow(() => validateImportData(validData));

  // Reject bad types
  assert.throws(() => validateImportData('not an object'));
  assert.throws(() => validateImportData({ v: 1, xp: -5 }));
  assert.throws(() => validateImportData({ v: 1, xp: 10, completed: 'bad' }));
  assert.throws(() => validateImportData({ v: 1, xp: 10, completed: { 'x': { at: 123 } } }));
});

test('export and import round-trip restores state perfectly', () => {
  const adapter1 = new MemoryStorageAdapter();
  const store1 = new ProgressStore(adapter1);
  store1.completeExercise('white-01-hello', 0, '2026-11-27');
  store1.completeExercise('white-02-variables', 1, '2026-11-27');

  const exported = store1.exportData();

  const adapter2 = new MemoryStorageAdapter();
  const store2 = new ProgressStore(adapter2);
  store2.importData(exported);

  assert.deepEqual(store2.getState(), store1.getState());
  assert.equal(store2.getState().xp, 25); // 15 + 10
});

test('belt progress calculation', () => {
  const adapter = new MemoryStorageAdapter();
  const store = new ProgressStore(adapter);

  const beltIds = ['white-01-hello', 'white-02-variables'];
  let prog = store.calculateBeltProgress(beltIds);
  assert.equal(prog.total, 2);
  assert.equal(prog.completed, 0);
  assert.equal(prog.percent, 0);
  assert.equal(prog.isComplete, false);

  store.completeExercise('white-01-hello', 0, '2026-11-27');
  prog = store.calculateBeltProgress(beltIds);
  assert.equal(prog.completed, 1);
  assert.equal(prog.percent, 50);
  assert.equal(prog.isComplete, false);

  store.completeExercise('white-02-variables', 0, '2026-11-27');
  prog = store.calculateBeltProgress(beltIds);
  assert.equal(prog.completed, 2);
  assert.equal(prog.percent, 100);
  assert.equal(prog.isComplete, true);
});
