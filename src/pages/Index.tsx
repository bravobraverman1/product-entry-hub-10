import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSupabaseAuth = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY),
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing information",
        description: "Enter both your email and password to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!hasSupabaseAuth) {
      toast({
        title: "Login not connected",
        description: "This screen is ready, but Supabase auth variables are not configured in this environment yet.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Signed in",
        description: "Redirecting to the workspace.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Unable to sign in",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f7f4] px-5 py-6 sm:px-8 sm:py-8">
      <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.06),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,244,0.98))]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-100/70 to-transparent" />
        <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-16 sm:px-8">
          <div className="w-full max-w-[470px] rounded-[24px] border border-slate-200 bg-white px-6 py-8 shadow-[0_32px_60px_-40px_rgba(15,23,42,0.32)] sm:px-8 sm:py-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
                LS
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                LS Reminders
              </h1>
              <p className="mt-3 text-lg text-slate-500">
                Sign in to manage your reminders
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-base font-semibold text-slate-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-base font-semibold text-slate-900">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-none focus-visible:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-none hover:bg-emerald-700"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
