/**
 * Parses terminal-style `ani-cli` commands entered in the Web Neural Omni-Bar (Cmd+K).
 * Supports native flags from `ani-cli.1`:
 *   -e / --episode <number|range>
 *   -q / --quality <1080|720|480|360|best|worst>
 *   --dub (switch to English Dub pool)
 *   --rofi / --fzf (toggle UI view mode)
 *   -c / --continue (resume from watch history)
 *   --exact (strict title match per PR #1938)
 */

export interface ParsedAniCliCommand {
  action: 'watch' | 'search' | 'continue' | 'syncplay' | 'update';
  query: string;
  episode: number;
  quality: '1080p' | '720p' | '480p' | '360p' | 'auto';
  mode: 'sub' | 'dub';
  exactMatch: boolean;
  syncplayRoom: string | null;
}

export function parseAniCliSyntax(rawInput: string): ParsedAniCliCommand {
  const tokens = rawInput.trim().split(/\s+/);
  const result: ParsedAniCliCommand = {
    action: 'search',
    query: '',
    episode: 1,
    quality: '1080p',
    mode: 'sub',
    exactMatch: false,
    syncplayRoom: null,
  };

  const queryParts: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token === 'ani-cli' || token === '>') {
      i++;
      continue;
    }
    if (token === 'watch' || token === 'play') {
      result.action = 'watch';
    } else if (token === '-c' || token === '--continue' || token === 'continue') {
      result.action = 'continue';
    } else if (token === '-U' || token === '--update') {
      result.action = 'update';
    } else if (token === '--dub' || token === '-d') {
      result.mode = 'dub';
    } else if (token === '--exact') {
      result.exactMatch = true;
    } else if ((token === '-e' || token === '--episode' || token === 'ep') && tokens[i + 1]) {
      const epNum = parseInt(tokens[i + 1], 10);
      if (!Number.isNaN(epNum) && epNum > 0) {
        result.episode = epNum;
        result.action = 'watch';
      }
      i++;
    } else if ((token === '-q' || token === '--quality') && tokens[i + 1]) {
      const q = tokens[i + 1].replace('p', '');
      if (q === '1080' || q === 'best') result.quality = '1080p';
      else if (q === '720') result.quality = '720p';
      else if (q === '480') result.quality = '480p';
      else if (q === '360' || q === 'worst') result.quality = '360p';
      i++;
    } else if (token === '-s' || token === '--syncplay') {
      result.action = 'syncplay';
      result.syncplayRoom = tokens[i + 1] && !tokens[i + 1].startsWith('-') ? tokens[++i] : 'orbital-lobby-01';
    } else {
      queryParts.push(token);
    }
    i++;
  }

  result.query = queryParts.join(' ').trim();
  if (result.query && result.action === 'search' && rawInput.includes('-e')) {
    result.action = 'watch';
  }
  return result;
}
