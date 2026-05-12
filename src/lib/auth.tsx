import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Track last fetched userId to avoid redundant DB calls
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    // Set up listener FIRST so we don't miss SIGNED_IN events
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthReady(true);
    });
    // Then fetch existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id ?? null;

    if (!userId) {
      setIsAdmin(false);
      setProfile(null);
      lastFetchedUserId.current = null;
      setUserDataLoading(false);
      return;
    }

    // Skip refetch if user hasn't changed (avoids double-fire on token refresh)
    if (userId === lastFetchedUserId.current) return;
    lastFetchedUserId.current = userId;
    setUserDataLoading(true);

    // Batch both requests in a single Promise.all
    Promise.all([
      supabase.from("admins").select("id").eq("id", userId).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ])
      .then(([adminRes, profRes]) => {
        setIsAdmin(!!adminRes.data);
        setProfile(profRes.data);
        setUserDataLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load auth profile data", err);
        setIsAdmin(false);
        setProfile(null);
        setUserDataLoading(false);
      });
  }, [session]);

  const loading =
    !authReady ||
    userDataLoading ||
    (!!session?.user && lastFetchedUserId.current !== session.user.id);

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin,
        signOut: async () => {
          lastFetchedUserId.current = null;
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
          setUserDataLoading(false);
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Supabase sign out failed", error);
            await supabase.auth.signOut({ scope: "local" });
          }
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
