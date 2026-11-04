// src/database/queries.ts
import { getDB } from './db';
import { Section, AppEvent, Note } from '../types';

// --- SECTIONS ---
export const fetchSections = async (): Promise<Section[]> => {
  const db = await getDB();
  if (!db) return [];
  return await db.getAllAsync<Section>(
    'SELECT id, name, iconName, sortOrder FROM sections ORDER BY sortOrder ASC;'
  );
};

// --- EVENTS / TODOS ---
export const fetchEventsBySection = async (sectionId?: string): Promise<AppEvent[]> => {
  const db = await getDB();
  if (!db) return [];
  if (sectionId) {
    return await db.getAllAsync<AppEvent>(
      'SELECT id, section_id as sectionId, title, type, priority, status, start_time as startTime, end_time as endTime, remark, created_at as createdAt, updated_at as updatedAt FROM events WHERE section_id = ? ORDER BY start_time DESC;',
      [sectionId]
    );
  }
  return await db.getAllAsync<AppEvent>(
    'SELECT id, section_id as sectionId, title, type, priority, status, start_time as startTime, end_time as endTime, remark, created_at as createdAt, updated_at as updatedAt FROM events ORDER BY start_time DESC;'
  );
};

// --- NOTES ---
export const fetchNotesBySection = async (sectionId?: string): Promise<Note[]> => {
  const db = await getDB();
  if (!db) return [];
  if (sectionId) {
    return await db.getAllAsync<Note>(
      'SELECT id, section_id as sectionId, title, label, line_count as lineCount, created_at as createdAt, updated_at as updatedAt FROM notes WHERE section_id = ? ORDER BY updated_at DESC;',
      [sectionId]
    );
  }
  return await db.getAllAsync<Note>(
    'SELECT id, section_id as sectionId, title, label, line_count as lineCount, created_at as createdAt, updated_at as updatedAt FROM notes ORDER BY updated_at DESC;'
  );
};
