// src/database/queries.ts
import { getDB } from './db';
import { Section, MediaType, AppEvent, Note, EventStatus, NoteContentBlock } from '../types';

// --- SECTIONS ---
export const fetchSections = async (): Promise<Section[]> => {
  const db = await getDB();
  if (!db) return [];
  return await db.getAllAsync<Section>(
    'SELECT id, name, iconName, sortOrder FROM sections ORDER BY sortOrder ASC;'
  );
};

export const fetchSectionById = async (sectionId: string): Promise<Section | null> => {
  const db = await getDB();
  if (!db) return null;
  const sections = await db.getAllAsync<Section>(
    'SELECT id, name, iconName FROM sections WHERE id = ?;',
    [sectionId]
  );
  return sections.length > 0 ? sections[0] : null;
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

export const createEvent = async (event: Omit<AppEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
  const db = await getDB();
  if (!db) return null;
  const id = `evt_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO events (id, section_id, title, type, priority, status, start_time, end_time, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      event.sectionId || null,
      event.title,
      event.type,
      event.priority,
      event.status,
      event.startTime,
      event.endTime || null,
      event.remark || null,
      now,
      now,
    ]
  );
  return id;
};

export const updateEventStatus = async(eventId:string,status:EventStatus,remark?:string) => {
  const db = await getDB();
  const now  = new Date().toISOString();
  if(!db) return null;

  await db.runAsync(
    `UPDATE events SET status = ?, remark = ?, updated_at = ? WHERE id = ?;`,
    [status, remark || null, now, eventId]
  );
}

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

export const createNote = async (data: {
  title: string;
  label: string;
  sectionId: string;
  initialText: string;
}): Promise<string> => {
  const db = await getDB();
  if (!db) return '';
  const noteId = `note_${Date.now()}`;
  const blockId = `blk_${Date.now()}`;
  const now = new Date().toISOString();

  // Calculate line count from raw text
  const lineCount = data.initialText ? data.initialText.split('\n').length : 0;

  await db.withTransactionAsync(async () => {
    // Insert master note record
    await db.runAsync(
      `INSERT INTO notes (id, section_id, title, label, line_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [noteId, data.sectionId, data.title, data.label || 'General', lineCount, now, now]
    );

    // Insert initial text block
    if (data.initialText) {
      await db.runAsync(
        `INSERT INTO note_contents (id, note_id, type, content, block_order)
         VALUES (?, ?, ?, ?, ?);`,
        [blockId, noteId, 'text', data.initialText, 0]
      );
    }
  });

  return noteId;
};

export const fetchNoteBlocks = async (noteId: string): Promise<NoteContentBlock[]> => {
  const db = await getDB();
  if (!db) return [];
  return await db.getAllAsync<NoteContentBlock>(
    `SELECT id, note_id as noteId, type, content, block_order as blockOrder
     FROM note_contents WHERE note_id = ? ORDER BY block_order ASC;`,
    [noteId]
  );
};


export const addNoteBlock = async (
  noteId: string,
  type: MediaType,
  content: string,
  blockOrder: number
): Promise<NoteContentBlock> => {
  const db = await getDB();
  if (!db) return { id: '', noteId, type, content, blockOrder };
  const id = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO note_contents (id, note_id, type, content, block_order)
       VALUES (?, ?, ?, ?, ?);`,
      [id, noteId, type, content, blockOrder]
    );

    // Update note's updated_at timestamp
    await db.runAsync(`UPDATE notes SET updated_at = ? WHERE id = ?;`, [now, noteId]);
  });

  return { id, noteId, type, content, blockOrder };
};

export const updateNoteBlock = async (blockId: string, content: string, noteId: string) => {
  const db = await getDB();
  if (!db) return;
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE note_contents SET content = ? WHERE id = ?;`, [content, blockId]);
    await db.runAsync(`UPDATE notes SET updated_at = ? WHERE id = ?;`, [now, noteId]);
  });
};

export const deleteNoteBlock = async (noteId: string, blockId?: string) => {
  const db = await getDB();
  if (!db) return;
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    if (blockId) {
      await db.runAsync(`DELETE FROM note_contents WHERE id = ?;`, [blockId]);
    } else {
      await db.runAsync(`DELETE FROM note_contents WHERE note_id = ?;`, [noteId]);
      await db.runAsync(`DELETE FROM notes WHERE id = ?;`, [noteId]);
    }
  });
};

export const updateNoteMetadata = async (
  noteId: string,
  title: string,
  label: string,
  lineCount: number
) => {
  const db = await getDB();
  if (!db) return;
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE notes SET title = ?, label = ?, line_count = ?, updated_at = ? WHERE id = ?;`,
    [title, label, lineCount, now, noteId]
  );
};
