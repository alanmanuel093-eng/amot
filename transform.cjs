const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Colors & Backgrounds mapping
const reps = [
  { from: /bg-\[\#020617\]/g, to: 'bg-[#f5f5f7]' },
  { from: /bg-slate-950/g, to: 'bg-[#f5f5f7]' },
  // Card backgrounds
  { from: /bg-slate-900(\/\d+)?/g, to: 'bg-white' },
  { from: /bg-slate-800\/50/g, to: 'bg-gray-100' },
  { from: /bg-slate-800\/30/g, to: 'bg-gray-50' },
  { from: /bg-slate-800/g, to: 'bg-gray-100' },
  { from: /bg-black\/40/g, to: 'bg-gray-50/50' },
  { from: /bg-black\/30/g, to: 'bg-gray-50' },
  { from: /bg-black\/60/g, to: 'bg-gray-100' },

  // Borders
  { from: /border-slate-800(\/\d+)?/g, to: 'border-black/5' },
  { from: /border-slate-700(\/\d+)?/g, to: 'border-black/5' },
  
  // Text colors
  { from: /text-white/g, to: 'text-zinc-900' },
  { from: /text-slate-200/g, to: 'text-zinc-800' },
  { from: /text-slate-300/g, to: 'text-zinc-600' },
  { from: /text-slate-400/g, to: 'text-zinc-500' },
  { from: /text-slate-500/g, to: 'text-zinc-500' },
  { from: /text-slate-600/g, to: 'text-zinc-400' },
  { from: /text-slate-800/g, to: 'text-zinc-300' },

  // Primary Apple Blue Accents
  { from: /text-indigo-400/g, to: 'text-[#007AFF]' },
  { from: /text-indigo-500/g, to: 'text-[#007AFF]' },
  { from: /text-indigo-300/g, to: 'text-[#007AFF]/80' },
  { from: /text-indigo-100\/80/g, to: 'text-zinc-700' },
  { from: /bg-indigo-600(\/\d+)?/g, to: 'bg-[#007AFF]' },
  { from: /bg-indigo-500\/10/g, to: 'bg-[#007AFF]/5' },
  { from: /bg-indigo-500\/5/g, to: 'bg-[#007AFF]/5' },
  { from: /bg-indigo-500(\/[1-9]0)?/g, to: 'bg-[#007AFF]/10' },
  { from: /border-indigo-500(\/\d+)?/g, to: 'border-[#007AFF]/20' },
  { from: /hover:bg-indigo-500/g, to: 'hover:bg-[#007AFF]/90' },
  { from: /hover:text-indigo-300/g, to: 'hover:text-[#007AFF]' },
  { from: /ring-indigo-500/g, to: 'ring-[#007AFF]' },
  
  // Shadows
  { from: /shadow-indigo-500\/20/g, to: 'shadow-sm shadow-black/5' },
  { from: /shadow-\[0_8px_20px_-5px_rgba\(79,70,229,0\.4\)\]/g, to: 'shadow-md shadow-black/5 ring-1 ring-black/5' },
  { from: /shadow-xl/g, to: 'shadow-xl shadow-black/5' },
  { from: /shadow-2xl/g, to: 'shadow-2xl shadow-black-[.02] border border-black/5' },
  { from: /shadow-inner/g, to: 'shadow-none' },

  // Rounded
  { from: /rounded-3xl/g, to: 'rounded-2xl' },
  { from: /rounded-2xl/g, to: 'rounded-[20px]' }, // Apple highly uses squirrel circles, 20px is close for cards
  
  // Fix button text colors and icons
  { from: /fill="white"/g, to: 'fill="currentColor"' },
];

reps.forEach(r => {
  code = code.replace(r.from, r.to);
});

// Since we replaced text-white strictly, we might have buttons that needed text-white
// Apple style buttons: solid background, white text. E.g., `bg-[#007AFF] text-zinc-900` is bad.
// Let's fix specific high-contrast areas
code = code.replace(/bg-\[\#007AFF\] text-zinc-900/g, 'bg-[#007AFF] text-white');
// Check for switch states where white text was inverted
code = code.replace(/bg-white text-zinc-900/g, 'bg-zinc-900 text-white'); 
// Login button fix
code = code.replace(/bg-zinc-900 text-white font-bold rounded-\[20px\] h-12 gap-2 hover:bg-zinc-800/g, 'bg-white text-zinc-900 border border-zinc-200 font-bold rounded-[20px] h-12 gap-2 hover:bg-gray-50');

// specifically fix inputs that might still be dark text on white with bad contrast
code = code.replace(/text-xs text-zinc-900/g, 'text-xs text-zinc-800');

fs.writeFileSync('src/App.tsx', code);
console.log('Transformation complete!');
