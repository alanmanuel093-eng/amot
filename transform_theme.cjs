const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const replacements = [
  { p: /bg-\[#f5f5f7\]/g, r: 'bg-[#f5f5f7] dark:bg-zinc-950' },
  { p: /bg-white/g, r: 'bg-white dark:bg-zinc-900' },
  { p: /text-zinc-900/g, r: 'text-zinc-900 dark:text-white' },
  { p: /text-zinc-800/g, r: 'text-zinc-800 dark:text-zinc-200' },
  { p: /text-zinc-600/g, r: 'text-zinc-600 dark:text-zinc-300' },
  { p: /text-zinc-500/g, r: 'text-zinc-500 dark:text-zinc-400' },
  { p: /text-zinc-400/g, r: 'text-zinc-400 dark:text-zinc-500' },
  { p: /border-black\/5/g, r: 'border-black/5 dark:border-white/5' },
  { p: /ring-1 ring-black\/5/g, r: 'ring-1 ring-black/5 dark:ring-white/5' },
  { p: /bg-gray-50\/50/g, r: 'bg-gray-50/50 dark:bg-zinc-800/50' },
  { p: /bg-gray-50/g, r: 'bg-gray-50 dark:bg-zinc-800' },
  { p: /bg-gray-100/g, r: 'bg-gray-100 dark:bg-zinc-800/80' },
  { p: /bg-slate-100/g, r: 'bg-slate-100 dark:bg-zinc-800' },
  { p: /border-white/g, r: 'border-white dark:border-zinc-800' },
  { p: /bg-zinc-900/g, r: 'bg-zinc-900 dark:bg-white' },
  { p: /text-slate-950/g, r: 'text-slate-950 dark:text-white' },
  // Since bg-zinc-900 flips to bg-white on dark mode for standard accents,
  // we also need to flip text-white inside it to dark:text-zinc-900
  { p: /text-white/g, r: 'text-white dark:text-zinc-900' }, 
  { p: /hover:bg-zinc-800/g, r: 'hover:bg-zinc-800 dark:hover:bg-zinc-200' },
  { p: /hover:bg-slate-100/g, r: 'hover:bg-slate-100 dark:hover:bg-zinc-800' },
  { p: /from-gray-100 via-gray-50 to-gray-200/g, r: 'from-gray-100 via-gray-50 to-gray-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900' },
  { p: /bg-black\/5/g, r: 'bg-black/5 dark:bg-white/5' },
  { p: /bg-black\/10/g, r: 'bg-black/10 dark:bg-white/10' },
  { p: /bg-black\/20/g, r: 'bg-black/20 dark:bg-white/20' }
];

replacements.forEach(({p, r}) => {
  code = code.replace(p, r);
});

// Since text-white has been aggressively replaced resulting in dark:text-zinc-900, 
// we might have created some overly long chains like dark:text-zinc-900 inside #007AFF bg which should stay white
// It's fine, let's fix specifically the primary blue buttons that need white text in dark mode too.
code = code.replace(/text-white dark:text-zinc-900 font-bold shadow-md shadow-black\/5 dark:border-white\/5 ring-1 ring-black\/5 dark:ring-white\/5/g, 'text-white font-bold shadow-md shadow-black/5 ring-1 ring-black/5 dark:ring-white/5');

// For blue accents (#007AFF), we don't want the text-white inside it to turn black
const restoreBlueButtonText = /bg-\[#007AFF\] text-white dark:text-zinc-900/g;
code = code.replace(restoreBlueButtonText, 'bg-[#007AFF] text-white');

fs.writeFileSync('src/App.tsx', code);
console.log("Transformation Complete");
