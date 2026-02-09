import { useState } from "react";
import { Package, Eye } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductStepper } from "@/components/ProductStepper";
import { VisibilityManager } from "@/components/VisibilityManager";

const Index = () => {
  const [selectedSku, setSelectedSku] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Product Creation Portal</h1>
              <p className="text-xs text-muted-foreground">One SKU per submission</p>
            </div>
          </div>
          {selectedSku && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md">
              <span className="text-xs text-muted-foreground">SKU:</span>
              <span className="text-sm font-mono font-semibold text-primary">{selectedSku}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="product" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="product" className="gap-2">
              <Package className="h-4 w-4" />
              Product Entry
            </TabsTrigger>
            <TabsTrigger value="visibility" className="gap-2">
              <Eye className="h-4 w-4" />
              Visibility Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product">
            <ProductStepper onSkuChange={setSelectedSku} />
          </TabsContent>

          <TabsContent value="visibility">
            <VisibilityManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
