"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import { getCurrentUser, parseIdToken } from "@/lib/cognitoClient";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  idToken?: string | null;
  accessToken?: string | null;
  profile?: ReturnType<typeof parseIdToken>;
  refresh: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  function loadSession() {
    setIsLoading(true);
    const user = getCurrentUser();
    if (!user) {
      setIdToken(null);
      setAccessToken(null);
      setIsLoading(false);
      return;
    }
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setIdToken(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }
      setIdToken(session.getIdToken().getJwtToken());
      setAccessToken(session.getAccessToken().getJwtToken());
      setIsLoading(false);
    });
  }

  function signOut() {
    const user = getCurrentUser();
    user?.signOut();
    setIdToken(null);
    setAccessToken(null);
  }

  useEffect(() => {
    loadSession();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      isAuthenticated: !!idToken,
      idToken,
      accessToken,
      profile: parseIdToken(idToken),
      refresh: loadSession,
      signOut,
    }),
    [isLoading, idToken, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
