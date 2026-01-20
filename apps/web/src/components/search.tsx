import { useState, useEffect, useRef, useCallback } from "react";
import { Search as SearchIcon, Folder, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { useNavigate, useParams } from "react-router-dom";

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  projectId?: string;
}

interface SearchResponse {
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; projectId?: string }>;
}

export function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>({ projects: [], tasks: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 获取扁平化的结果列表用于键盘导航
  const flatResults = [
    ...results.projects.map((p) => ({ ...p, type: "project" as const })),
    ...results.tasks.map((t) => ({ ...t, type: "task" as const })),
  ];

  // 搜索
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim() || !workspaceId) {
      setResults({ projects: [], tasks: [] });
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<SearchResponse>(
        `/api/search/search?q=${encodeURIComponent(q)}&workspaceId=${workspaceId}`
      );
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults({ projects: [], tasks: [] });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // 防抖搜索
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(q);
    }, 300);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          const item = flatResults[selectedIndex];
          handleSelect(item);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // 选择结果
  const handleSelect = (item: { id: string; type: "project" | "task" }) => {
    if (item.type === "project") {
      navigate(`/workspace/${workspaceId}/projects/${item.id}`);
    } else {
      navigate(`/workspace/${workspaceId}/projects/${item.projectId || ""}?taskId=${item.id}`);
    }
    setIsOpen(false);
    setQuery("");
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-96" ref={containerRef}>
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="搜索项目、任务..."
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-background pl-9 md:w-[300px] lg:w-[400px]"
        />
      </div>

      {/* 下拉结果 */}
      {isOpen && query && (
        <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {/* 项目分组 */}
          {results.projects.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                项目
              </div>
              {results.projects.map((project, index) => {
                const itemIndex = index;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <button
                    key={project.id}
                    onClick={() => handleSelect({ ...project, type: "project" })}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 任务分组 */}
          {results.tasks.length > 0 && (
            <div className="py-1 border-t">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                任务
              </div>
              {results.tasks.map((task, index) => {
                const itemIndex = results.projects.length + index;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelect({ ...task, type: "task" })}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 无结果 */}
          {!loading && query && results.projects.length === 0 && results.tasks.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              未找到相关结果
            </div>
          )}

          {/* 加载中 */}
          {loading && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              搜索中...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
