import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// Simple debounce implementation
function debounce<Func extends (...args: any[]) => any>(func: Func, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<Func>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


const SearchBar: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Debounce updating the URL query param
  const updateQuery = debounce((value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    updateQuery(e.target.value);
  };

  // Initialize from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('search') || '';
    setQuery(initial);
  }, []);

  return (
    <div className="relative hidden md:flex items-center">
      <Search className="absolute left-2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search jobs..."
        value={query}
        onChange={handleChange}
        className="pl-8 pr-3 py-1.5 rounded-xl bg-surface border border-surfaceBorder text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
      />
    </div>
  );
};

export default SearchBar;
