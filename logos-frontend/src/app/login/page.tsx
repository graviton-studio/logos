"use client";
import { login, signup } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { getBaseUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaFont } from "react-icons/fa";

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getBaseUrl() || window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.log("Error signing in with Google:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--background)] to-[var(--muted)]">
      <div className="max-w-md w-full space-y-8 p-10 bg-card border border-border rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="font-bold text-3xl text-primary">
              <span className="flex items-center">
                <FaFont className="h-8 w-8 mr-2 text-primary transition-all duration-500 hover:scale-110" />
                Logos
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground animate-slideInLeft">
            Welcome back
          </h2>
          <p className="mt-2 text-muted-foreground animate-fadeIn animate-delay-200">
            Sign in to your account to continue
          </p>
        </div>
        <form className="mt-8 space-y-6 animate-fadeIn animate-delay-300">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="w-full"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="w-full"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              formAction={login}
              variant="default"
              className="w-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
            >
              Log in
            </Button>
            <Button
              formAction={signup}
              variant="outline"
              className="w-full transition-all duration-300 hover:border-primary"
            >
              Sign up
            </Button>
          </div>

          <div className="flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="px-4 text-sm text-muted-foreground">
              or continue with
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full flex justify-center items-center transition-all duration-300 hover:border-primary"
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Google
          </Button>
        </form>
      </div>

      {/* Add utility animation classes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s forwards;
        }

        .animate-slideInLeft {
          animation: slideInLeft 1s forwards;
        }

        .animate-delay-200 {
          animation-delay: 200ms;
        }

        .animate-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}

// Simple Google icon component
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
