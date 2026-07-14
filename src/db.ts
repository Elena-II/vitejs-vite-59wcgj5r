import Dexie, { Table } from 'dexie';
import { TestAttempt, TestResult, SubjectStats } from './types';

class TestDB extends Dexie {
  attempts!: Table<TestAttempt>;
  results!: Table<TestResult>;
  stats!: Table<SubjectStats>;

  constructor() {
    super('SchoolTestDB');
    this.version(1).stores({
      attempts: 'subjectId',
      results: '++id, subjectId, date',
      stats: 'subjectId'
    });
  }
}

export const db = new TestDB();