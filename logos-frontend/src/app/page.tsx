"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaFont, FaEdit, FaCloud, FaBolt, FaQuoteLeft } from "react-icons/fa";
import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

export default function Page() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, toasts, dismiss } = useToast();

  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          message:
            "Successfully signed up for beta! We'll approve users every few hours.",
          variant: "success",
        });
        setEmail("");
      } else {
        toast({
          message: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        message: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  return (
    <div className="flex flex-col min-h-screen text-foreground">
      {/* Navigation - Simplified for now */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-6 pb-4 sm:px-4 sm:pb-4 bg-transparent backdrop-blur-md lg:backdrop-blur-none">
        <div className="font-bold text-xl text-primary">
          <span className="flex items-center">
            {/* Optional: Simple SVG Logo placeholder if you have one */}
            {/* <svg viewBox="0 0 24 24" className="h-7 w-7 mr-2" fill="currentColor"><path d="..."></path></svg> */}
            <FaFont className="h-7 w-7 mr-2" /> Logos
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Links to be decided - e.g., Product, About, Blog */}
          {/* <Link href="/about" className="text-foreground hover:text-primary transition-colors">About</Link> */}
          <Link href="/login">
            <Button
              variant="outline"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              Login
            </Button>
          </Link>
          <Link href="/home">
            <Button
              variant="default"
              className="bg-primary/90 backdrop-blur-sm hover:bg-primary"
            >
              Try Logos <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight sm:leading-tight md:leading-tight">
            Craft Intelligent Agents.
            <br />
            Simply with Language.
          </h1>
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Logos empowers you to build, deploy, and manage sophisticated AI
            agents using natural language. No code, just clarity.
          </p>

          {/* Beta Signup Section */}
          <div className="mt-8 sm:mt-10 max-w-md mx-auto">
            <form onSubmit={handleBetaSignup} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-primary text-center">
                Join the Beta
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                We approve users every few hours.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="px-6"
                >
                  {isSubmitting ? "..." : "Sign Up"}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/home">
              <Button
                size="lg"
                variant="default"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-3"
              >
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#">
              {" "}
              {/* Placeholder link */}
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-3"
              >
                Explore Docs
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-background/70 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Streamline Your AI Workflow
            </h2>
            <p className="text-lg text-muted-foreground mb-12 sm:mb-16">
              From idea to intelligent automation, Logos makes it seamless.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-[var(--background)] to-[var(--muted)] rounded-md border-2 border-[var(--border)] shadow-xl transition-shadow">
              <FaQuoteLeft className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Design with Language
              </h3>
              <p className="text-muted-foreground text-sm">
                Describe your agent&apos;s goals and behaviors using natural
                language prompts.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-[var(--background)] to-[var(--muted)] rounded-md border-2 border-[var(--border)] shadow-xl transition-shadow">
              <FaEdit className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Iterate & Refine
              </h3>
              <p className="text-muted-foreground text-sm">
                Visually edit flows, test interactions, and fine-tune your
                agent&apos;s logic with ease.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-[var(--background)] to-[var(--muted)] rounded-md border-2 border-[var(--border)] shadow-xl transition-shadow">
              <FaCloud className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Deploy to the Cloud
              </h3>
              <p className="text-muted-foreground text-sm">
                One-click deployment to our scalable cloud infrastructure. No
                servers to manage.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-[var(--background)] to-[var(--muted)] rounded-md border-2 border-[var(--border)] shadow-xl transition-shadow">
              <FaBolt className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Run Asynchronously
              </h3>
              <p className="text-muted-foreground text-sm">
                Execute complex agent tasks asynchronously, ensuring smooth and
                efficient operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Simplified */}
      <footer className="py-8 text-center border-t border-border/50 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Logos. All rights reserved.
        </p>
      </footer>

      {/* Toast Container */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClick={() => dismiss(toast.id)}
          className="cursor-pointer"
        >
          {toast.message}
        </Toast>
      ))}

      {/* Optional: Add global styles for animations if needed later, similar to Anthropic's subtle fades */}
      {/* <style jsx global>{` ... `}</style> */}
    </div>
  );
}
