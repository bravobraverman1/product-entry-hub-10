import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  fetchCategoriesWithSource,
  updateCategories,
  fetchProperties,
  fetchFilterRules,
  saveFilterRules,
  type FilterRule,
  type CategoriesFetchResult,
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
import { invokeGoogleSheetsFunction } from "@/lib/supabaseGoogleSheets";
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

// GitHub repository configuration
const GITHUB_REPO_OWNER = "bravobraverman1";
const GITHUB_REPO_NAME = "product-entry-hub-10";
const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;

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
  expandAllSignal: number;
  expandAllValue: boolean | null;
  readOnly?: boolean;
}

function TreeEditorNode({
  node,
  path,
  onRename,
  onDelete,
  onAddChild,
  expandAllSignal,
  expandAllValue,
  readOnly = false,
}: TreeEditorNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const [adding, setAdding] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentPath = [...path, node.name];
  const leaf = isLeaf(node);

  useEffect(() => {
    if (expandAllValue !== null) {
      setExpanded(expandAllValue);
    }
  }, [expandAllSignal, expandAllValue]);

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

        {editing && !readOnly ? (
          <div className="flex items-center gap-1 flex-1">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-6 text-xs flex-1" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }} />
            <button type="button" onClick={handleRename}><Check className="h-3.5 w-3.5 text-success" /></button>
            <button type="button" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        ) : (
          <>
            <span className="text-sm flex-1 truncate">{node.name}</span>
            {!readOnly && (
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
            )}
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

      {adding && !readOnly && (
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
            <TreeEditorNode
              key={child.name}
              node={child}
              path={currentPath}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expandAllSignal={expandAllSignal}
              expandAllValue={expandAllValue}
              readOnly={readOnly}
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

  // ── Categories ──
  const { data: categoriesResult, error: categoriesError, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesWithSource,
    staleTime: 60_000,
    retry: false,
  });

  const loadedTree = categoriesResult?.categories ?? [];
  const categoriesSource = categoriesResult?.source ?? "defaults";
  const loadedFromSheet = categoriesSource === "google-sheets" || categoriesSource === "apps-script";

  const [tree, setTree] = useState<CategoryLevel[]>([]);
  const [dirty, setDirty] = useState(false);
  const [addingRoot, setAddingRoot] = useState(false);
  const [newRootName, setNewRootName] = useState("");
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [expandAllValue, setExpandAllValue] = useState<boolean | null>(null);
  // Editing is locked until categories are successfully loaded from Google Sheet
  const editingLocked = !loadedFromSheet || categoriesLoading || !!categoriesError;
  // Ref so that memoized callbacks always see the latest value (avoids stale closure)
  const editingLockedRef = useRef(editingLocked);
  editingLockedRef.current = editingLocked;

  // Show error if categories failed to load
  useEffect(() => {
    if (categoriesError) {
      console.error("Failed to load categories:", categoriesError);
      toast({
        variant: "destructive",
        title: "Failed to Load Categories",
        description: categoriesError instanceof Error ? categoriesError.message : "Could not load categories from Google Sheet",
      });
    }
  }, [categoriesError, toast]);

  // Warn if loaded from defaults (not from sheet)
  useEffect(() => {
    if (categoriesResult && !loadedFromSheet) {
      toast({
        variant: "destructive",
        title: "⚠️ Categories NOT from Google Sheet",
        description: "Categories loaded from local defaults. Saving is DISABLED to prevent overwriting real data. Fix your Google Sheets connection first.",
      });
    }
  }, [categoriesResult, loadedFromSheet, toast]);

  useEffect(() => {
    if (loadedTree.length > 0 && !dirty) setTree(loadedTree);
  }, [loadedTree, dirty]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // SAFETY: Block saving if data did not come from Google Sheet
      if (!loadedFromSheet) {
        throw new Error("Cannot save: categories were not loaded from Google Sheet. Fix your connection and reload before saving.");
      }
      // Proceed with the write — the edge function has its own safety guards:
      // 1. Reads current sheet before diffing (so it never works from stale data)
      // 2. Mass-delete guard aborts if >50% rows would be deleted
      // 3. Surgical diff only touches changed rows
      await updateCategories(treeToPaths(tree));
    },
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
    // SAFETY: Never allow tree modification if not synced with sheet
    // Uses ref to always read the CURRENT value, not a stale closure from first render
    if (editingLockedRef.current) {
      console.error("Blocked tree modification: categories not synced with Google Sheet");
      toast({ variant: "destructive", title: "Edit Blocked", description: "Cannot modify categories — not synced with Google Sheet." });
      return;
    }
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
    // Invalidate all data queries to force refresh with new tab names
    queryClient.invalidateQueries({ queryKey: ["skus"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
    queryClient.invalidateQueries({ queryKey: ["recent-submissions"] });
    toast({ title: "Synced!", description: "Sheet tab names saved and all data refreshed from Google Sheets." });
  };

  // ── Connection Settings ──
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const supabaseFunctionsUrl =
    import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
    (supabaseUrl ? `${supabaseUrl}/functions/v1` : "");
  
  // Regex pattern for validating and extracting project ref from Supabase URL
  const SUPABASE_URL_PATTERN = /https:\/\/([a-z0-9-]+)\.supabase\.co/i;
  const supabaseProjectRef = supabaseUrl.match(SUPABASE_URL_PATTERN)?.[1] || "";
  const functionsProjectRef = supabaseFunctionsUrl.match(SUPABASE_URL_PATTERN)?.[1] || "";
  
  // Validate if URL is a proper Supabase URL
  const isValidSupabaseUrl = SUPABASE_URL_PATTERN.test(supabaseUrl);
  const isFunctionsUrlMatch =
    !!supabaseFunctionsUrl && !!supabaseUrl && supabaseFunctionsUrl.startsWith(supabaseUrl);
  const isFunctionsProjectMatch =
    !functionsProjectRef || !supabaseProjectRef || functionsProjectRef === supabaseProjectRef;
  
  const [pdfUrl, setPdfUrl] = useState(getConfigValue("INSTRUCTIONS_PDF_URL", "/chatgpt-product-instructions.pdf"));
  const [driveFolderId, setDriveFolderId] = useState(getConfigValue("DRIVE_CSV_FOLDER_ID", ""));
  const [testingConnection, setTestingConnection] = useState(false);

  const testSupabaseConnection = async () => {
    setTestingConnection(true);
    try {
      // Test the edge function connection (credentials should be in Supabase secrets)
      const { data, error } = await invokeGoogleSheetsFunction<{ useDefaults?: boolean; products?: unknown[]; categoryPathCount?: number }>(
        {
          action: "read",
          // No credentials in request - should use environment variables
        }
      );

      if (error) {
        // Provide specific error messages based on error type
        let errorMessage = error.message || 'Unknown error';
        
        // Check for common error scenarios
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          errorMessage = "Edge Function not deployed. Please run the 'Deploy Google Sheets Connection' workflow in GitHub Actions (Step 5).";
        } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          errorMessage = "Access denied. Make sure your Google Sheet is shared with the service account email (found in your JSON key file).";
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          errorMessage = "Authentication failed. Check that GOOGLE_SERVICE_ACCOUNT_KEY is correctly set in Supabase secrets.";
        }
        
        toast({ 
          variant: "destructive", 
          title: "Connection Error", 
          description: errorMessage
        });
        return;
      }
      
      if (data?.useDefaults) {
        toast({ 
          variant: "destructive", 
          title: "⚠️ Cannot Read Secrets", 
          description: "The Edge Function cannot read GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEET_ID. Most likely cause: You added secrets AFTER deploying the function. Solution: Run the 'Deploy Google Sheets Connection' workflow in GitHub Actions (this redeploys the function with your secrets). See the yellow box below for step-by-step instructions." 
        });
      } else {
        const productCount = data?.products?.length ?? 0;
        const categoryCount = data?.categoryPathCount ?? 0;
        toast({ 
          title: "Connected ✅", 
          description: `Successfully connected to your Google Sheet! Found ${productCount} products and ${categoryCount} categories.` 
        });
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred.";
      
      if (error instanceof Error) {
        // Parse fetch/network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = "Network error. Check your internet connection and that the Supabase project URL is correct.";
        } else if (error.message.includes('404')) {
          errorMessage = "Edge Function not found. Please deploy it using GitHub Actions (Step 5).";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        variant: "destructive", 
        title: "Connection Error", 
        description: errorMessage
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConnectionSettings = () => {
    // Save all settings (Google Sheets credentials are now managed server-side)
    setConfigValue("INSTRUCTIONS_PDF_URL", pdfUrl);
    setConfigValue("DRIVE_CSV_FOLDER_ID", driveFolderId);
    
    toast({ 
      title: "Saved", 
      description: "Connection settings saved. Changes take effect immediately." 
    });
  };

  // Check if Google Sheets credentials are configured
  // Note: Credentials are stored ONLY as Supabase secrets, not in browser storage for security

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
      <FormSection title="Google Sheets Connection" defaultOpen={false}>
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4 space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">📚 Need Help Connecting Your Google Sheet?</h4>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Follow the complete step-by-step setup guide to securely connect your Google Sheet using a Google Service Account.
            </p>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" asChild className="bg-white dark:bg-gray-900">
                <a href="https://github.com/bravobraverman1/product-entry-hub-10/blob/main/GOOGLE_SHEETS_SETUP.md" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Complete Setup Guide
                </a>
              </Button>
            </div>
          </div>
          
          {/* Project Check Section */}
          <div className="space-y-3 rounded-lg border border-muted bg-muted/50 p-4">
            <h5 className="text-sm font-semibold">Project Check (Important)</h5>
            <p className="text-xs text-muted-foreground">
              Frontend is hosted on Lovable, but the backend runs on your Supabase Edge Function. Verify your Supabase project configuration before testing the connection.
            </p>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              ⚠️ Do NOT run Lovable “Security Fixer” for Edge Functions or anything related to cloud/database/AI.
              It can reroute requests to Lovable services and break your Supabase connection.
            </p>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-32 shrink-0">Supabase URL:</span>
                <span className={`text-xs break-all ${isValidSupabaseUrl ? "text-foreground" : "text-red-600 dark:text-red-400"}`}>
                  {supabaseUrl || "NOT CONFIGURED"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-32 shrink-0">Project Ref:</span>
                <span className={`text-xs ${supabaseProjectRef ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400"}`}>
                  {supabaseProjectRef ? `✓ Detected: ${supabaseProjectRef}` : "NOT CONFIGURED"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-32 shrink-0">Publishable Key:</span>
                <span className={`text-xs font-semibold ${supabaseAnonKey ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {supabaseAnonKey ? "✓ Detected" : "NOT CONFIGURED"}
                </span>
              </div>
            </div>
          </div>


          {/* Configuration Help Alert - Show when environment variables are not configured */}
          {(!isValidSupabaseUrl || !supabaseAnonKey) && (
            <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
                <div className="space-y-2 flex-1">
                  <h5 className="text-sm font-bold text-red-900 dark:text-red-100">
                    Environment Variables Not Configured
                  </h5>
                    <p className="text-xs text-red-800 dark:text-red-200">
                    Your Supabase credentials are not set up in Lovable. This is why the Test Connection button is disabled.
                  </p>
                  <div className="text-xs text-red-900 dark:text-red-100 space-y-2 bg-white/50 dark:bg-black/20 p-3 rounded border border-red-300 dark:border-red-700">
                    <p className="font-semibold">Quick Fix (Most Common Issue):</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Go to Lovable → Environment Variables</li>
                      <li>Add: <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> (or <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>)</li>
                      <li><strong>CRITICAL: Redeploy/Republish your site</strong> (environment variables are embedded at build time)</li>
                      <li>Wait 2-3 minutes, then <strong>hard refresh</strong> this page (Ctrl+Shift+R)</li>
                    </ol>
                    <p className="text-xs italic pt-1">
                      ℹ️ Simply adding environment variables isn't enough - you must rebuild your app for them to take effect!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Test Connection Section */}
          <div className="space-y-3 border-l-2 border-primary pl-4">
            <h5 className="text-sm font-semibold">Test Your Connection</h5>
            <p className="text-sm text-muted-foreground">
              Once you've completed the setup guide above, test that your Google Sheet is connected correctly.
            </p>
            <div className="space-y-2">
              <Button 
                type="button" 
                variant="default" 
                size="sm" 
                onClick={testSupabaseConnection}
                disabled={testingConnection || !isValidSupabaseUrl || !supabaseAnonKey}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              
              {/* Short Error Explanations */}
              <div className="rounded-lg border border-amber-600 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">🔴 "Cannot Read Secrets" Error?</p>
                <div className="text-xs text-amber-900 dark:text-amber-100 space-y-1">
                  <p className="font-semibold">This usually means you added secrets AFTER deploying the function.</p>
                  <p className="font-medium">✅ Solution: Redeploy the Edge Function</p>
                  <ol className="list-decimal list-inside space-y-0.5 ml-2">
                    <li>Go to the <strong>Actions</strong> tab in your GitHub repository</li>
                    <li>Click <strong>"Deploy Google Sheets Connection"</strong> in the left sidebar</li>
                    <li>Click <strong>"Run workflow"</strong> dropdown → select "production" → click <strong>"Run workflow"</strong> button</li>
                    <li>Wait 2-3 minutes for completion</li>
                    <li>Return here and click <strong>"Test Connection"</strong> again</li>
                  </ol>
                  <p className="italic mt-1">Why? Edge Functions load secrets at deployment time only. Adding secrets to an already-running function requires redeployment.</p>
                  <div className="pt-2">
                    <Button type="button" variant="outline" size="sm" asChild className="bg-white dark:bg-gray-900">
                      <a href={`${GITHUB_REPO_URL}/actions/workflows/deploy-google-sheets.yml`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" /> Go to GitHub Actions Workflow
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Other Common Errors:</p>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 mt-1 space-y-0.5 list-disc list-inside">
                    <li><strong>Edge Function not found (404):</strong> Function not deployed yet - see setup guide STEP 3</li>
                    <li><strong>Access denied (403):</strong> Google Sheet not shared with service account - see setup guide STEP 2</li>
                  </ul>
                </div>
              </div>
              
              <div className="rounded-lg border border-green-600 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3">
                <p className="text-xs font-semibold text-green-900 dark:text-green-100">✅ Successful test shows: "Connected" with your product and category counts.</p>
              </div>
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setExpandAllValue(true);
                setExpandAllSignal((v) => v + 1);
              }}
            >
              Expand All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setExpandAllValue(false);
                setExpandAllSignal((v) => v + 1);
              }}
            >
              Collapse All
            </Button>
          </div>
          {categoriesError && (
            <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-3">
              <p className="text-xs font-semibold text-red-900 dark:text-red-100">❌ Error Loading Categories</p>
              <p className="text-xs text-red-800 dark:text-red-200 mt-1">{categoriesError instanceof Error ? categoriesError.message : "Unknown error"}</p>
            </div>
          )}
          {categoriesLoading && (
            <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950 p-3">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">⏳ Loading categories from Google Sheet...</p>
            </div>
          )}
          {!categoriesLoading && !categoriesError && loadedFromSheet && (
            <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950 p-3">
              <p className="text-xs font-semibold text-green-900 dark:text-green-100">✅ Synced with Google Sheet — editing enabled</p>
            </div>
          )}
          {!categoriesLoading && !categoriesError && !loadedFromSheet && (
            <div className="rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950 p-3">
              <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">🔒 Read-only — categories loaded from local defaults, not Google Sheet</p>
              <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">All editing is disabled. Fix your Google Sheets connection and reload the page to enable editing.</p>
            </div>
          )}
          <div className="border border-border rounded-lg p-2 max-h-[500px] overflow-y-auto">
            {tree.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories loaded.</p>
            ) : (
              tree.map((node) => (
                <TreeEditorNode
                  key={node.name}
                  node={node}
                  path={[]}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  expandAllSignal={expandAllSignal}
                  expandAllValue={expandAllValue}
                  readOnly={editingLocked}
                />
              ))
            )}
          </div>

          {!editingLocked && addingRoot ? (
            <div className="flex items-center gap-2">
              <Input value={newRootName} onChange={(e) => setNewRootName(e.target.value)} placeholder="New root category…" className="h-8 text-sm flex-1 max-w-sm" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAddRoot(); if (e.key === "Escape") setAddingRoot(false); }} />
              <Button type="button" size="sm" className="h-8" onClick={handleAddRoot}><Check className="h-3.5 w-3.5 mr-1" /> Add</Button>
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setAddingRoot(false)}>Cancel</Button>
            </div>
          ) : !editingLocked ? (
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setAddingRoot(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Root Category
            </Button>
          ) : null}

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="button" disabled={!dirty || saveMutation.isPending || editingLocked} onClick={() => saveMutation.mutate()} className="h-9">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save Changes
            </Button>
            {dirty && !editingLocked && <p className="text-xs text-warning">Unsaved changes</p>}
            {editingLocked && (
              <p className="text-xs text-destructive font-semibold">🔒 Editing & saving disabled — not synced with Google Sheet</p>
            )}
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
