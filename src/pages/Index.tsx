import { ProductEntryForm } from "@/components/ProductEntryForm";
import { Coffee } from "lucide-react";
const Index = () => {
  return <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 gap-3 flex items-center justify-center">
          <div className="size-max bg-destructive text-destructive">
            <Coffee className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Lighting Style Data Entry Form</h1>
            <p className="text-xs text-muted-foreground">Enter product details for catalog submission</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 border-destructive opacity-100 rounded-none border-none border-0 text-destructive bg-primary">
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