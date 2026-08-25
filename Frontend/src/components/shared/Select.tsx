import React, { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  name: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

// Custom-styled dropdown to replace native <select>, whose popup listbox
// is OS-rendered and can't be restyled with CSS (stuck on browser-default
// blue highlight instead of the app's orange theme).
export default function Select({
  id,
  name,
  value,
  options,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  onChange,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emitChange = (val: string) => {
    onChange({ target: { name, value: val } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleSelect = (val: string) => {
    emitChange(val);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) handleSelect(options[highlightedIndex].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-left flex items-center justify-between ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : error
              ? 'border-red-300 ring-red-500'
              : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <FiChevronDown
          className={`text-gray-500 w-5 h-5 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full max-h-64 overflow-auto bg-white border border-gray-100 rounded-xl shadow-lg py-1"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(option.value)}
              className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between ${
                index === highlightedIndex ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
              } ${option.value === value ? 'font-medium' : ''}`}
            >
              {option.label}
              {option.value === value && <FiCheck className="w-4 h-4 text-orange-600 flex-shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
