import React from 'react';
import { Sun, Moon} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light mode' },
    { value: 'dark' as const, icon: Moon, label: 'Dark mode' },

  ];

  return (
    <div className="relative">
      <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm rounded-xl p-1.5 shadow-lg dark:shadow-gray-900/20 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 group
              focus:outline-none focus:ring-2 focus:ring-offset-2 
                             ${theme === value 
                 ? `bg-gradient-to-br shadow-lg transform scale-105 ring-2 ring-offset-2
                    ${value === 'light' 
                      ? 'from-yellow-200 to-blue-200 !text-white ring-yellow-300/30 ring-offset-white dark:ring-offset-slate-grey-900' 
                      : value === 'dark'
                      ? 'from-blue-600 to-blue-700 !text-white ring-blue-500/20 ring-offset-white dark:ring-offset-gray-900'
                      : 'from-emerald-600 to-teal-600 !text-white ring-emerald-500/20 ring-offset-white dark:ring-offset-slate-grey-900'
                    }` 
                 : `text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 
                    hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md hover:scale-105
                    focus:ring-blue-500/30 focus:ring-offset-white dark:focus:ring-offset-gray-900`
               }
            `}
            aria-label={label}
            title={label}
          >
                         <Icon className={`w-5 h-5 transition-transform duration-300 ${theme === value ? 'animate-pulse' : 'group-hover:rotate-12'} ${theme === value ? (value === 'light' ? 'text-gray-900' : 'text-white') : 'text-gray-700 dark:text-gray-300'}`} />
            
                         {/* Active indicator glow */}
             {theme === value && (
               <>
                 {value === 'dark' ? (
                   <div className="absolute inset-0 rounded-lg bg-blue-100/20 animate-pulse"></div>
                 ) : (
                   <div className="absolute inset-0 rounded-lg bg-gray-100/30 animate-pulse"></div>
                 )}
               </>
             )}
          </button>
        ))}
        
                 {/* Animated background indicator */}
         <div 
           className={`
             absolute w-10 h-10 rounded-lg transition-all duration-500 ease-out pointer-events-none
             bg-gradient-to-br opacity-20 blur-sm
             ${actualTheme === 'light' 
               ? 'from-yellow-300 to-blue-300' 
               : 'from-blue-600 to-blue-700'
             }
           `}
          style={{
            transform: `translateX(${themes.findIndex(t => t.value === theme) * 44}px)`
          }}
        />
      </div>
      
      {/* Screen reader only current theme indicator */}
      <span className="sr-only">
        Current theme: {theme === 'system' ? `System (${actualTheme})` : theme}
      </span>
    </div>
  );
}

export function SimpleThemeToggle() {
  const { actualTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-3 rounded-xl transition-all duration-300 group overflow-hidden
        bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900
        hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-800
        text-white
        shadow-lg hover:shadow-xl dark:shadow-gray-900/30
        border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/50 dark:hover:border-gray-600/50
        focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2
        focus:ring-offset-white dark:focus:ring-offset-gray-900
        transform hover:scale-105 active:scale-95
      "
      aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Background gradient animation */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br
        ${actualTheme === 'light' 
          ? 'from-blue-500/20 to-blue-600/20' 
          : 'from-amber-500/20 to-orange-500/20'
        }
      `} />
      
      {/* Icon with rotation animation */}
      <div className="relative">
        {actualTheme === 'light' ? (
          <Moon className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
        ) : (
          <Sun className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
        )}
      </div>
      
      {/* Subtle glow effect */}
      <div className={`
        absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
        shadow-lg
        ${actualTheme === 'light' 
          ? 'shadow-blue-500/20' 
          : 'shadow-amber-500/20'
        }
      `} />
    </button>
  );
}

// Bonus: Floating theme toggle with glassmorphism effect
export function FloatingThemeToggle() {
  const { actualTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed bottom-6 right-6 p-4 rounded-full transition-all duration-300 group z-50
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
        hover:bg-white/90 dark:hover:bg-gray-900/90
        text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100
        shadow-2xl hover:shadow-3xl dark:shadow-gray-900/50
        border border-white/20 dark:border-gray-700/20
        focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2
        focus:ring-offset-transparent
        transform hover:scale-110 active:scale-95 hover:-translate-y-1
      "
      aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Animated background */}
      <div className={`
        absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500
        bg-gradient-to-br animate-pulse
        ${actualTheme === 'light' 
          ? 'from-blue-600/20 to-blue-700/20' 
          : 'from-amber-600/20 to-orange-600/20'
        }
      `} />
      
      {/* Icon with complex animation */}
      <div className="relative">
        {actualTheme === 'light' ? (
          <Moon className="w-6 h-6 transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-125" />
        ) : (
          <Sun className="w-6 h-6 transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-125" />
        )}
      </div>
      
      {/* Orbital rings effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`
          absolute inset-2 rounded-full border-2 animate-spin
          ${actualTheme === 'light' 
            ? 'border-blue-500/30 border-t-blue-600/60' 
            : 'border-amber-600/30 border-t-amber-700/60'
          }
        `} style={{ animationDuration: '3s' }} />
        <div className={`
          absolute inset-1 rounded-full border animate-spin
          ${actualTheme === 'light' 
            ? 'border-blue-500/20 border-r-blue-600/40' 
            : 'border-orange-600/20 border-r-orange-700/40'
          }
        `} style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
      </div>
    </button>
  );
}