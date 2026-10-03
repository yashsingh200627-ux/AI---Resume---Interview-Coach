import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ToastContainer } from '../components/ToastContainer';
import { CareerChatModal } from '../components/CareerChatModal';
import { LiveDemoModal } from '../components/LiveDemoModal';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#181117] text-slate-900 dark:text-[#FFF5F7] flex flex-col font-sans transition-colors duration-200 relative selection:bg-pink-500 dark:selection:bg-pink-500 selection:text-white">
      {/* Ambient background glows tailored for both light and dark themes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent dark:from-pink-500/25 dark:via-rose-300/15 dark:to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/4 -right-40 w-[600px] h-[500px] bg-transparent dark:bg-gradient-to-br dark:from-rose-400/15 dark:via-pink-200/10 dark:to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-2/3 -left-40 w-[600px] h-[500px] bg-transparent dark:bg-gradient-to-tr dark:from-pink-500/15 dark:via-rose-200/10 dark:to-transparent blur-3xl rounded-full pointer-events-none" />
      </div>

      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} showSidebarToggle={true} />
      
      <div className="flex-1 flex relative z-10">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 lg:pl-64 min-w-0 flex flex-col transition-all duration-300">
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
      <CareerChatModal />
      <LiveDemoModal />
    </div>
  );
};
