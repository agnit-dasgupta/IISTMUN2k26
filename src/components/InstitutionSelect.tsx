import React, { useState, useRef, useEffect } from "react";
import { GraduationCap, Search, Check, ChevronDown, Plus, Edit2, Building2 } from "lucide-react";
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
  accentColor = "blue",
  id = "institution-select"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine accent color classes
  const focusBorderColor = accentColor === "cyan" ? "focus:border-cyan-500/50" : "focus:border-blue-500/50";
  const activeBg = accentColor === "cyan" ? "bg-cyan-500/10 text-cyan-400" : "bg-blue-500/10 text-blue-400";
  const activeBorder = accentColor === "cyan" ? "border-cyan-500/30" : "border-blue-500/30";
  const badgeColor = accentColor === "cyan" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
  const iconColor = accentColor === "cyan" ? "text-cyan-400" : "text-blue-400";

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
              className={`w-full rounded-2xl border ${error ? "border-rose-500/50" : "border-slate-800"} bg-slate-950 pl-11 pr-24 py-3 text-xs text-white placeholder-slate-600 outline-none ${focusBorderColor} transition-all font-medium`}
            />
            <button
              type="button"
              onClick={switchToDropdown}
              className="absolute right-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer flex items-center gap-1"
              title="Select from list"
            >
              <GraduationCap className="h-3 w-3" />
              List
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Manual Entry Mode</span>
            <button
              type="button"
              onClick={switchToDropdown}
              className="text-slate-400 hover:text-white underline cursor-pointer"
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
              error ? "border-rose-500/50" : isOpen ? (accentColor === "cyan" ? "border-cyan-500" : "border-blue-500") : "border-slate-800"
            } bg-slate-950 px-4 py-3 text-xs text-white outline-none transition-all flex items-center justify-between gap-2 cursor-pointer hover:border-slate-700`}
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              <GraduationCap className={`h-4 w-4 shrink-0 ${value ? iconColor : "text-slate-500"}`} />
              {value ? (
                <span className="font-medium text-slate-100 truncate">{value}</span>
              ) : (
                <span className="text-slate-600 truncate">{placeholder}</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Popup Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 rounded-3xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-[380px] flex flex-col">
              {/* Search Header */}
              <div className="relative mb-2 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search college or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 font-sans text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-all"
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
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Plus className={`h-3.5 w-3.5 ${iconColor}`} />
                    <span className="font-sans text-xs text-slate-300 group-hover:text-white font-semibold">
                      {searchTerm ? `Use "${searchTerm}" (Custom Name)` : "Other Institution (Type manually)"}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    Custom
                  </span>
                </button>
              </div>

              {/* Categorized List Options */}
              <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1 text-left">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold px-2 pt-1 sticky top-0 bg-slate-950/90 backdrop-blur-sm py-1 border-b border-slate-900">
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
                                  ? `${activeBg} border ${activeBorder} font-bold`
                                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
                              }`}
                            >
                              <span className="truncate pr-2">{item}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
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
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white border border-slate-800 cursor-pointer transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Type "{searchTerm}" as Institution
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-rose-400 mt-1 font-mono font-bold text-left">{error}</p>}
    </div>
  );
};
