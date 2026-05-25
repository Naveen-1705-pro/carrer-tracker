"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useEffect } from "react";
import { auth as firebaseAuth, googleProvider, signInWithPopup, isFirebaseConfigured } from "@/lib/firebase";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasGoogleClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let intervalId: NodeJS.Timeout;

    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              setLoading(true);
              try {
                await googleLogin({ idToken: response.credential });
                toast.success("Successfully signed in with Google!");
                router.push("/dashboard");
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Google login failed");
              } finally {
                setLoading(false);
              }
            },
          });
          
          const btnParent = document.getElementById("google-signin-btn");
          if (btnParent) {
            (window as any).google.accounts.id.renderButton(btnParent, {
              theme: "outline",
              size: "large",
              width: btnParent.clientWidth || 382,
              text: "signin_with",
            });
            if (intervalId) clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error initializing Google Identity Services:", error);
        }
      }
    };

    initGoogle();

    intervalId = setInterval(() => {
      if ((window as any).google) {
        initGoogle();
      }
    }, 500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [googleLogin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDemo = async () => {
    setLoading(true);
    try {
      await googleLogin({
        googleId: `demo-${Date.now()}`,
        email: email || "demo@resumeiq.app",
        name: "Demo User",
      });
      toast.info("Signed in with Google (Demo Mode)");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseLogin = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      await googleLogin({
        googleId: user.uid,
        email: user.email || "",
        name: user.displayName || undefined,
        avatar: user.photoURL || undefined,
      });
      
      toast.success("Successfully logged in via Firebase!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Firebase authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              AI ResumeIQ
            </span>
          </Link>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        <Card className="p-8 border-border bg-card/80 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
          <div className="h-6" />
          {isFirebaseConfigured ? (
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background border-border hover:bg-muted text-foreground transition-colors gap-2"
              onClick={handleFirebaseLogin}
              disabled={loading}
            >
              <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
              Sign in with Google (Firebase)
            </Button>
          ) : hasGoogleClientId ? (
            <div className="w-full flex-col flex items-center justify-center min-h-[44px]">
              <div id="google-signin-btn" className="w-full" />
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background border-border hover:bg-muted text-foreground transition-colors"
              onClick={handleGoogleDemo}
              disabled={loading}
            >
              Google (Demo)
            </Button>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <Link href="/register" className="text-purple-400 hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
