"use client";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
export function GoogleLoginButton({ configured }: { configured: boolean }) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setPending(true);
    setError("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch {
      toast({
        message: "Қате орын алды",
        description: "Кіру мүмкін болмады. Қайта көріңіз.",
        error: true,
      });
      setError("Кіру мүмкін болмады. Қайта көріңіз.");
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        className="w-full"
        disabled={!configured || pending}
        onClick={login}
      >
        {pending ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <span aria-hidden="true" className="font-bold">
            G
          </span>
        )}
        Google арқылы кіру <ArrowRight size={17} />
      </Button>
      {!configured && (
        <p className="mt-4 text-sm leading-6 text-muted">
          Google арқылы кіру әлі бапталмаған. Әкімшіге хабарласыңыз.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
