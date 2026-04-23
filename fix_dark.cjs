const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Fixing botched previous regex
const repairs = [
    // 1. Double definitions created by aggressive regex
    { p: /dark:bg-zinc-800\/50 dark:bg-zinc-800\/50/g, r: 'dark:bg-[#1C1C1E]' },
    { p: /dark:border-white dark:border-zinc-800\/5/g, r: 'dark:border-white/10' },
    { p: /dark:text-white dark:text-zinc-900/g, r: 'dark:text-white' },
    { p: /dark:text-zinc-400 dark:text-zinc-500/g, r: 'dark:text-[#EBEBF5]/60' },
    { p: /shadow-sm shadow-black\/5/g, r: 'shadow-sm shadow-black/5 dark:shadow-none' },

    // 2. Specific App Button Breakages caused by 'dark:text-zinc-900' inside #007AFF and similar buttons bg
    { p: /text-white dark:text-zinc-900/g, r: 'text-white' },
    { p: /text-zinc-900 dark:text-white dark:text-zinc-900/g, r: 'text-white' },

    // 3. Perfecting the minimalistic Apple macOS Dark Theme
    { p: /bg-\[#f5f5f7\] dark:bg-zinc-950/g, r: 'bg-[#f5f5f7] dark:bg-black' },
    { p: /bg-white dark:bg-zinc-900/g, r: 'bg-white dark:bg-[#1C1C1E]' },
    { p: /bg-zinc-900 dark:bg-white/g, r: 'bg-[#1C1C1E] dark:bg-[#2C2C2E]' }, // Reversed or mixed contexts
    { p: /bg-gray-50 dark:bg-zinc-800/g, r: 'bg-gray-50 dark:bg-[#2C2C2E]' },
    { p: /bg-gray-100 dark:bg-zinc-800\/80/g, r: 'bg-gray-100 dark:bg-[#3A3A3C]' },
    { p: /border-black\/5 dark:border-white\/5/g, r: 'border-black/5 dark:border-white/10' },

    // 4. Specifically fixing the main login button to look Apple-correct
    { p: /bg-zinc-900 text-white font-bold rounded-2xl h-12 gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200/g, r: 'bg-black text-white dark:bg-white dark:text-black font-bold rounded-2xl h-12 gap-2 hover:opacity-80 transition-opacity' },
    { p: /text-white font-bold rounded-2xl h-12 gap-2 hover:bg-zinc-800 transition-colors shadow-sm/g, r: 'text-white font-bold rounded-2xl h-12 gap-2 hover:opacity-80 transition-opacity shadow-sm bg-black dark:bg-white dark:text-black' }, // Catch all

    // 5. Fixing the blue header button inner text if it broke
    { p: /className="w-4 h-4 text-zinc-900"/g, r: 'className="w-4 h-4 text-zinc-900 dark:text-white"' }
];

repairs.forEach(({p, r}) => {
  code = code.replace(p, r);
});

// Explicit fix for Primary Buttons forcing text-zinc-900 in dark mode even with blue/green backgrounds
code = code.replace(/text-zinc-900 dark:text-white rounded-xl/g, 'text-white rounded-xl'); 
code = code.replace(/text-zinc-900 dark:text-white rounded-\[20px\]/g, 'text-zinc-800 dark:text-white rounded-[20px]'); 
code = code.replace(/text-zinc-900 dark:text-white rounded-2xl/g, 'text-white rounded-2xl');

fs.writeFileSync('src/App.tsx', code);
console.log("Dark Mode Fix Complete");
