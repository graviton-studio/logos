// useUser.ts
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Supabase client
  const supabase = createClient();

  useEffect(() => {
    // Function to fetch the current user
    const fetchUser = async () => {
      try {
        setLoading(true);

        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        // Set the user if we have a session
        if (session) {
          setUser(session.user);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred"),
        );
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    // Call the function immediately
    fetchUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );

    // Clean up subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return { user, loading, error };
};

export default useUser;
