const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Limpiar duplicados y desastres de scripts anteriores
code = code.replace(/dark:bg-\[\#1C1C1E\] dark:bg-white/g, 'dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5');
code = code.replace(/bg-\[\#f5f5f7\] dark:bg-black/g, 'bg-zinc-50 dark:bg-zinc-950');
code = code.replace(/bg-gray-50 dark:bg-\[\#2C2C2E\]/g, 'bg-zinc-100 dark:bg-zinc-800/50');
code = code.replace(/bg-gray-100 dark:bg-\[\#3A3A3C\]/g, 'bg-zinc-200 dark:bg-zinc-800');
code = code.replace(/dark:text-white dark:text-zinc-900/g, 'dark:text-white');
code = code.replace(/text-zinc-900 dark:text-white/g, 'text-zinc-900 dark:text-zinc-50');
code = code.replace(/text-zinc-800 dark:text-zinc-200/g, 'text-zinc-800 dark:text-zinc-200');
code = code.replace(/bg-black text-white dark:bg-white dark:text-black/g, 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900');
code = code.replace(/bg-\[\#1C1C1E\] dark:bg-\[\#2C2C2E\]/g, 'bg-zinc-900 dark:bg-zinc-800');
code = code.replace(/bg-white dark:bg-\[\#1C1C1E\]/g, 'bg-white dark:bg-zinc-900/40');

// Corregir botones que se ven mal (los "presets")
code = code.replace(/bg-gray-50 dark:bg-\[\#2C2C2E\]/g, 'bg-zinc-100 dark:bg-zinc-800/80');

// Eliminar bordes duplicados y sombras extrañas
code = code.replace(/border border-black\/5 dark:border-white\/10/g, 'border border-black/5 dark:border-white/5');
code = code.replace(/shadow-xl shadow-black\/5 shadow-sm shadow-black\/5 dark:shadow-none/g, 'shadow-xl shadow-black/5 dark:shadow-none');

fs.writeFileSync('src/App.tsx', code);
console.log("Cleanup and Enhancement Complete");
