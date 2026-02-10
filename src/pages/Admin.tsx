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
import { supabase } from "@/integrations/supabase/client";

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
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'osiueywaplycxspbaadh';
  
  const [pdfUrl, setPdfUrl] = useState(getConfigValue("INSTRUCTIONS_PDF_URL", "/chatgpt-product-instructions.pdf"));
  const [driveFolderId, setDriveFolderId] = useState(getConfigValue("DRIVE_CSV_FOLDER_ID", ""));
  const [testingConnection, setTestingConnection] = useState(false);

  const testSupabaseConnection = async () => {
    setTestingConnection(true);
    try {
      // Test the edge function connection (credentials should be in Supabase secrets)
      const { data, error } = await supabase.functions.invoke("google-sheets", {
        body: {
          action: "read"
          // No credentials in request - should use environment variables
        },
      });

      if (error) {
        toast({ 
          variant: "destructive", 
          title: "Connection Error", 
          description: `Failed to connect: ${error.message || 'Unknown error'}`
        });
        return;
      }
      
      if (data?.useDefaults) {
        toast({ 
          variant: "destructive", 
          title: "Configuration Missing", 
          description: "Google Sheets credentials not found in Supabase. Please ensure you've completed Step 4 (Add Secrets) and Step 5 (Deploy Function)." 
        });
      } else {
        const productCount = data?.products?.length ?? 0;
        const categoryCount = data?.categories?.length ?? 0;
        toast({ 
          title: "Connection Successful! ✓", 
          description: `Connected to your sheet. Found ${productCount} products and ${categoryCount} categories.` 
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Connection Error", 
        description: error instanceof Error ? error.message : "An unexpected error occurred. Make sure the Edge Function is deployed." 
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
              Follow the step-by-step guide below to securely connect your Google Sheet to this application using Google Service Account.
            </p>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" asChild className="bg-white dark:bg-gray-900">
                <a href="https://github.com/bravobraverman1/product-entry-hub-10/blob/main/GOOGLE_SHEETS_SETUP.md" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Complete Setup Guide
                </a>
              </Button>
            </div>
          </div>

          {/* Method 1: Manual Server-Side Setup Guide */}
          <div className="border border-primary/20 rounded-lg p-6 space-y-6 bg-primary/5">
            <div>
              <h4 className="text-base font-semibold mb-2">Google Sheets Connection Setup</h4>
              <p className="text-sm text-muted-foreground">Follow these steps to securely connect your Google Sheet. This is a one-time setup.</p>
            </div>

            {/* Section 0: How This Works */}
            <div className="space-y-3 border-l-2 border-blue-500 pl-4">
              <h5 className="text-sm font-semibold">How the Google Sheets connection works</h5>
              <p className="text-sm text-muted-foreground">
                This app already includes a pre-built server configuration that knows how to connect to Google Sheets. 
                <strong> You do NOT create code, and you do NOT edit any files.</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>The connection lives in a secure server file called an "Edge Function"</li>
                <li>This file already exists in the app at <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/functions/google-sheets</code></li>
                <li>Activating it simply turns the connection ON</li>
                <li>You never open or change this file</li>
              </ul>
              <div className="rounded-lg border border-blue-600 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">💡 Think of this like turning on a feature that is already installed.</p>
              </div>
            </div>

            {/* Step 1: Create Service Account */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold">Create a Google Service Account</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a Google Service Account so the app can securely access your Google Sheet.
                  </p>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://console.cloud.google.com/iam-admin/serviceaccounts', '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Open Google Cloud Console
                </Button>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Click "Create Service Account"</li>
                  <li>Name it anything (example: <code className="text-xs bg-muted px-1 py-0.5 rounded">sheets-access</code>)</li>
                  <li>Skip role assignment (click "Continue" then "Done")</li>
                </ul>
              </div>
            </div>

            {/* Step 2: Download Key */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold">Create & Download the Key File</h5>
                  <p className="text-sm text-muted-foreground mt-1">Download a secure key file.</p>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Click the service account you just created</li>
                  <li>Go to the "Keys" tab</li>
                  <li>Click "Add Key" → "Create new key"</li>
                  <li>Choose "JSON"</li>
                  <li>Download the file and keep it safe</li>
                </ul>
                <div className="rounded-lg border border-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 p-3">
                  <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">⚠️ Do not upload this file anywhere except Supabase. Never email it.</p>
                </div>
              </div>
            </div>

            {/* Step 3: Share Sheet */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold">Share Your Google Sheet</h5>
                  <p className="text-sm text-muted-foreground mt-1">Give the app permission to access your Google Sheet.</p>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Open your Google Sheet</li>
                  <li>Click "Share"</li>
                  <li>Paste the service account email (looks like <code className="text-xs bg-muted px-1 py-0.5 rounded">name@project-id.iam.gserviceaccount.com</code> from the JSON file)</li>
                  <li>Set permission to "Editor"</li>
                  <li>Click "Send"</li>
                </ul>
              </div>
            </div>

            {/* Step 4: Add Secrets */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold">Add Secure Secrets in Supabase</h5>
                  <p className="text-sm text-muted-foreground mt-1">Store the credentials securely on the server. This requires accessing the Supabase dashboard.</p>
                </div>
              </div>
              <div className="ml-8 space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Step 4a: Go to Supabase Dashboard</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Log in with your Supabase account</li>
                    <li>Select the project you're using for this app</li>
                    <li>Once in your project dashboard, look for the sidebar on the left</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Step 4b: Navigate to Edge Function Secrets</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>In the left sidebar, click <strong>"Functions"</strong></li>
                    <li>Click <strong>"Edge Functions"</strong> (if not visible, you may need to expand the menu)</li>
                    <li>In the functions list, find and click on <strong>"google-sheets"</strong></li>
                    <li>On the google-sheets function page, look for a tab or section called <strong>"Secrets"</strong> or <strong>"Environment"</strong></li>
                    <li>Click to view/add secrets</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Step 4c: Add the Two Required Secrets</p>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div>
                      <p className="text-sm font-semibold mb-1">First Secret:</p>
                      <div className="bg-background p-2 rounded border space-y-1">
                        <p className="text-xs font-semibold">Name:</p>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code>
                        <p className="text-xs font-semibold mt-2">Value:</p>
                        <p className="text-xs text-muted-foreground">Paste the <strong>ENTIRE contents</strong> of the JSON key file you downloaded in Step 2 (it starts with <code className="bg-background px-1">{"{"}</code> and ends with <code className="bg-background px-1">{"}"}</code>)</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Second Secret:</p>
                      <div className="bg-background p-2 rounded border space-y-1">
                        <p className="text-xs font-semibold">Name:</p>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">GOOGLE_SHEET_ID</code>
                        <p className="text-xs font-semibold mt-2">Value:</p>
                        <p className="text-xs text-muted-foreground">The ID from your Google Sheet URL</p>
                        <p className="text-xs text-muted-foreground">Look at your sheet URL: <code className="bg-background px-1 rounded">https://docs.google.com/spreadsheets/d/</code><strong>1abc123xyz</strong><code className="bg-background px-1 rounded">/edit</code></p>
                        <p className="text-xs text-muted-foreground">Copy only the bolded part between <code className="bg-background px-1">/d/</code> and <code className="bg-background px-1">/edit</code></p>
                        <p className="text-xs text-muted-foreground italic">Example: <code className="bg-background px-1 rounded">1abc123xyz</code></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-600 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-900 dark:text-blue-100"><strong>ℹ️ Note:</strong> After adding both secrets, click "Save" in the Supabase interface. The secrets are now stored securely on Supabase's server.</p>
                </div>
              </div>
            </div>

            {/* Step 5: Activate Configuration via GitHub Actions */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">5</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold">Activate the Google Sheets Connection (GitHub Actions)</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>No terminal required.</strong> This step activates your connection by clicking a button in GitHub. 
                  </p>
                </div>
              </div>
              <div className="ml-8 space-y-3 max-h-96 overflow-y-auto pr-2">
                <div className="rounded-lg border border-green-600 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-100">✓ What this does: Automatically deploys your Edge Function and activates your Google Sheets connection.</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-3">One-Time Setup: Add GitHub Secrets</p>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-2">1. Go to your GitHub repository → Settings → Secrets and variables → Actions</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2">2. Create three secrets:</p>
                      <div className="space-y-2">
                        <div className="bg-background p-2 rounded border">
                          <p className="text-xs font-semibold">Secret 1: SUPABASE_ACCESS_TOKEN</p>
                          <p className="text-xs text-muted-foreground">Get from: https://supabase.com/dashboard/account/tokens</p>
                        </div>
                        <div className="bg-background p-2 rounded border">
                          <p className="text-xs font-semibold">Secret 2: SUPABASE_PROJECT_REF</p>
                          <p className="text-xs text-muted-foreground">Get from: Supabase Dashboard → Settings → General (Reference ID)</p>
                        </div>
                        <div className="bg-background p-2 rounded border">
                          <p className="text-xs font-semibold">Secret 3: SUPABASE_DB_PASSWORD</p>
                          <p className="text-xs text-muted-foreground">Your Supabase database password (from project creation)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Then: Run the Workflow (5 Clicks)</p>
                  <div className="space-y-2">
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Go to your GitHub repository → <strong>Actions</strong> tab</li>
                      <li>Select <strong>"Deploy Google Sheets Connection"</strong> from the left sidebar</li>
                      <li>Click <strong>"Run workflow"</strong> button</li>
                      <li>Select <strong>"production"</strong> environment</li>
                      <li>Wait for completion (green checkmark ✓) — takes 2-3 minutes</li>
                    </ol>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-600 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-900 dark:text-blue-100"><strong>ℹ️ This only needs to be done once.</strong> After completion, your Google Sheets connection is active!</p>
                </div>
              </div>
            </div>

            {/* Step 6: Test Connection */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">6</div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold">Verify the Connection</h5>
                  <p className="text-sm text-muted-foreground mt-1">Test that everything is working correctly.</p>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                <Button 
                  type="button" 
                  variant="default" 
                  size="sm" 
                  onClick={testSupabaseConnection}
                  disabled={testingConnection}
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
                <div className="rounded-lg border border-green-600 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-100">✅ If this test succeeds, no further setup is ever required.</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The test will show clear error messages if something is not configured correctly (e.g., sheet not shared, missing credentials, or function not activated).
                </p>
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
