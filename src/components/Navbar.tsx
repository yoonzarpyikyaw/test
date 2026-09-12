import React, { useState } from 'react';
import { Search, SlidersHorizontal, Send, Menu, X, Globe, Film, Tv } from 'lucide-react';
import type { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettingsModal: () => void;
  dataSourceLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenSettingsModal,
  dataSourceLabel,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: TabType; label: string }[] = [
    { id: 'HOME', label: 'HOME' },
    { id: 'TV - SERIES', label: 'TV - SERIES' },
    { id: 'MOVIES', label: 'MOVIES' },
    { id: 'COUNTRY', label: 'COUNTRY' },
    { id: 'A - Z LIST', label: 'A - Z LIST' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200/90 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onTabChange('HOME')}
            className="text-left flex flex-col justify-center cursor-pointer group"
          >
            <span className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-none group-hover:text-green-700 transition-colors">
              Family Version
            </span>
            <span className="text-[11px] text-gray-400 font-normal tracking-tight mt-1">
              Watch Your Favorite Movies Online!
            </span>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id || (link.id === 'HOME' && activeTab === 'All');
            return (
              <button
                key={link.id}
                onClick={() => {
                  onTabChange(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-xs sm:text-[13px] font-bold tracking-wider py-2 relative transition-all cursor-pointer ${
                  isActive
                    ? 'text-green-600 font-extrabold'
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Area: Search Box & Settings */}
        <div className="flex items-center gap-2.5">
          {/* Search Bar matching screenshot */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for Movies & TV Shows"
              className="w-48 sm:w-64 lg:w-72 pl-3.5 pr-8 py-1.5 text-xs bg-white text-gray-800 placeholder-gray-400 border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-green-600 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Database / Supabase Admin Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            title="Database Connection & Sync Settings"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {dataSourceLabel && (
              <span className="hidden xl:inline text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded">
                {dataSourceLabel}
              </span>
            )}
          </button>

          {/* Telegram Channel Link */}
          <a
            href="https://t.me/addlist/58gZNGQ86uJiOWE9"
            target="_blank"
            rel="noopener noreferrer"
            title="Join Telegram Channel"
            className="hidden sm:flex items-center gap-1.5 bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Telegram</span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-gray-600 hover:bg-gray-100 border border-gray-200"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id || (link.id === 'HOME' && activeTab === 'All');
            return (
              <button
                key={link.id}
                onClick={() => {
                  onTabChange(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold ${
                  isActive ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <a
              href="https://t.me/addlist/58gZNGQ86uJiOWE9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-red-600"
            >
              <Send className="w-4 h-4" />
              Watch on Telegram
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
