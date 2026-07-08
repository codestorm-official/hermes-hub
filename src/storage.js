import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const NOTES_FILE = 'notes.json';

export function createNoteStore(options = {}) {
  const dataDir = options.dataDir || path.resolve('data');
  const notesFile = path.join(dataDir, NOTES_FILE);
  const now = options.now || (() => new Date());
  const idFactory = options.idFactory || randomUUID;
  let writeChain = Promise.resolve();

  async function ensureStore() {
    await mkdir(dataDir, { recursive: true });

    try {
      await readFile(notesFile, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await writeFile(notesFile, '[]\n', 'utf8');
    }
  }

  async function readNotes() {
    await ensureStore();

    const raw = await readFile(notesFile, 'utf8');
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    const notes = Array.isArray(parsed) ? parsed : parsed.notes;

    if (!Array.isArray(notes)) {
      return [];
    }

    return notes;
  }

  async function writeNotes(notes) {
    await mkdir(dataDir, { recursive: true });

    const body = `${JSON.stringify(notes, null, 2)}\n`;
    const tempFile = `${notesFile}.${process.pid}.${Date.now()}.tmp`;

    await writeFile(tempFile, body, 'utf8');
    await rename(tempFile, notesFile);
  }

  function withWriteLock(task) {
    const next = writeChain.then(task, task);
    writeChain = next.catch(() => {});
    return next;
  }

  return {
    dataDir,
    notesFile,

    async listNotes(filters = {}) {
      const notes = await readNotes();
      const query = normaliseString(filters.query).toLowerCase();

      return notes
        .filter((note) => matchesQuery(note, query))
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },

    async createNote(input = {}) {
      return withWriteLock(async () => {
        const notes = await readNotes();
        const timestamp = now().toISOString();
        const content = normaliseString(input.content);
        const title = normaliseString(input.title) || deriveTitle(content);

        if (!title && !content) {
          const error = new Error('A title or content is required.');
          error.statusCode = 400;
          error.code = 'invalid_note';
          throw error;
        }

        const note = {
          id: idFactory(),
          title: title || 'Untitled note',
          content,
          tags: normaliseTags(input.tags),
          source: normaliseString(input.source),
          createdAt: timestamp,
          updatedAt: timestamp
        };

        notes.push(note);
        await writeNotes(notes);

        return note;
      });
    },

    async deleteNote(id) {
      return withWriteLock(async () => {
        const notes = await readNotes();
        const nextNotes = notes.filter((note) => note.id !== id);

        if (nextNotes.length === notes.length) {
          return false;
        }

        await writeNotes(nextNotes);
        return true;
      });
    },

    async stats() {
      const notes = await readNotes();
      const sorted = [...notes].sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));

      return {
        noteCount: notes.length,
        latestNoteAt: sorted[0]?.updatedAt || null
      };
    }
  };
}

function normaliseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normaliseTags(value) {
  if (Array.isArray(value)) {
    return value.map(normaliseString).filter(Boolean).slice(0, 20);
  }

  return normaliseString(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function deriveTitle(content) {
  const firstLine = content.split('\n').find((line) => line.trim());

  if (!firstLine) {
    return '';
  }

  return firstLine.trim().slice(0, 80);
}

function matchesQuery(note, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    note.title,
    note.content,
    note.source,
    ...(Array.isArray(note.tags) ? note.tags : [])
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}
