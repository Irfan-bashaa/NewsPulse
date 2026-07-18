import { useState } from "react";
import LoginScreen from "./LoginScreen";
import Home, { ErrorBoundary } from "./Home";
 
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("np_session");
      if (!saved || saved === "null") return null;
      const parsed = JSON.parse(saved);
      // must have name and email to be valid
      if (!parsed || !parsed.name || !parsed.email) return null;
      return parsed;
    } catch {
      return null;
    }
  });
 
  const handleLogin = (userData) => {
    if (!userData || !userData.name || !userData.email) {
      console.error("Login failed: invalid user data", userData);
      return;
    }
    localStorage.setItem("np_session", JSON.stringify(userData));
    setUser(userData);
  };
 
  const handleLogout = () => {
    // clear ALL app data from localStorage
    localStorage.removeItem("np_session");
    setUser(null);
    // force page reload so all state resets cleanly
    window.location.href = "/";
  };
 
  // show login if no valid user
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }
 
  return (
    <ErrorBoundary>
      <Home user={user} onLogout={handleLogout} />
    </ErrorBoundary>
  );
}