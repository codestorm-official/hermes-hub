import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const NOTES_FILE = 'notes.json';
const SETTINGS_FILE = 'settings.json';

export function createNoteStore(options = {}) {
  const dataDir = options.dataDir || path.resolve('data');
  const notesFile = path.join(dataDir, NOTES_FILE);
  const settingsFile = path.join(dataDir, SETTINGS_FILE);
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
    await writeJsonFile(notesFile, notes);
  }

  async function readSettingsFile() {
    await mkdir(dataDir, { recursive: true });

    try {
      const raw = await readFile(settingsFile, 'utf8');
      const parsed = raw.trim() ? JSON.parse(raw) : {};

      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }

      throw error;
    }
  }

  async function writeSettingsFile(settings) {
    await writeJsonFile(settingsFile, settings);
  }

  async function writeJsonFile(file, payload) {
    await mkdir(dataDir, { recursive: true });

    const body = `${JSON.stringify(payload, null, 2)}\n`;
    const tempFile = `${file}.${process.pid}.${Date.now()}.tmp`;

    await writeFile(tempFile, body, 'utf8');
    await rename(tempFile, file);
  }

  function withWriteLock(task) {
    const next = writeChain.then(task, task);
    writeChain = next.catch(() => {});
    return next;
  }

  return {
    dataDir,
    notesFile,
    settingsFile,

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
    },

    async readSettings() {
      return readSettingsFile();
    },

    async updateLlmSettings(input = {}) {
      return withWriteLock(async () => {
        const settings = await readSettingsFile();
        const currentLlm = settings.llm && typeof settings.llm === 'object' ? settings.llm : {};
        const llm = normaliseLlmSettings(input, currentLlm);
        const nextSettings = {
          ...settings,
          llm,
          updatedAt: now().toISOString()
        };

        await writeSettingsFile(nextSettings);
        return nextSettings;
      });
    },

    async updateTelegramSettings(input = {}) {
      return withWriteLock(async () => {
        const settings = await readSettingsFile();
        const currentChannels = settings.channels && typeof settings.channels === 'object' ? settings.channels : {};
        const telegram = normaliseTelegramSettings(input);
        const nextSettings = {
          ...settings,
          channels: {
            ...currentChannels,
            telegram
          },
          updatedAt: now().toISOString()
        };

        await writeSettingsFile(nextSettings);
        return nextSettings;
      });
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

function normaliseLlmSettings(input, current = {}) {
  const next = {
    provider: normaliseString(input.provider),
    baseUrl: normaliseString(input.baseUrl).replace(/\/+$/, ''),
    model: normaliseString(input.model),
    maxContextNotes: parsePositiveInt(input.maxContextNotes, parsePositiveInt(current.maxContextNotes, 6))
  };

  if (input.clearApiKey) {
    next.apiKey = '';
  } else if (normaliseString(input.apiKey)) {
    next.apiKey = normaliseString(input.apiKey);
  } else if (Object.prototype.hasOwnProperty.call(current, 'apiKey')) {
    next.apiKey = normaliseString(current.apiKey);
  }

  return next;
}

function normaliseTelegramSettings(input = {}) {
  return {
    botToken: normaliseString(input.botToken),
    botId: normaliseString(input.botId),
    botUsername: normaliseString(input.botUsername),
    botFirstName: normaliseString(input.botFirstName),
    validatedAt: normaliseString(input.validatedAt)
  };
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
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
