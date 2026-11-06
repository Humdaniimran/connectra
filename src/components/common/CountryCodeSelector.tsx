import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Country, COUNTRIES, PRIORITY_COUNTRY_CODES } from '../../data/countries.ts';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface CountryCodeSelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  disabled?: boolean;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  selectedCountry,
  onSelectCountry,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered countries based on query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchDial = c.dialCode.replace(/\+/g, '').includes(q.replace(/\+/g, ''));
      const matchCode = c.code.toLowerCase().includes(q);
      return matchName || matchDial || matchCode;
    });
  }, [searchQuery]);

  // Priority countries (when no search query is active)
  const priorityCountries = useMemo(() => {
    return PRIORITY_COUNTRY_CODES.map((code) =>
      COUNTRIES.find((c) => c.code === code)
    ).filter(Boolean) as Country[];
  }, []);

  const handleSelect = (country: Country) => {
    onSelectCountry(country);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Select country code. Current: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white transition-all hover:border-cyan-500/60 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'
        }`}
      >
        <span className="text-xl leading-none" role="img" aria-label={selectedCountry.name}>
          {selectedCountry.flag}
        </span>
        <span className="font-mono text-xs font-semibold text-cyan-300">
          {selectedCountry.dialCode}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu / Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900/98 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/20 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-80 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header & Search */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Country
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code (+92)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8.5 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* List of Countries */}
          <div
            role="listbox"
            className="max-h-64 overflow-y-auto overscroll-contain pr-1 divide-y divide-slate-800/40 text-xs scrollbar-thin scrollbar-thumb-slate-700"
          >
            {/* Show Featured Priority Section when no active search query */}
            {!searchQuery && (
              <div className="pb-1.5 mb-1.5">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  Popular & Requested
                </div>
                {priorityCountries.map((c) => {
                  const isSelected = selectedCountry.code === c.code;
                  return (
                    <button
                      key={`priority-${c.code}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(c)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-lg leading-none" role="img" aria-label={c.name}>
                          {c.flag}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] font-medium text-slate-400">
                          {c.dialCode}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                      </div>
                    </button>
                  );
                })}
                <div className="my-1.5 border-t border-slate-800" />
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  All Countries (A–Z)
                </div>
              </div>
            )}

            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No matching country found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedCountry.code === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg leading-none" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] font-medium text-slate-400">
                        {c.dialCode}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
