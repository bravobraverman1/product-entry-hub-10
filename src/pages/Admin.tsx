import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchCategories,
  updateCategories,
  fetchProperties,
  fetchFilterRules,
  saveFilterRules,
  type FilterRule,
} from "@/lib/api";
import { CategoryLevel, isLeaf, getAllLeafPaths } from "@/data/categoryData";
import {
  config,
  DEFAULT_SHEET_TABS,
  getConfigValue,
  setConfigValue,
  getSheetTabName,
  setSheetTabName,
} from "@/config";
import type { LegalValue } from "@/data/defaultProperties";
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
          <button type="button" onClick={() => setExpanded(!expanded)} className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-6 text-xs flex-1" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }} />
            <button type="button" onClick={handleRename}><Check className="h-3.5 w-3.5 text-success" /></button>
            <button type="button" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        ) : (
          <>
            <span className="text-sm flex-1 truncate">{node.name}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button type="button" onClick={() => { setEditValue(node.name); setEditing(true); }} title="Rename">
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
              <button type="button" onClick={() => setAdding(true)} title="Add child">
                <FolderPlus className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
              <button type="button" onClick={() => setDeleteOpen(true)} title="Delete">
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{node.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {!leaf ? "This will delete the category and all its children." : "This category will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(currentPath); setDeleteOpen(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {adding && (
        <div className="flex items-center gap-1 py-1" style={{ paddingLeft: `${(path.length + 1) * 16 + 8}px` }}>
          <Input value={newChildName} onChange={(e) => setNewChildName(e.target.value)} placeholder="New category name…" className="h-6 text-xs flex-1" autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAddChild(); if (e.key === "Escape") setAdding(false); }} />
          <button type="button" onClick={handleAddChild}><Check className="h-3.5 w-3.5 text-success" /></button>
          <button type="button" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      )}

      {!leaf && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeEditorNode key={child.name} node={child} path={currentPath} onRename={onRename} onDelete={onDelete} onAddChild={onAddChild} />
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

  // ── Categories ──
  const { data: loadedTree = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  const [tree, setTree] = useState<CategoryLevel[]>([]);
  const [dirty, setDirty] = useState(false);
  const [addingRoot, setAddingRoot] = useState(false);
  const [newRootName, setNewRootName] = useState("");

  useEffect(() => {
    if (loadedTree.length > 0 && !dirty) setTree(loadedTree);
  }, [loadedTree, dirty]);

  const saveMutation = useMutation({
    mutationFn: () => updateCategories(treeToPaths(tree)),
    onSuccess: () => {
      toast({ title: "Saved", description: "Categories updated." });
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Save Failed", description: err instanceof Error ? err.message : "Could not save." });
    },
  });

  const modifyTree = (fn: (draft: CategoryLevel[]) => CategoryLevel[]) => {
    setTree((prev) => fn(JSON.parse(JSON.stringify(prev))));
    setDirty(true);
  };

  const findParentAndIndex = (nodes: CategoryLevel[], path: string[]): { parent: CategoryLevel[] | null; index: number } => {
    if (path.length === 1) return { parent: nodes, index: nodes.findIndex((n) => n.name === path[0]) };
    const parentNode = nodes.find((n) => n.name === path[0]);
    if (!parentNode?.children) return { parent: null, index: -1 };
    return findParentAndIndex(parentNode.children, path.slice(1));
  };

  const handleRename = useCallback((path: string[], newName: string) => {
    modifyTree((draft) => { const { parent, index } = findParentAndIndex(draft, path); if (parent && index >= 0) parent[index] = { ...parent[index], name: newName }; return draft; });
  }, []);

  const handleDelete = useCallback((path: string[]) => {
    modifyTree((draft) => { const { parent, index } = findParentAndIndex(draft, path); if (parent && index >= 0) parent.splice(index, 1); return draft; });
  }, []);

  const handleAddChild = useCallback((parentPath: string[], childName: string) => {
    modifyTree((draft) => {
      const findNode = (nodes: CategoryLevel[], p: string[]): CategoryLevel | null => {
        if (p.length === 0) return null;
        const node = nodes.find((n) => n.name === p[0]);
        if (!node) return null;
        if (p.length === 1) return node;
        return findNode(node.children || [], p.slice(1));
      };
      const target = findNode(draft, parentPath);
      if (target) { if (!target.children) target.children = []; target.children.push({ name: childName }); }
      return draft;
    });
  }, []);

  const handleAddRoot = () => {
    if (newRootName.trim()) {
      modifyTree((draft) => { draft.push({ name: newRootName.trim(), children: [] }); return draft; });
      setNewRootName("");
      setAddingRoot(false);
    }
  };

  // ── Sheet Tab Config ──
  const [tabValues, setTabValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const tab of DEFAULT_SHEET_TABS) {
      initial[tab.key] = getSheetTabName(tab.key);
    }
    return initial;
  });

  const handleTabNameChange = (key: string, value: string) => {
    setTabValues((prev) => ({ ...prev, [key]: value }));
  };

  const saveTabNames = () => {
    for (const [key, value] of Object.entries(tabValues)) {
      setSheetTabName(key, value);
    }
    toast({ title: "Saved", description: "Sheet tab names updated." });
  };

  // ── Connection Settings ──
  const [appsScriptUrl, setAppsScriptUrl] = useState(getConfigValue("APPS_SCRIPT_BASE_URL", ""));
  const [pdfUrl, setPdfUrl] = useState(getConfigValue("INSTRUCTIONS_PDF_URL", "/chatgpt-product-instructions.pdf"));
  const [driveFolderId, setDriveFolderId] = useState(getConfigValue("DRIVE_CSV_FOLDER_ID", ""));
  const [googleServiceAccountKey, setGoogleServiceAccountKey] = useState(getConfigValue("GOOGLE_SERVICE_ACCOUNT_KEY", ""));
  const [googleSheetId, setGoogleSheetId] = useState(getConfigValue("GOOGLE_SHEET_ID", ""));
  const [testingConnection, setTestingConnection] = useState(false);

  const testSupabaseConnection = async () => {
    if (!googleServiceAccountKey.trim() || !googleSheetId.trim()) {
      toast({ 
        variant: "destructive", 
        title: "Missing Configuration", 
        description: "Please provide both Service Account Key and Sheet ID before testing." 
      });
      return;
    }

    setTestingConnection(true);
    try {
      // Save settings to localStorage for the test to work
      setConfigValue("GOOGLE_SERVICE_ACCOUNT_KEY", googleServiceAccountKey);
      setConfigValue("GOOGLE_SHEET_ID", googleSheetId);
      
      const { readGoogleSheets } = await import("@/lib/supabaseGoogleSheets");
      const result = await readGoogleSheets();
      
      if (result.useDefaults) {
        toast({ 
          variant: "destructive", 
          title: "Connection Failed", 
          description: "Could not connect to Google Sheets. Check your credentials and Sheet ID." 
        });
      } else {
        const productCount = result.products?.length ?? 0;
        const categoryCount = result.categories?.length ?? 0;
        toast({ 
          title: "Connection Successful! ✓", 
          description: `Connected to your sheet. Found ${productCount} products and ${categoryCount} categories.` 
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Connection Error", 
        description: error instanceof Error ? error.message : "An unexpected error occurred." 
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConnectionSettings = () => {
    // Validate Google Service Account Key if provided
    if (googleServiceAccountKey.trim()) {
      try {
        const parsed = JSON.parse(googleServiceAccountKey);
        // Check for required fields with explicit validation
        if (!parsed.type || typeof parsed.type !== 'string' || parsed.type.trim() === '' ||
            !parsed.project_id || typeof parsed.project_id !== 'string' || parsed.project_id.trim() === '' ||
            !parsed.private_key || typeof parsed.private_key !== 'string' || parsed.private_key.trim() === '' ||
            !parsed.client_email || typeof parsed.client_email !== 'string' || parsed.client_email.trim() === '') {
          toast({ 
            variant: "destructive", 
            title: "Invalid JSON Key", 
            description: "The Google Service Account Key is missing required fields (type, project_id, private_key, client_email)." 
          });
          return;
        }
      } catch (error) {
        toast({ 
          variant: "destructive", 
          title: "Invalid JSON", 
          description: "The Google Service Account Key must be valid JSON. Please check the format." 
        });
        return;
      }
    }

    // Validate Google Sheet ID format if provided
    if (googleSheetId.trim()) {
      // Google Sheet IDs are alphanumeric with hyphens/underscores, minimum 30 characters
      if (googleSheetId.trim().length < 30 || !/^[a-zA-Z0-9_-]+$/.test(googleSheetId.trim())) {
        toast({ 
          variant: "destructive", 
          title: "Invalid Sheet ID", 
          description: "The Google Sheet ID format appears incorrect. It should be a long alphanumeric string (minimum 30 characters)." 
        });
        return;
      }
    }

    // Save all settings
    setConfigValue("APPS_SCRIPT_BASE_URL", appsScriptUrl);
    setConfigValue("INSTRUCTIONS_PDF_URL", pdfUrl);
    setConfigValue("DRIVE_CSV_FOLDER_ID", driveFolderId);
    setConfigValue("GOOGLE_SERVICE_ACCOUNT_KEY", googleServiceAccountKey);
    setConfigValue("GOOGLE_SHEET_ID", googleSheetId);
    
    toast({ 
      title: "Saved", 
      description: "Connection settings saved. Changes take effect immediately." 
    });
  };

  // ── LEGAL Editor ──
  const { data: propData } = useQuery({ queryKey: ["properties"], queryFn: fetchProperties, staleTime: 60_000 });
  const properties = propData?.properties ?? [];
  const legalValues = propData?.legalValues ?? [];

  const [selectedLegalProp, setSelectedLegalProp] = useState("");
  const legalForProp = useMemo(() => legalValues.filter((l) => l.propertyName === selectedLegalProp).map((l) => l.allowedValue), [legalValues, selectedLegalProp]);
  const dropdownProps = useMemo(() => properties.filter((p) => p.inputType === "dropdown").map((p) => p.name), [properties]);

  // ── FILTER Editor ──
  const { data: filterRules = [] } = useQuery({ queryKey: ["filter-rules"], queryFn: fetchFilterRules, staleTime: 60_000 });
  const leafPaths = useMemo(() => getAllLeafPaths(tree), [tree]);

  return (
    <div className="space-y-6">
      {/* Connection Settings */}
      <FormSection title="Google Sheets Connection" defaultOpen={true}>
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4 space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">📚 Need Help Connecting Your Google Sheet?</h4>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              This application can connect to your Google Sheets in two ways:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1 ml-2">
              <li><strong>Method 1 (Recommended):</strong> Google Service Account via Supabase Edge Function</li>
              <li><strong>Method 2:</strong> Google Apps Script Web App (configure URL below)</li>
            </ul>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" asChild className="bg-white dark:bg-gray-900">
                <a href="https://github.com/bravobraverman1/product-entry-hub-10/blob/main/GOOGLE_SHEETS_SETUP.md" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Complete Setup Guide
                </a>
              </Button>
            </div>
          </div>

          {/* Method 1: Supabase Edge Function Configuration */}
          <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-primary/5">
            <h4 className="text-sm font-semibold">Method 1: Google Service Account (Recommended)</h4>
            <div className="rounded-lg border border-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 p-3 space-y-1">
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">⚠️ Security Notice</p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Credentials are stored in your browser's localStorage. Only use this on trusted devices. For production deployments, consider setting credentials server-side via Supabase dashboard instead.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure your Google Service Account credentials below. Follow the <a href="https://github.com/bravobraverman1/product-entry-hub-10/blob/main/GOOGLE_SHEETS_SETUP.md" target="_blank" rel="noopener noreferrer" className="underline">complete setup guide</a> for step-by-step instructions.
            </p>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Google Service Account Key (JSON)</Label>
              <Textarea 
                value={googleServiceAccountKey} 
                onChange={(e) => setGoogleServiceAccountKey(e.target.value)} 
                placeholder='Paste the entire JSON key file contents here: {"type": "service_account", "project_id": "...", ...}'
                className="min-h-32 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Create a Google Service Account, download the JSON key file, and paste its entire contents here.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Google Sheet ID</Label>
              <Input 
                value={googleSheetId} 
                onChange={(e) => setGoogleSheetId(e.target.value)} 
                placeholder="1abc123xyz..." 
                className="h-9 text-sm font-mono" 
              />
              <p className="text-xs text-muted-foreground">
                The long string in your sheet URL between /d/ and /edit. Example: In https://docs.google.com/spreadsheets/d/1abc123xyz/edit, the ID is 1abc123xyz
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={testSupabaseConnection}
                disabled={testingConnection || !googleServiceAccountKey.trim() || !googleSheetId.trim()}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Test Connection
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Test your credentials before saving to ensure they work correctly.
              </p>
            </div>
          </div>

          {/* Method 2: Apps Script Configuration */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold">Method 2: Google Apps Script (Alternative)</h4>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Apps Script Web App URL</Label>
              <Input value={appsScriptUrl} onChange={(e) => setAppsScriptUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" className="h-9 text-sm font-mono" />
              <p className="text-xs text-muted-foreground">
                Only needed if using Google Apps Script method. Leave empty to use Method 1 (Supabase) or mock data.
              </p>
            </div>
          </div>
          
          <div className="space-y-1.5 max-w-lg">
            <Label className="text-xs font-medium">Product Instructions PDF URL</Label>
            <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="/chatgpt-product-instructions.pdf" className="h-9 text-sm" />
          </div>
          
          <div className="space-y-1.5 max-w-lg">
            <Label className="text-xs font-medium">Google Drive CSV Folder ID</Label>
            <Input value={driveFolderId} onChange={(e) => setDriveFolderId(e.target.value)} placeholder="1abc..." className="h-9 text-sm font-mono" />
            <p className="text-xs text-muted-foreground">
              Optional: The Google Drive folder ID where CSV exports should be saved.
            </p>
          </div>
          
          <Button type="button" size="sm" onClick={saveConnectionSettings}><Save className="h-3.5 w-3.5 mr-1" /> Save Connection Settings</Button>
        </div>
      </FormSection>

      {/* Sheet Tab Names */}
      <FormSection title="Sheet Tab Names" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Configure the exact Google Sheet tab names used by this application.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_SHEET_TABS.map((tab) => (
              <div key={tab.key} className="space-y-1">
                <Label className="text-xs font-medium">{tab.label}</Label>
                <Input
                  value={tabValues[tab.key] || ""}
                  onChange={(e) => handleTabNameChange(tab.key, e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
            ))}
          </div>
          <Button type="button" size="sm" onClick={saveTabNames}><Save className="h-3.5 w-3.5 mr-1" /> Save Tab Names</Button>
        </div>
      </FormSection>

      {/* Category Editor */}
      <FormSection title="Categories Editor" defaultOpen>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-2 max-h-[500px] overflow-y-auto">
            {tree.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories loaded.</p>
            ) : (
              tree.map((node) => (
                <TreeEditorNode key={node.name} node={node} path={[]} onRename={handleRename} onDelete={handleDelete} onAddChild={handleAddChild} />
              ))
            )}
          </div>

          {addingRoot ? (
            <div className="flex items-center gap-2">
              <Input value={newRootName} onChange={(e) => setNewRootName(e.target.value)} placeholder="New root category…" className="h-8 text-sm flex-1 max-w-sm" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAddRoot(); if (e.key === "Escape") setAddingRoot(false); }} />
              <Button type="button" size="sm" className="h-8" onClick={handleAddRoot}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setAddingRoot(false)}>Cancel</Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setAddingRoot(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Root Category
            </Button>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="button" disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()} className="h-9">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save Changes
            </Button>
            {dirty && <p className="text-xs text-warning">Unsaved changes</p>}
          </div>
        </div>
      </FormSection>

      {/* LEGAL Values Editor */}
      <FormSection title="LEGAL Values Editor" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Select a dropdown field to view and manage its allowed values. Changes are saved to the LEGAL sheet.</p>
          <div className="max-w-sm">
            <Label className="text-xs font-medium">Field</Label>
            <select
              value={selectedLegalProp}
              onChange={(e) => setSelectedLegalProp(e.target.value)}
              className="w-full h-9 text-sm border border-border rounded-md px-2 bg-background"
            >
              <option value="">Select a field…</option>
              {dropdownProps.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          {selectedLegalProp && (
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium">Allowed values for "{selectedLegalProp}":</p>
              {legalForProp.length === 0 ? (
                <p className="text-xs text-muted-foreground">No values defined yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {legalForProp.map((val) => (
                    <span key={val} className="px-2 py-0.5 rounded-full bg-muted text-xs">{val}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">New values can be added via the "Other…" option in form dropdowns, or edit the LEGAL sheet directly.</p>
            </div>
          )}
        </div>
      </FormSection>

      {/* FILTER Rules Editor */}
      <FormSection title="FILTER Rules Editor" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Define which fields/specifications are visible or required when a specific category is selected as MAIN.
            Select a category, then configure field visibility.
          </p>
          <p className="text-xs text-muted-foreground italic">
            This feature reads/writes to the "{config.SHEET_FILTER}" sheet tab. {filterRules.length > 0 ? `${filterRules.length} rules loaded.` : "No rules configured yet."}
          </p>
          <p className="text-xs text-muted-foreground">
            Full filter editor coming soon — configure rules directly in the {config.SHEET_FILTER} sheet for now.
          </p>
        </div>
      </FormSection>

      {/* Product Instructions PDF */}
      <FormSection title="Product Instructions" defaultOpen={false}>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Reference document for data entry guidelines.</p>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={config.INSTRUCTIONS_PDF_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Instructions PDF
            </a>
          </Button>
        </div>
      </FormSection>
    </div>
  );
};

export default Admin;
