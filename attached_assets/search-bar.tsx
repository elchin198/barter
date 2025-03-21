import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchBarProps {
  initialQuery: string;
  initialCategory: string;
  onSearch: (query: string, category: string) => void;
  categories: Array<{
    name: string;
    displayName: string;
  }>;
}

export default function SearchBar({
  initialQuery = "",
  initialCategory = "",
  onSearch,
  categories = []
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);

  // Update state when props change (for example when navigating back)
  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, category);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(query, category);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-grow">
          <div className="relative">
            <Input
              type="text"
              placeholder="Axtarış..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={category || "all"} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Bütün kateqoriyalar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Bütün kateqoriyalar</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" className="bg-secondary hover:bg-orange-600 text-white">
            Axtar
          </Button>
        </div>
      </div>
    </form>
  );
}
