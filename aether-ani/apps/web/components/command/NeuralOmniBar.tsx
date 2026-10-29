'use client';

import React, { useState, useEffect } from 'react';
import { parseAniCliSyntax, ParsedAniCliCommand } from '@aether-ani/shared-schemas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (cmd: ParsedAniCliCommand) => void;
}

const PRESETS = [
  'watch attack on titan -e 1 --dub -q 1080',
  'watch spirited away -e 1 -q 1080',
  'watch naruto -e 1 --dub -q 1080',
  'watch jujutsu kaisen -e 1 -q 1080',
  'watch princess mononoke -e 1 -q 1080',
  'watch demon slayer -e 1 -q 1080',
  'watch cyberpunk -e 2 --dub -q 1080',
  'watch howl\'s moving castle -e 1 -q 1080',
  'watch one piece -e 1 -q 1080',
];

export function NeuralOmniBar({ isOpen, onClose, onExecute }: Props) {
  const [input, setInput] = useState('watch attack on titan -e 1 --dub -q 1080');
  const parsed = parseAniCliSyntax(input);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 pt-20 px-4 backdrop-blur-md">
      <div className="hud-glass w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-white/10">
        <div className="mb-3 flex items-center justify-between text-xs font-mono text-cyan-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>ANI-CLI v5.1 NEURAL FZF OMNI-BAR</span>
          </span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-slate-300">ESC TO CLOSE</span>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onExecute(parsed);
              onClose();
            }
          }}
          className="w-full rounded-xl bg-slate-950/90 px-4 py-3 font-mono text-sm text-white outline-none ring-1 ring-cyan-500/40 focus:ring-2 focus:ring-cyan-400"
          placeholder="Type anime title or ani-cli flags: watch <title> -e 12 --dub -q 1080"
          autoFocus
        />

        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-slate-300">
          <span className="rounded bg-cyan-500/10 px-2.5 py-1 text-cyan-300">ACTION: {parsed.action.toUpperCase()}</span>
          <span className="rounded bg-indigo-500/10 px-2.5 py-1 text-indigo-300">QUERY: {parsed.query || 'ALL'}</span>
          <span className="rounded bg-emerald-500/10 px-2.5 py-1 text-emerald-300">EPISODE: {parsed.episode}</span>
          <span className="rounded bg-fuchsia-500/10 px-2.5 py-1 text-fuchsia-300">AUDIO: {parsed.mode.toUpperCase()}</span>
          <span className="rounded bg-amber-500/10 px-2.5 py-1 text-amber-300">QUALITY: {parsed.quality}</span>
        </div>

        {/* Quick CLI syntax presets */}
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="mb-2 font-mono text-[11px] text-slate-400">QUICK FZF SYNTAX PRESETS:</div>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setInput(preset);
                  const p = parseAniCliSyntax(preset);
                  onExecute(p);
                  onClose();
                }}
                className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
