import React, { useState, useRef, useEffect } from "react";
import { GraduationCap, Search, Check, ChevronDown, Plus, Edit2, Building2, Sparkles } from "lucide-react";
import { INDIAN_INSTITUTIONS, ALL_INSTITUTIONS_FLAT } from "../data/institutions";

interface InstitutionSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  accentColor?: "blue" | "cyan";
  id?: string;
}

export const InstitutionSelect: React.FC<InstitutionSelectProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select School / College / University",
  accentColor = "cyan",
  id = "institution-select"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Styling helpers
  const iconColor = "text-cyan-400";
  const activeBg = "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";

  // Check if current value is custom (not in predefined list and non-empty)
  useEffect(() => {
    if (value && !ALL_INSTITUTIONS_FLAT.includes(value)) {
      setIsCustomMode(true);
      setCustomInputValue(value);
    }
  }, [value]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectOption = (selected: string) => {
    if (selected === "OTHER") {
      setIsCustomMode(true);
      setIsOpen(false);
      if (!customInputValue && searchTerm) {
        setCustomInputValue(searchTerm);
        onChange(searchTerm);
      } else {
        onChange(customInputValue || "");
      }
    } else {
      setIsCustomMode(false);
      onChange(selected);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInputValue(val);
    onChange(val);
  };

  const switchToDropdown = () => {
    setIsCustomMode(false);
    setIsOpen(true);
  };

  // Filter categories and items based on search term
  const filteredCategories = INDIAN_INSTITUTIONS.map((cat) => {
    const matchingItems = cat.items.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      category: cat.category,
      items: matchingItems
    };
  }).filter((cat) => cat.items.length > 0);

  return (
    <div className="relative w-full" ref={dropdownRef} id={id}>
      {isCustomMode ? (
        /* Custom Text Input Mode */
        <div className="space-y-2">
          <div className="relative flex items-center">
            <Building2 className={`absolute left-4 h-4 w-4 ${iconColor}`} />
            <input
              type="text"
              value={customInputValue}
              onChange={handleCustomInputChange}
              placeholder="Enter your School / College / University name"
              className={`w-full rounded-2xl border ${
                error ? "border-rose-500/50" : "border-white/[0.08]"
              } bg-[#04060a]/90 pl-11 pr-24 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium`}
            />
            <button
              type="button"
              onClick={switchToDropdown}
              className="absolute right-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer flex items-center gap-1.5"
              title="Select from list"
            >
              <GraduationCap className="h-3 w-3 text-cyan-400" />
              List
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Manual Entry Mode</span>
            <button
              type="button"
              onClick={switchToDropdown}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Select from dropdown list
            </button>
          </div>
        </div>
      ) : (
        /* Dropdown Trigger Selector */
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full text-left rounded-2xl border ${
              error
                ? "border-rose-500/50"
                : isOpen
                ? "border-cyan-500 ring-2 ring-cyan-500/20"
                : "border-white/[0.08] hover:border-white/20"
            } bg-[#04060a]/90 px-4 py-3 text-xs text-white outline-none transition-all flex items-center justify-between gap-2 cursor-pointer`}
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              <GraduationCap className={`h-4 w-4 shrink-0 ${value ? "text-cyan-400" : "text-slate-500"}`} />
              {value ? (
                <span className="font-medium text-slate-100 truncate">{value}</span>
              ) : (
                <span className="text-slate-500 truncate">{placeholder}</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
          </button>

          {/* Popup Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 rounded-3xl border border-white/[0.1] bg-[#080d1a]/95 p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[380px] flex flex-col">
              {/* Search Header */}
              <div className="relative mb-2.5 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search college or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#04060a] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 font-sans text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Option to enter custom name directly */}
              <div className="mb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectOption("OTHER")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-sans text-xs text-slate-300 group-hover:text-white font-semibold">
                      {searchTerm ? `Use "${searchTerm}" (Custom Name)` : "Other Institution (Type manually)"}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Custom
                  </span>
                </button>
              </div>

              {/* Categorized List Options */}
              <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1 text-left">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold px-2 pt-1 sticky top-0 bg-[#080d1a]/95 backdrop-blur-sm py-1 border-b border-white/[0.04]">
                        {cat.category}
                      </div>
                      <div className="space-y-0.5 pt-1">
                        {cat.items.map((item) => {
                          const isSelected = value === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleSelectOption(item)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? `${activeBg} border font-bold`
                                  : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                              }`}
                            >
                              <span className="truncate pr-2">{item}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="font-sans text-xs text-slate-400">No matching institutions found for "{searchTerm}".</p>
                    <button
                      type="button"
                      onClick={() => handleSelectOption("OTHER")}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08] cursor-pointer transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                      Type "{searchTerm}" as Institution
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-rose-400 mt-1.5 font-mono font-bold text-left">{error}</p>}
    </div>
  );
};
