const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove the component declarations from within the App render cycle to arrest re-render mutation bugs
const navComponentsRegex = /const SidebarItem = \(\{.*?\}\) => \([\s\S]*?const NavItems = \(\) => \([\s\S]*?<\/>\n  \);/m;
code = code.replace(navComponentsRegex, `const navLinks = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "inbox", label: t.inbox, icon: MessageSquare },
    { id: "config", label: t.config, icon: BrainCircuit },
    { id: "connections", label: t.connections, icon: Link },
    { id: "analytics", label: t.analytics, icon: BarChart3 }
  ];`);

// 2. Replace the NavItems desktop sidebar usage with inline JSX iteration
const desktopNavRegex = /<NavItems \/>/;
code = code.replace(desktopNavRegex, `{navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={\`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all duration-300 relative group \${
                  activeTab === link.id ? 'bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-50 font-bold' : 'hover:bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-zinc-800 dark:text-zinc-200'
                }\`}
              >
                <Icon size={18} className={activeTab === link.id ? 'text-[#007AFF] animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                <span className="hidden md:block text-sm">{link.label}</span>
                {activeTab === link.id && (
                  <motion.div layoutId="desktopActivePill" className="absolute left-1 w-1 h-6 bg-[#007AFF] rounded-full" />
                )}
              </button>
            )
          })}`);

// 3. Replace the Settings isolated SidebarItem usage with pure DOM mapping element
const settingsNavRegex = /<SidebarItem id="settings" label=\{t.settings\} icon=\{Settings\} \/>/;
code = code.replace(settingsNavRegex, `<button 
             onClick={() => setActiveTab('settings')}
             className={\`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all duration-300 relative group \${
               activeTab === 'settings' ? 'bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-50 font-bold' : 'hover:bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-zinc-800 dark:text-zinc-200'
             }\`}
           >
              <Settings size={18} className={activeTab === 'settings' ? 'text-[#007AFF] animate-pulse' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden md:block text-sm">{t.settings}</span>
              {activeTab === 'settings' && (
                 <motion.div layoutId="desktopActivePill" className="absolute left-1 w-1 h-6 bg-[#007AFF] rounded-full" />
              )}
           </button>`);

// 4. Update the bottom Mobile Navigation
const mobileNavRegex = /<MobileNavItem id="dashboard"[\s\S]*?<MobileNavItem id="connections" icon=\{Link\} activeTab=\{activeTab\} setActiveTab=\{setActiveTab\} \/>/;
code = code.replace(mobileNavRegex, `{navLinks.slice(0, 4).map((link) => {
             const Icon = link.icon;
             return (
               <button
                 key={link.id}
                 onClick={() => setActiveTab(link.id)}
                 className={\`relative p-3 rounded-[20px] transition-all \${
                   activeTab === link.id ? 'text-[#007AFF]' : 'text-zinc-500 dark:text-[#EBEBF5]/60'
                 }\`}
               >
                 <Icon size={24} />
                 {activeTab === link.id && (
                   <motion.div layoutId="mobileActivePill" className="absolute inset-0 bg-[#007AFF]/10 rounded-[20px] -z-10" />
                 )}
               </button>
             );
          })}`);

fs.writeFileSync('src/App.tsx', code);
console.log("Navigation Layout Issue Fixed!");
