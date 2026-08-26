import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import readline from 'node:readline';
import { dirname } from 'node:path';
import { fromSource } from './project.mjs';

const DEFAULT_SOURCE = 'https://kaikki.org/viwiktionary/raw-wiktextract-data.jsonl.gz';
const DEFAULT_COMMON = 'wordfreq';
const DEFAULT_BLOCKLIST = 'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en';
const DEFAULT_OUTPUT = fromSource('assets/data/english-vocabulary.json');
const ALLOWED_POS = new Set(['noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'intj', 'article', 'pron', 'det', 'num']);
const POS_CODE = {
  noun: 'n', verb: 'v', adj: 'a', adv: 'r', prep: 'p', conj: 'c',
  intj: 'i', article: 't', pron: 'o', det: 'd', num: 'm'
};
const TWO_LETTER_WORDS = new Set([
  'am', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is',
  'it', 'me', 'my', 'no', 'of', 'oh', 'on', 'or', 'ox', 'so', 'to', 'up',
  'us', 'we'
]);
const BLOCKED_TAGS = new Set(['vulgar', 'offensive', 'derogatory', 'slur', 'sexual', 'pornographic']);
const UNSAFE_TEXT = /khiêu dâm|tình dục|sinh dục|giao hợp|dâm dục|tục tĩu|thô tục|miệt thị|xúc phạm|phân biệt chủng tộc|cấm kỵ/i;
const INFLECTION_GLOSS = /^(?:động từ chia|quá khứ (?:và|của)|dạng quá khứ|phân từ (?:quá khứ|hiện tại)?\s*của|dạng số nhiều|số nhiều của|dạng so sánh|dạng viết tắt|từ viết tắt từ)/i;

function parseArguments(argv) {
  const options = {
    source: DEFAULT_SOURCE,
    common: DEFAULT_COMMON,
    blocklist: DEFAULT_BLOCKLIST,
    output: DEFAULT_OUTPUT,
    snapshot: ''
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) continue;
    const [rawKey, inlineValue] = argument.slice(2).split('=', 2);
    const key = rawKey === 'block' ? 'blocklist' : rawKey;
    if (!(key in options)) throw new Error(`Tuỳ chọn không hợp lệ: --${rawKey}`);
    options[key] = inlineValue == null ? argv[++index] : inlineValue;
    if (!options[key]) throw new Error(`Thiếu giá trị cho --${rawKey}`);
  }
  if (!/^https?:\/\//i.test(options.output)) options.output = resolve(projectRoot, options.output);
  return options;
}

function isRemote(location) {
  return /^https?:\/\//i.test(location);
}

async function remoteResponse(location) {
  const response = await fetch(location, { redirect: 'follow' });
  if (!response.ok || !response.body) throw new Error(`Không tải được ${location}: HTTP ${response.status}`);
  return response;
}

async function openStream(location) {
  if (isRemote(location)) return Readable.fromWeb((await remoteResponse(location)).body);
  return createReadStream(resolve(location));
}

async function readText(location) {
  if (location === 'wordfreq') {
    const script = "import re; from wordfreq import top_n_list; print('\\n'.join(word for word in top_n_list('en', 30000, wordlist='best') if re.fullmatch(r'[a-z]+', word)))";
    const result = spawnSync('python', ['-c', script], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
    if (result.status !== 0) {
      throw new Error('Cần cài wordfreq trước khi tạo lại dữ liệu: python -m pip install wordfreq');
    }
    return result.stdout;
  }
  if (isRemote(location)) return (await remoteResponse(location)).text();
  return readFile(resolve(location), 'utf8');
}

function lineSet(text, filter) {
  return new Set(text.split(/\r?\n/)
    .map(value => value.trim().toLowerCase())
    .filter(value => value && (!filter || filter(value))));
}

function cleanGloss(value) {
  let text = String(value || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!text || /^[-–—?]+$/.test(text) || /^xem\b/i.test(text)
      || INFLECTION_GLOSS.test(text) || UNSAFE_TEXT.test(text)) return '';
  if (text.length <= 110) return text;
  const candidate = text.slice(0, 107);
  const stop = Math.max(candidate.lastIndexOf('.'), candidate.lastIndexOf(';'), candidate.lastIndexOf(','));
  return stop >= 48 ? candidate.slice(0, stop + 1) : `${candidate}…`;
}

function eligibleWord(value) {
  return /^[a-z]+(?:['-][a-z]+)*$/.test(value)
    && value.length <= 24
    && (value.length > 2 || TWO_LETTER_WORDS.has(value));
}

function senseGloss(entry, sense) {
  const tags = new Set(sense.tags || []);
  if ([...tags].some(tag => BLOCKED_TAGS.has(tag))) return '';
  if (tags.has('form-of') || tags.has('alt-of') || sense.form_of?.length || sense.alt_of?.length) return '';
  const categories = [...(entry.categories || []), ...(sense.categories || [])].join(' ');
  if (UNSAFE_TEXT.test(categories)) return '';
  for (const gloss of sense.glosses || []) {
    const cleaned = cleanGloss(gloss);
    if (cleaned) return cleaned;
  }
  return '';
}

function vocabularyLevel(word, frequencyRanks) {
  const rank = frequencyRanks.get(word);
  if (rank != null && rank < 3000 && word.length <= 8) return 1;
  if (rank != null && word.length <= 12) return 2;
  return 3;
}

async function buildVocabulary(options) {
  const commonWords = [...lineSet(await readText(options.common), word => /^[a-z]+$/.test(word))];
  const frequencyRanks = new Map(commonWords.map((word, index) => [word, index]));
  const blockedWords = lineSet(await readText(options.blocklist), word => /^[a-z]+$/.test(word));
  const sourceStream = await openStream(options.source);
  const input = options.source.toLowerCase().endsWith('.gz') ? sourceStream.pipe(createGunzip()) : sourceStream;
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  const words = new Map();
  const stats = { read: 0, english: 0, blocked: 0, invalid: 0, noGloss: 0 };

  for await (const line of lines) {
    stats.read += 1;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.lang_code !== 'en' || !ALLOWED_POS.has(entry.pos)) continue;
    stats.english += 1;
    const word = String(entry.word || '').normalize('NFC');
    if (word !== word.toLowerCase() || !eligibleWord(word)) {
      stats.invalid += 1;
      continue;
    }
    if (blockedWords.has(word) || word.split(/['-]/).some(part => blockedWords.has(part))) {
      stats.blocked += 1;
      continue;
    }
    if (words.has(word)) continue;
    let meaning = '';
    for (const sense of entry.senses || []) {
      meaning = senseGloss(entry, sense);
      if (meaning) break;
    }
    if (!meaning) {
      stats.noGloss += 1;
      continue;
    }
    words.set(word, { meaning, pos: POS_CODE[entry.pos] || 'x' });
  }

  const levels = [[], [], []];
  for (const [word, item] of words) {
    const level = vocabularyLevel(word, frequencyRanks);
    levels[level - 1].push([word, item.meaning, item.pos]);
  }
  levels.forEach(rows => rows.sort((left, right) => left[0].localeCompare(right[0], 'en')));
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Wiktionary tiếng Việt qua Kaikki/Wiktextract',
      url: 'https://kaikki.org/viwiktionary/',
      snapshot: options.snapshot || null,
      license: 'CC BY-SA 4.0 / GFDL'
    },
    frequencySource: {
      name: 'wordfreq 3.1.1',
      url: 'https://github.com/rspeer/wordfreq',
      license: 'CC BY-SA 4.0 (data) / Apache-2.0 (code)',
      citation: 'Robyn Speer (2022), rspeer/wordfreq v3.0, DOI 10.5281/zenodo.7199437'
    },
    safetyFilter: {
      name: 'LDNOOBW English word list',
      url: 'https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words',
      license: 'CC BY 4.0'
    },
    counts: levels.map(rows => rows.length),
    levels
  };
  const output = JSON.stringify(payload);
  await mkdir(dirname(options.output), { recursive: true });
  await writeFile(options.output, output, 'utf8');
  return { output: options.output, bytes: Buffer.byteLength(output), counts: payload.counts, stats };
}

const options = parseArguments(process.argv.slice(2));
const result = await buildVocabulary(options);
console.log(`✓ Đã tạo ${result.counts.reduce((sum, count) => sum + count, 0).toLocaleString('vi-VN')} từ`);
console.log(`  Cấp 1/2/3: ${result.counts.map(count => count.toLocaleString('vi-VN')).join(' / ')}`);
console.log(`  Kích thước: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Tệp: ${result.output}`);
console.log(`  Thống kê lọc: ${JSON.stringify(result.stats)}`);
