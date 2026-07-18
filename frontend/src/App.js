import { useState } from "react";
import LoginScreen from "./LoginScreen";
import Home, { ErrorBoundary } from "./Home";

export default function App() {

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("np_session");
      if (!saved || saved === "null") return null;
      const parsed = JSON.parse(saved);
      if (!parsed || !parsed.name || !parsed.email) return null;
      return parsed;
    } catch {
      return null;
    }
  });
  
  const handleLogin = (userData) => {
    localStorage.setItem("np_session", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("np_session");
    setUser(null);
    window.location.href = "/";
  };

  // 👇 This is the LOGIN GATE — no user = show login screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <Home user={user} onLogout={handleLogout} />
    </ErrorBoundary>
  );
}

