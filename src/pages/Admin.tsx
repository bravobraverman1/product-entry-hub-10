import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/FormSection";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Loader2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCategories, updateCategories } from "@/lib/api";
import { CategoryLevel, isLeaf, getAllLeafPaths } from "@/data/categoryData";
import { config } from "@/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Helpers ─────────────────────────────────────────────────

function treeToPaths(tree: CategoryLevel[], prefix: string[] = []): string[] {
  const paths: string[] = [];
  for (const node of tree) {
    const current = [...prefix, node.name];
    if (isLeaf(node)) {
      paths.push(current.join("/"));
    } else if (node.children) {
      paths.push(...treeToPaths(node.children, current));
    }
  }
  return paths;
}

function pathsToTree(paths: string[]): CategoryLevel[] {
  const root: CategoryLevel[] = [];

  for (const path of paths) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      let found = current.find((n) => n.name === name);
      if (!found) {
        found = { name, children: i < parts.length - 1 ? [] : undefined };
        current.push(found);
      }
      if (i < parts.length - 1) {
        if (!found.children) found.children = [];
        current = found.children;
      }
    }
  }

  return root;
}

// ── Tree Node Editor ────────────────────────────────────────

interface TreeEditorNodeProps {
  node: CategoryLevel;
  path: string[];
  onRename: (path: string[], newName: string) => void;
  onDelete: (path: string[]) => void;
  onAddChild: (path: string[], childName: string) => void;
}

function TreeEditorNode({
  node,
  path,
  onRename,
  onDelete,
  onAddChild,
}: TreeEditorNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const [adding, setAdding] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentPath = [...path, node.name];
  const leaf = isLeaf(node);

  const handleRename = () => {
    if (editValue.trim() && editValue.trim() !== node.name) {
      onRename(currentPath, editValue.trim());
    }
    setEditing(false);
  };

  const handleAddChild = () => {
    if (newChildName.trim()) {
      onAddChild(currentPath, newChildName.trim());
      setNewChildName("");
      setAdding(false);
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-1 rounded-md hover:bg-muted/40 group transition-colors"
        style={{ paddingLeft: `${path.length * 16 + 4}px` }}
      >
        {!leaf ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-muted-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 text-xs flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button type="button" onClick={handleRename}>
              <Check className="h-3.5 w-3.5 text-success" />
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm flex-1 truncate">{node.name}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditValue(node.name);
                  setEditing(true);
                }}
                title="Rename"
              >
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setAdding(true)}
                title="Add child"
              >
                <FolderPlus className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{node.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {!leaf
                ? "This will delete the category and all its children. This cannot be undone."
                : "This category will be removed. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(currentPath);
                setDeleteOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add child inline */}
      {adding && (
        <div
          className="flex items-center gap-1 py-1"
          style={{ paddingLeft: `${(path.length + 1) * 16 + 8}px` }}
        >
          <Input
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="New category name…"
            className="h-6 text-xs flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddChild();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <button type="button" onClick={handleAddChild}>
            <Check className="h-3.5 w-3.5 text-success" />
          </button>
          <button type="button" onClick={() => setAdding(false)}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Children */}
      {!leaf && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeEditorNode
              key={child.name}
              node={child}
              path={currentPath}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Page ──────────────────────────────────────────────

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loadedTree = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  const [tree, setTree] = useState<CategoryLevel[]>([]);
  const [dirty, setDirty] = useState(false);
  const [addingRoot, setAddingRoot] = useState(false);
  const [newRootName, setNewRootName] = useState("");
  const [filtersTabName, setFiltersTabName] = useState<string>(config.FILTERS_TAB_NAME);

  // Sync loaded tree into local state
  useEffect(() => {
    if (loadedTree.length > 0 && !dirty) {
      setTree(loadedTree);
    }
  }, [loadedTree, dirty]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const paths = treeToPaths(tree);
      return updateCategories(paths);
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Categories updated successfully." });
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["sheet-data"] });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Could not save categories.",
      });
    },
  });

  // ── Tree operations ──
  const modifyTree = (fn: (draft: CategoryLevel[]) => CategoryLevel[]) => {
    setTree((prev) => fn(JSON.parse(JSON.stringify(prev))));
    setDirty(true);
  };

  const findParentAndIndex = (
    nodes: CategoryLevel[],
    path: string[]
  ): { parent: CategoryLevel[] | null; index: number } => {
    if (path.length === 1) {
      const idx = nodes.findIndex((n) => n.name === path[0]);
      return { parent: nodes, index: idx };
    }
    const parentNode = nodes.find((n) => n.name === path[0]);
    if (!parentNode?.children) return { parent: null, index: -1 };
    return findParentAndIndex(parentNode.children, path.slice(1));
  };

  const handleRename = useCallback(
    (path: string[], newName: string) => {
      modifyTree((draft) => {
        const { parent, index } = findParentAndIndex(draft, path);
        if (parent && index >= 0) {
          parent[index] = { ...parent[index], name: newName };
        }
        return draft;
      });
    },
    []
  );

  const handleDelete = useCallback(
    (path: string[]) => {
      modifyTree((draft) => {
        const { parent, index } = findParentAndIndex(draft, path);
        if (parent && index >= 0) {
          parent.splice(index, 1);
        }
        return draft;
      });
    },
    []
  );

  const handleAddChild = useCallback(
    (parentPath: string[], childName: string) => {
      modifyTree((draft) => {
        const findNode = (
          nodes: CategoryLevel[],
          path: string[]
        ): CategoryLevel | null => {
          if (path.length === 0) return null;
          const node = nodes.find((n) => n.name === path[0]);
          if (!node) return null;
          if (path.length === 1) return node;
          return findNode(node.children || [], path.slice(1));
        };

        const target = findNode(draft, parentPath);
        if (target) {
          if (!target.children) target.children = [];
          target.children.push({ name: childName });
        }
        return draft;
      });
    },
    []
  );

  const handleAddRoot = () => {
    if (newRootName.trim()) {
      modifyTree((draft) => {
        draft.push({ name: newRootName.trim(), children: [] });
        return draft;
      });
      setNewRootName("");
      setAddingRoot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Editor */}
      <FormSection title="Categories Editor" defaultOpen>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-2 max-h-[500px] overflow-y-auto">
            {tree.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories loaded.
              </p>
            ) : (
              tree.map((node) => (
                <TreeEditorNode
                  key={node.name}
                  node={node}
                  path={[]}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
              ))
            )}
          </div>

          {/* Add root category */}
          {addingRoot ? (
            <div className="flex items-center gap-2">
              <Input
                value={newRootName}
                onChange={(e) => setNewRootName(e.target.value)}
                placeholder="New root category…"
                className="h-8 text-sm flex-1 max-w-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddRoot();
                  if (e.key === "Escape") setAddingRoot(false);
                }}
              />
              <Button type="button" size="sm" className="h-8" onClick={handleAddRoot}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setAddingRoot(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAddingRoot(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Root Category
            </Button>
          )}

          {/* Save */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              disabled={!dirty || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="h-9"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save Changes
            </Button>
            {dirty && (
              <p className="text-xs text-warning">Unsaved changes</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Filters Tab Name */}
      <FormSection title="Settings" defaultOpen={false}>
        <div className="space-y-3">
          <div className="space-y-1.5 max-w-sm">
            <Label className="text-xs font-medium">Filters Tab Name</Label>
            <Input
              value={filtersTabName}
              onChange={(e) => setFiltersTabName(e.target.value)}
              placeholder="FILTER"
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Name of the sheet tab that contains filter rules. Future wiring only.
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default Admin;
