import React from 'react';

interface HelpScreenProps {
  onClose: () => void;
  appConfig: {
    title: string;
    logoUrl: string;
  };
  dataSource: string;
}

const HelpItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 dark:text-white">{title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  </div>
);

export const HelpScreen: React.FC<HelpScreenProps> = ({ onClose, appConfig, dataSource }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent click from bubbling to the backdrop
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={appConfig.logoUrl} alt={`${appConfig.title} Logo`} className="h-8 w-8 object-contain" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{appConfig.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Quick Guide</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xl"
            aria-label="Close guide"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow p-6 overflow-y-auto space-y-8">
          
          <section>
            <h3 className="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">Tree Navigation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
                title="Pan / Move"
                description="Click and drag with your mouse, or use one finger on touch screens to move the family tree around."
              />
              <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10V3m0 7h7" /></svg>}
                title="Zoom"
                description="Use your mouse scroll wheel, the +/- buttons, or pinch with two fingers on touch screens to zoom in and out."
              />
              <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
                title="Single Click / Tap"
                description="Selects a person, focuses the view on them, and highlights their direct ancestors and all descendants."
              />
              <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Double Click / Tap"
                description="Opens a detailed information panel for the selected person, showing their bio, family, and more."
              />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">Header Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                title="Search"
                description="Quickly find any person in the tree by typing their name or alias into the search bar."
              />
               <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0-6V7m0 6h6m-6 0L3 7m6 6l5.447 2.724A1 1 0 0015 16.382V5.618a1 1 0 00-1.447-.894L9 7" /></svg>}
                title="Minimap"
                description="This small preview shows the entire tree. Click or drag within it to quickly navigate to different sections."
              />
              <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                title="Theme Toggle"
                description="Cycles between Light, Dark, and System default appearance settings for your viewing comfort."
              />
               <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v0a8 8 0 018 8v0a8 8 0 01-8 8v0a8 8 0 01-8-8v0z" /></svg>}
                title="Reset View"
                description="Clears any selection and fits the entire family tree back into the main view. Also restarts the animation."
              />
               <HelpItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                title="Export to PDF"
                description="Saves a high-quality image of the current tree view as a downloadable PDF file."
              />
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Data Source: <strong>{dataSource}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};