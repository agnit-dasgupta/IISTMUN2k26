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
  const iconColor = "text-[#C9A86A]";
  const activeBg = "bg-[#C9A86A]/15 text-[#C9A86A] border-[#C9A86A]/40";

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
              className={`w-full rounded-none border ${
                error ? "border-rose-500/50" : "border-[#8A9A7E]/30 focus:border-[#C9A86A]"
              } bg-[#1A1F1A] pl-11 pr-24 py-3 text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/60 outline-none transition-all font-medium`}
            />
            <button
              type="button"
              onClick={switchToDropdown}
              className="absolute right-2 px-3 py-1.5 bg-[#2E3B2F] hover:bg-[#3d4d3e] text-[10px] font-sans font-medium uppercase tracking-wider text-[#C9A86A] border border-[#C9A86A]/30 transition-all cursor-pointer flex items-center gap-1.5"
              title="Select from list"
            >
              <GraduationCap className="h-3 w-3 text-[#C9A86A]" />
              List
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-sans text-[#8A9A7E] px-1">
            <span>Manual Entry Mode</span>
            <button
              type="button"
              onClick={switchToDropdown}
              className="text-[#C9A86A] hover:underline cursor-pointer"
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
            className={`w-full text-left rounded-none border ${
              error
                ? "border-rose-500/50"
                : isOpen
                ? "border-[#C9A86A]"
                : "border-[#8A9A7E]/30 hover:border-[#C9A86A]/50"
            } bg-[#1A1F1A] px-4 py-3 text-xs text-[#EDE6D3] outline-none transition-all flex items-center justify-between gap-2 cursor-pointer`}
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              <GraduationCap className={`h-4 w-4 shrink-0 ${value ? "text-[#C9A86A]" : "text-[#8A9A7E]"}`} />
              {value ? (
                <span className="font-medium text-[#EDE6D3] truncate">{value}</span>
              ) : (
                <span className="text-[#8A9A7E]/70 truncate">{placeholder}</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#8A9A7E] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#C9A86A]" : ""}`} />
          </button>

          {/* Popup Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 border border-[#C9A86A]/30 bg-[#1A1F1A] p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 max-h-[380px] flex flex-col">
              {/* Search Header */}
              <div className="relative mb-2.5 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A9A7E]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search college or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#2E3B2F]/60 border border-[#8A9A7E]/30 pl-9 pr-8 py-2 font-sans text-xs text-[#EDE6D3] placeholder-[#8A9A7E]/60 focus:outline-none focus:border-[#C9A86A] transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A9A7E] hover:text-[#EDE6D3] text-xs font-mono"
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
                  className="w-full flex items-center justify-between p-2.5 border border-dashed border-[#C9A86A]/40 hover:border-[#C9A86A] bg-[#2E3B2F]/40 hover:bg-[#2E3B2F] text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5 text-[#C9A86A]" />
                    <span className="font-sans text-xs text-[#EDE6D3] font-semibold">
                      {searchTerm ? `Use "${searchTerm}" (Custom Name)` : "Other Institution (Type manually)"}
                    </span>
                  </div>
                  <span className="font-sans text-[9px] uppercase tracking-wider text-[#C9A86A] bg-[#C9A86A]/10 px-2 py-0.5 border border-[#C9A86A]/30">
                    Custom
                  </span>
                </button>
              </div>

              {/* Categorized List Options */}
              <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1 text-left">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#C9A86A] font-semibold px-2 pt-1 sticky top-0 bg-[#1A1F1A] py-1 border-b border-[#8A9A7E]/20">
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
                              className={`w-full text-left px-3 py-2 text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? `${activeBg} border font-semibold`
                                  : "text-[#EDE6D3]/80 hover:bg-[#2E3B2F] hover:text-[#EDE6D3]"
                              }`}
                            >
                              <span className="truncate pr-2">{item}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#C9A86A]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="font-sans text-xs text-[#8A9A7E]">No matching institutions found for "{searchTerm}".</p>
                    <button
                      type="button"
                      onClick={() => handleSelectOption("OTHER")}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E3B2F] hover:bg-[#3d4d3e] text-xs font-semibold text-[#EDE6D3] border border-[#C9A86A]/40 cursor-pointer transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[#C9A86A]" />
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
