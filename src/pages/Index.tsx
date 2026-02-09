import { ProductEntryForm } from "@/components/ProductEntryForm";
import { Package } from "lucide-react";
const Index = () => {
  return <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Product Data Entry</h1>
            <p className="text-xs text-muted-foreground">Enter product details for catalog submission</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 border-destructive">
        <ProductEntryForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="max-w-4xl mx-auto px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            One SKU per submission • Required fields marked with *
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;