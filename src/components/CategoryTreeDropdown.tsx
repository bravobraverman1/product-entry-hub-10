import { useState, useMemo, useCallback } from "react";
import { ChevronRight, ChevronDown, Search, Star, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CategoryLevel, isLeaf, filterTree } from "@/data/categoryData";

interface CategoryTreeDropdownProps {
  categories: CategoryLevel[];
  selectedPaths: string[];
  mainPath: string;
  onSelectedChange: (paths: string[]) => void;
  onMainChange: (path: string) => void;
  error?: string;
}

// Recursive tree node
function TreeNode({
  node,
  parentPath,
  selectedPaths,
  onToggle,
  expandedKeys,
  onExpand,
}: {
  node: CategoryLevel;
  parentPath: string[];
  selectedPaths: Set<string>;
  onToggle: (path: string) => void;
  expandedKeys: Set<string>;
  onExpand: (key: string) => void;
}) {
  const currentPath = [...parentPath, node.name];
  const fullPath = currentPath.join("/");
  const leaf = isLeaf(node);
  const expanded = expandedKeys.has(fullPath);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-1 px-1 rounded-md text-sm cursor-pointer hover:bg-muted/60 transition-colors",
          leaf && "pl-6"
        )}
        style={{ paddingLeft: leaf ? undefined : `${parentPath.length * 12 + 4}px` }}
        onClick={() => {
          if (leaf) {
            onToggle(fullPath);
          } else {
            onExpand(fullPath);
          }
        }}
      >
        {!leaf && (
          <span className="text-muted-foreground shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        )}
        {leaf && (
          <Checkbox
            checked={selectedPaths.has(fullPath)}
            className="shrink-0"
            onCheckedChange={() => onToggle(fullPath)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <span className={cn("truncate", !leaf && "font-medium text-foreground/80")}>
          {node.name}
        </span>
      </div>
      {!leaf && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              parentPath={currentPath}
              selectedPaths={selectedPaths}
              onToggle={onToggle}
              expandedKeys={expandedKeys}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTreeDropdown({
  categories,
  selectedPaths,
  mainPath,
  onSelectedChange,
  onMainChange,
  error,
}: CategoryTreeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const selectedSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return categories;
    return filterTree(categories, search.trim());
  }, [categories, search]);

  // Auto-expand all when searching
  const effectiveExpanded = useMemo(() => {
    if (search.trim()) {
      const all = new Set<string>();
      const walk = (nodes: CategoryLevel[], prefix: string[] = []) => {
        for (const n of nodes) {
          const p = [...prefix, n.name].join("/");
          if (!isLeaf(n)) {
            all.add(p);
            if (n.children) walk(n.children, [...prefix, n.name]);
          }
        }
      };
      walk(filteredTree);
      return all;
    }
    return expandedKeys;
  }, [search, filteredTree, expandedKeys]);

  const handleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggle = useCallback(
    (path: string) => {
      const next = selectedPaths.includes(path)
        ? selectedPaths.filter((p) => p !== path)
        : [...selectedPaths, path];
      onSelectedChange(next);
      if (mainPath === path && !next.includes(path)) {
        onMainChange("");
      }
      if (next.length === 1) {
        onMainChange(next[0]);
      }
    },
    [selectedPaths, mainPath, onSelectedChange, onMainChange]
  );

  const handleSetMain = useCallback(
    (path: string) => {
      onMainChange(path);
    },
    [onMainChange]
  );

  const handleRemove = useCallback(
    (path: string) => {
      onSelectedChange(selectedPaths.filter((p) => p !== path));
      if (mainPath === path) onMainChange("");
    },
    [selectedPaths, mainPath, onSelectedChange, onMainChange]
  );

  // Build breadcrumb for main category
  const mainBreadcrumb = useMemo(() => {
    if (!mainPath) return null;
    return mainPath.split("/");
  }, [mainPath]);

  return (
    <div className="space-y-3">
      {/* Popover trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-sm font-normal"
          >
            {selectedPaths.length === 0
              ? "Select categories..."
              : `${selectedPaths.length} categor${selectedPaths.length === 1 ? "y" : "ies"} selected`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-popover"
          align="start"
          sideOffset={4}
        >
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          {/* Tree - scrollable */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredTree.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories found
              </p>
            ) : (
              filteredTree.map((node) => (
                <TreeNode
                  key={node.name}
                  node={node}
                  parentPath={[]}
                  selectedPaths={selectedSet}
                  onToggle={handleToggle}
                  expandedKeys={effectiveExpanded}
                  onExpand={handleExpand}
                />
              ))
            )}
          </div>
          {/* Footer */}
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {selectedPaths.length} selected
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected pills */}
      {selectedPaths.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPaths.map((path) => {
            const isMain = path === mainPath;
            const leafName = path.split("/").pop();
            return (
              <Badge
                key={path}
                variant={isMain ? "default" : "secondary"}
                onClick={() => handleSetMain(path)}
                className={cn(
                  "flex items-center gap-1 text-xs py-0.5 px-2 cursor-pointer",
                  isMain && "bg-primary text-primary-foreground"
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetMain(path);
                  }}
                  title={isMain ? "Main category" : "Set as main"}
                  className="shrink-0"
                >
                  <Star
                    className={cn(
                      "h-3 w-3",
                      isMain
                        ? "fill-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  />
                </button>
                <span className="truncate max-w-[200px]" title={path}>
                  {leafName}
                </span>
                {isMain && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(path);
                  }}
                  className="shrink-0 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Main category breadcrumb */}
      {mainBreadcrumb && mainBreadcrumb.length > 1 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <span className="font-medium">Path:</span>
          {mainBreadcrumb.map((segment, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground/50">→</span>}
              <span className={i === mainBreadcrumb.length - 1 ? "font-medium text-foreground" : ""}>
                {segment}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Preview fields */}
      {selectedPaths.length > 0 && (
        <div className="space-y-1.5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Main</Label>
            <Input
              readOnly
              value={mainPath || "— not set —"}
              className="h-8 text-xs bg-muted/50 font-mono"
            />
          </div>
          {selectedPaths.filter((p) => p !== mainPath).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Others</Label>
              <Input
                readOnly
                value={selectedPaths.filter((p) => p !== mainPath).join("; ")}
                className="h-8 text-xs bg-muted/50 font-mono"
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
