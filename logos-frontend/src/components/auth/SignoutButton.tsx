"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";

// Add className to the props interface
interface SignoutButtonProps {
  className?: string;
}

export default function SignoutButton({ className }: SignoutButtonProps) {
  // Destructure className
  const supabase = createClient();
  const handleSignout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
    redirect("/");
  };
  return (
    // Pass className to the internal Button component
    <Button variant="outline" onClick={handleSignout} className={className}>
      Sign out
    </Button>
  );
}
