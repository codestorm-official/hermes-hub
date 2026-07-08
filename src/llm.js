const DEFAULT_MAX_CONTEXT_NOTES = 6;

export function resolveLlmConfig(env = process.env) {
  return {
    provider: normaliseProvider(env.LLM_PROVIDER || ''),
    apiKey: env.LLM_API_KEY || '',
    baseUrl: trimTrailingSlash(env.LLM_BASE_URL || ''),
    model: env.LLM_MODEL || '',
    maxContextNotes: parsePositiveInt(env.LLM_MAX_CONTEXT_NOTES, DEFAULT_MAX_CONTEXT_NOTES)
  };
}

export function isLlmConfigured(config) {
  if (config.provider === 'ollama') {
    return Boolean(config.baseUrl && config.model);
  }

  return Boolean(config.provider && config.apiKey && config.baseUrl && config.model);
}

export async function answerFromNotes({ question, notes, config, fetchImpl = fetch }) {
  const cleanQuestion = normaliseString(question);

  if (!cleanQuestion) {
    const error = new Error('Question is required.');
    error.statusCode = 400;
    error.code = 'invalid_question';
    throw error;
  }

  if (!isLlmConfigured(config)) {
    const error = new Error('LLM is not configured.');
    error.statusCode = 503;
    error.code = 'llm_not_configured';
    throw error;
  }

  const selectedNotes = rankNotesForQuestion(notes, cleanQuestion).slice(0, config.maxContextNotes);
  const context = buildContext(selectedNotes);
  const messages = buildMessages(cleanQuestion, context);
  const answer = normaliseAnswerText(await callLlm(config, messages, fetchImpl));

  return {
    answer,
    sources: selectedNotes.map((note) => ({
      id: note.id,
      title: note.title,
      source: note.source || '',
      updatedAt: note.updatedAt
    }))
  };
}

export async function loadLlmModels({ config, fetchImpl = fetch }) {
  if (config.provider === 'openai-compatible') {
    return loadOpenAiCompatibleModels(config, fetchImpl);
  }

  if (config.provider === 'ollama') {
    return loadOllamaModels(config, fetchImpl);
  }

  const error = new Error('Model loading is not supported for this provider yet.');
  error.statusCode = 400;
  error.code = 'models_not_supported';
  throw error;
}

export async function checkLlmConnection({ config, fetchImpl = fetch, requireModel = false }) {
  if (!config?.provider) {
    return { ok: true, models: [] };
  }

  if (!config.baseUrl || (config.provider !== 'ollama' && !config.apiKey)) {
    throw createLlmError(
      'Provider, base URL, and API key are required before saving LLM settings.',
      400,
      'llm_check_missing_config'
    );
  }

  if (requireModel && !config.model) {
    throw createLlmError('A model is required before saving LLM settings.', 400, 'llm_model_required');
  }

  if (config.provider === 'openai-compatible' || config.provider === 'ollama') {
    const models = await loadLlmModels({ config, fetchImpl });

    if (config.model && models.length && !models.includes(config.model)) {
      throw createLlmError('Selected model was not returned by the provider.', 400, 'llm_model_not_available');
    }

    return { ok: true, models };
  }

  if (config.provider === 'anthropic') {
    if (!config.model) {
      throw createLlmError('A model is required to check Anthropic-compatible settings.', 400, 'llm_model_required');
    }

    await checkAnthropicConnection(config, fetchImpl);
    return { ok: true, models: [] };
  }

  throw createLlmError('Unsupported LLM provider.', 400, 'unsupported_llm_provider');
}

export function rankNotesForQuestion(notes, question) {
  const terms = tokenise(question);

  return [...notes]
    .map((note) => ({
      note,
      score: scoreNote(note, terms, question)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return String(right.note.updatedAt).localeCompare(String(left.note.updatedAt));
    })
    .map((item) => item.note);
}

function normaliseProvider(value) {
  const provider = normaliseString(value).toLowerCase();

  if (['openai', 'openai-compatible', 'compatible'].includes(provider)) {
    return 'openai-compatible';
  }

  if (['anthropic', 'claude'].includes(provider)) {
    return 'anthropic';
  }

  if (provider === 'ollama') {
    return 'ollama';
  }

  return '';
}

function trimTrailingSlash(value) {
  return normaliseString(value).replace(/\/+$/, '');
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normaliseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normaliseAnswerText(value) {
  return normaliseString(value)
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\s*\((?:note|source)\s+\d+\)/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function tokenise(value) {
  return normaliseString(value)
    .toLowerCase()
    .split(/[^a-z0-9_\-]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function scoreNote(note, terms, question) {
  const title = normaliseString(note.title).toLowerCase();
  const content = normaliseString(note.content).toLowerCase();
  const source = normaliseString(note.source).toLowerCase();
  const tags = Array.isArray(note.tags) ? note.tags.map((tag) => normaliseString(tag).toLowerCase()) : [];
  const haystack = [title, content, source, ...tags].join(' ');
  let score = 0;

  if (haystack.includes(question.toLowerCase())) {
    score += 12;
  }

  for (const term of terms) {
    if (title.includes(term)) {
      score += 5;
    }

    if (tags.some((tag) => tag.includes(term))) {
      score += 4;
    }

    if (content.includes(term)) {
      score += 2;
    }

    if (source.includes(term)) {
      score += 1;
    }
  }

  return score;
}

function buildContext(notes) {
  if (!notes.length) {
    return 'No matching notes were found.';
  }

  return notes
    .map((note, index) => {
      const tags = Array.isArray(note.tags) && note.tags.length ? `\nTags: ${note.tags.join(', ')}` : '';
      const source = note.source ? `\nSource: ${note.source}` : '';
      const content = normaliseString(note.content).slice(0, 3000);

      return `Note ${index + 1}\nTitle: ${note.title}${tags}${source}\nUpdated: ${note.updatedAt}\nContent:\n${content}`;
    })
    .join('\n\n---\n\n');
}

function buildMessages(question, context) {
  return [
    {
      role: 'system',
      content: [
        'You are Hermes Hub, a private second-brain assistant.',
        'Answer using only the provided notes context.',
        'Write in the same language as the user when possible.',
        'Answer directly instead of opening with phrases like "According to the note", unless the user asks for sources.',
        'Use natural plain prose without Markdown formatting.',
        'Do not include inline source labels such as "(Note 1)" or "(Source 1)" because sources are shown separately.',
        'Mention note titles only when they are necessary to answer the question.',
        'If the notes do not contain enough information, say so clearly.',
        'Keep the answer concise and practical.'
      ].join(' ')
    },
    {
      role: 'user',
      content: `Question:\n${question}\n\nNotes context:\n${context}`
    }
  ];
}

async function callLlm(config, messages, fetchImpl) {
  if (config.provider === 'openai-compatible') {
    return callOpenAiCompatible(config, messages, fetchImpl);
  }

  if (config.provider === 'anthropic') {
    return callAnthropic(config, messages, fetchImpl);
  }

  if (config.provider === 'ollama') {
    return callOllama(config, messages, fetchImpl);
  }

  const error = new Error('Unsupported LLM provider.');
  error.statusCode = 400;
  error.code = 'unsupported_llm_provider';
  throw error;
}

async function callOpenAiCompatible(config, messages, fetchImpl) {
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2
    })
  });
  const body = await parseJsonResponse(response);

  return normaliseString(body.choices?.[0]?.message?.content);
}

async function callAnthropic(config, messages, fetchImpl) {
  const systemMessage = messages.find((message) => message.role === 'system')?.content || '';
  const userMessages = messages.filter((message) => message.role !== 'system');
  const response = await fetchImpl(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 900,
      temperature: 0.2,
      system: systemMessage,
      messages: userMessages
    })
  });
  const body = await parseJsonResponse(response);

  return normaliseString(body.content?.find((item) => item.type === 'text')?.text);
}

async function checkAnthropicConnection(config, fetchImpl) {
  const response = await fetchImpl(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1,
      messages: [
        {
          role: 'user',
          content: 'Return OK.'
        }
      ]
    })
  });

  await parseJsonResponse(response);
}

async function callOllama(config, messages, fetchImpl) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await fetchImpl(getOllamaChatUrl(config.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false
    })
  });
  const body = await parseJsonResponse(response);

  return normaliseString(body.message?.content || body.response);
}

async function loadOpenAiCompatibleModels(config, fetchImpl) {
  if (!config.baseUrl || !config.apiKey) {
    const error = new Error('Base URL and API key are required to load models.');
    error.statusCode = 400;
    error.code = 'llm_models_missing_config';
    throw error;
  }

  const response = await fetchImpl(`${config.baseUrl}/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: 'application/json'
    }
  });
  const body = await parseJsonResponse(response);

  return normaliseModelIds(Array.isArray(body.data) ? body.data.map((item) => item.id) : []);
}

async function loadOllamaModels(config, fetchImpl) {
  if (!config.baseUrl) {
    const error = new Error('Base URL is required to load models.');
    error.statusCode = 400;
    error.code = 'llm_models_missing_config';
    throw error;
  }

  const headers = {
    Accept: 'application/json'
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await fetchImpl(getOllamaTagsUrl(config.baseUrl), {
    method: 'GET',
    headers
  });
  const body = await parseJsonResponse(response);

  return normaliseModelIds(Array.isArray(body.models) ? body.models.map((item) => item.name || item.model) : []);
}

function getOllamaChatUrl(baseUrl) {
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/chat`;
  }

  return `${baseUrl}/api/chat`;
}

function getOllamaTagsUrl(baseUrl) {
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/tags`;
  }

  return `${baseUrl}/api/tags`;
}

function normaliseModelIds(values) {
  return [...new Set(values.map(normaliseString).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function createLlmError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(body.error?.message || body.error || `LLM request failed with status ${response.status}.`);
    error.statusCode = response.status;
    error.code = 'llm_request_failed';
    throw error;
  }

  return body;
}
