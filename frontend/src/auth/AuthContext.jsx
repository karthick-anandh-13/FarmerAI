import React from "react";

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fa_user")) || null;
    } catch {
      return null;
    }
  });

  function signIn({ name, email }) {
    const u = { id: Date.now(), name, email };
    localStorage.setItem("fa_user", JSON.stringify(u));
    setUser(u);
  }

  function signOut() {
    localStorage.removeItem("fa_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
