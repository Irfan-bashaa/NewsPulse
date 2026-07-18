import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react"; 
import { registerUser, loginUser } from "./api/auth";
import api from "./api/api";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("landing");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
 
  const makeAvatar = (n, bg = "f59e0b") =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(n || "U")}&background=${bg}&color=fff&bold=true&size=64`;
  
const getPasswordStrength = () => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      text: "Weak",
      color: "#ef4444",
      width: "33%",
    };
  }

  if (score === 3 || score === 4) {
    return {
      text: "Medium",
      color: "#f59e0b",
      width: "66%",
    };
  }

  return {
    text: "Strong",
    color: "#22c55e",
    width: "100%",
  };
};

  // ── called only ONCE right before component unmounts ──────────────────────
  const doLogin = (userData) => {
    onLogin(userData); // this causes App to re-render → LoginScreen unmounts
  };
 
  // ── Google ─────────────────────────────────────────────────────────────────
const handleGoogle = async () => {

  if (loading) return;

  setLoading(true);
  setError("");

  try {

    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    // Firebase ID Token
    const idToken = await result.user.getIdToken();

    // Send token to backend
    const res = await api.post("/google", {
      idToken,
    });

    // Save backend JWT
    localStorage.setItem("token", res.data.token);

    // Login
    onLogin(res.data.user);

  } catch (err) {

    console.log(err);

    setError(
      err.response?.data?.message ||
      err.message
    );

  } finally {

    setLoading(false);

  }

};

  // ── Guest ──────────────────────────────────────────────────────────────────
  const handleGuest = () => {
    if (loading) return;
    doLogin({
      name: "Guest",
      email: "guest@newspulse.local",
      avatar: makeAvatar("G", "6b7280"),
      provider: "guest",
    });
  };
 
  // ── Email ──────────────────────────────────────────────────────────────────
const handleEmailAuth = async (e) => {
  e.preventDefault();

  setError("");
  setSuccessMsg("");
  setLoading(true);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
    setError("Enter a valid email");
    setLoading(false);
    return;
}
if (!email.trim()) {
  setError("Email is required");
  setLoading(false);
  return;
}

if (!password.trim()) {
  setError("Password is required");
  setLoading(false);
  return;
}

if (isSignUp && !name.trim()) {
  setError("Name is required");
  setLoading(false);
  return;
}

  try {

    if (isSignUp) {

      const res = await registerUser({
        name,
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      setSuccessMsg("🚀 Your account has been created successfully");

      setTimeout(()=>{
         onLogin(res.data.user);
      },700);

    } else {

      const res = await loginUser({
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

     setSuccessMsg("🎉 Welcome back to NewsPulse");

setTimeout(()=>{
    onLogin(res.data.user);
},700);

    }

  } catch (err) {

    setError(
      err.response?.data?.message ||
      "Something went wrong."
    );

  } finally {

    setLoading(false);

  }
};
 
  const switchMode = () => {
    setIsSignUp(v => !v);
    setError("");
    setName("");
    setPassword("");
  };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .lp-root{min-height:100vh;background:#08080f;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;overflow:hidden;position:relative}
        .lp-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 15% 50%,rgba(245,158,11,.13) 0%,transparent 55%),radial-gradient(ellipse at 85% 15%,rgba(239,68,68,.09) 0%,transparent 50%),radial-gradient(ellipse at 55% 85%,rgba(99,102,241,.10) 0%,transparent 50%)}
        .lp-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:56px 56px}
        .lp-card{position:relative;z-index:10;width:100%;max-width:430px;margin:20px;padding:44px 38px 40px;background:rgba(15,15,22,.93);border:1px solid rgba(255,255,255,.09);border-radius:24px;backdrop-filter:blur(24px);box-shadow:0 32px 80px rgba(0,0,0,.65);animation:lpUp .45s cubic-bezier(.22,.68,0,1.2) both}
        @keyframes lpUp{from{opacity:0;transform:translateY(28px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .lp-logo{font-family:'Playfair Display',serif;font-size:30px;font-weight:900;background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;margin-bottom:4px}
        .lp-tag{color:rgba(255,255,255,.35);font-size:13px;margin-bottom:32px}
        .lp-h{color:#fff;font-size:21px;font-weight:700;margin-bottom:22px}
        .lp-btn{width:100%;padding:12px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.055);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .18s,border-color .18s,transform .15s;margin-bottom:10px}
        .lp-btn:hover:not(:disabled){background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.22);transform:translateY(-1px)}
        .lp-btn:disabled{opacity:.45;cursor:not-allowed}
        .lp-guest{width:100%;padding:10px;background:transparent;border:1px dashed rgba(255,255,255,.17);border-radius:12px;color:rgba(255,255,255,.35);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .18s;margin-top:10px}
        .lp-guest:hover:not(:disabled){border-color:rgba(255,255,255,.38);color:rgba(255,255,255,.65)}
        .lp-guest:disabled{opacity:.4;cursor:not-allowed}
        .lp-inp{width:100%;padding:11px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);border-radius:10px;color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;margin-bottom:10px;transition:border-color .2s,background .2s}
        .lp-inp:focus{border-color:#f59e0b;background:rgba(245,158,11,.07)}
        .lp-inp::placeholder{color:rgba(255,255,255,.22)}
.lp-submit{
width:100%;
padding:14px;
border:none;
border-radius:14px;
font-size:15px;
font-weight:700;
cursor:pointer;
background:linear-gradient(135deg,#f59e0b,#ef4444);
color:white;
transition:.3s;
box-shadow:0 10px 30px rgba(245,158,11,.35);
}

.lp-submit:hover{
transform:translateY(-2px) scale(1.02);
box-shadow:0 18px 40px rgba(245,158,11,.45);
}

.lp-submit:active{
transform:scale(.98);
}
        .lp-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);border-radius:8px;padding:9px 12px;color:#fca5a5;font-size:13px;margin-bottom:12px;line-height:1.4}
        .lp-sw{text-align:center;margin-top:18px;color:rgba(255,255,255,.32);font-size:13px}
        .lp-swl{color:#f59e0b;cursor:pointer;font-weight:600;background:none;border:none;font-family:inherit;font-size:inherit;padding:0}
        .lp-swl:hover{text-decoration:underline}
        .lp-back{background:none;border:none;padding:0;color:rgba(255,255,255,.3);font-size:13px;cursor:pointer;margin-bottom:18px;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:4px;transition:color .15s}
        .lp-back:hover{color:rgba(255,255,255,.65)}
        .lp-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
 
      <div className="lp-root">
        <div className="lp-bg" />
        <div className="lp-grid" />
 
        <div className="lp-card">
          <span className="lp-logo">📰 NewsPulse</span>
          <p className="lp-tag">Your intelligent news companion</p>
 
          {/* ── LANDING ── */}
          {mode === "landing" && (
            <>
              <p className="lp-h">Welcome back 👋</p>
 
              {/* Google */}
              <button className="lp-btn" onClick={handleGoogle} disabled={loading}>
                {loading
                  ? <span className="lp-spin" />
                  : <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                }
                {loading ? "Signing in…" : "Continue with Google"}
              </button>
 
              {/* Email */}
              <button className="lp-btn"
                onClick={() => { setMode("email"); setIsSignUp(false); setError(""); }}
                disabled={loading}>
                ✉️ Continue with Email
              </button>
 
              {/* Guest */}
              <button className="lp-guest" onClick={handleGuest} disabled={loading}>
                👤 Continue as Guest &nbsp;(no account needed)
              </button>
            </>
          )}
 
          {/* ── EMAIL FORM ── */}
          {mode === "email" && (
            <>
              <button className="lp-back" type="button"
                onClick={() => { setMode("landing"); setError(""); }}>
                ← Back
              </button>
 
              <p className="lp-h">{isSignUp ? "Create account" : "Sign in"}</p>
 
              {error && <div className="lp-err">⚠️ {error}</div>}
              {successMsg && (
  <div
    style={{
      background: "rgba(34,197,94,.15)",
      border: "1px solid rgba(34,197,94,.4)",
      color: "#86efac",
      padding: "10px",
      borderRadius: "10px",
      marginBottom: "12px",
      textAlign: "center",
    }}
  >
    {successMsg}
  </div>
)}
 
              <form onSubmit={handleEmailAuth} noValidate>
                {isSignUp && (
                  
                  <input className="lp-inp" type="text" placeholder="Full name"
                    value={name} onChange={e => setName(e.target.value)}
                    autoComplete="name" />
                )}
                <div style={{ position: "relative", marginBottom: "18px" }}>

  <span
    style={{
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "18px",
      color: "#888",
      pointerEvents: "none",
    }}
  >
    📧
  </span>

  <input
    className="lp-inp"
    type="email"
    placeholder="Email Address"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    autoComplete="email"
    style={{
      paddingLeft: "45px",
      transition: ".3s",
    }}
  />
</div>
<div style={{ position: "relative" }}>

  <span
    style={{
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "18px",
      color: "#888",
      pointerEvents: "none",
    }}
  >
    🔒
  </span>

  <input
    className="lp-inp"
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    autoComplete={isSignUp ? "new-password" : "current-password"}
    style={{
      paddingLeft: "45px",
      paddingRight: "45px",
    }}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: "18px",
    }}
  >
    {showPassword ? "🙈" : "👁"}
  </span>

</div>
{password.length > 0 && (
  <div style={{ marginBottom: "14px" }}>
    
    <div
      style={{
        width: "100%",
        height: "6px",
        background: "rgba(255,255,255,.08)",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: getPasswordStrength().width,
          height: "100%",
          background: getPasswordStrength().color,
          transition: "all .35s ease",
          borderRadius: "20px",
        }}
      />
    </div>
    
<div
  style={{
    color: "#888",
    fontSize: "12px",
    marginBottom: "12px",
    lineHeight: "1.6",
  }}
>
  ✔ 8+ Characters<br />
  ✔ One Uppercase Letter<br />
  ✔ One Number<br />
  ✔ One Special Character
</div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "6px",
        fontSize: "12px",
      }}
    >
      <span style={{ color: "#999" }}>
        Password Strength
      </span>

      <span
        style={{
          color: getPasswordStrength().color,
          fontWeight: 700,
        }}
      >
        {getPasswordStrength().text}
      </span>
    </div>

  </div>
)}


 
                {!isSignUp && (
  <div
    style={{
      textAlign: "right",
      color: "#f59e0b",
      fontSize: "13px",
      cursor: "pointer",
      marginBottom: "12px",
    }}
    onClick={() => {
    alert("Forgot Password feature coming soon.");
}}
  >
    Forgot Password?
  </div>
)}

<button className="lp-submit" type="submit" disabled={loading}>
                  {loading && <span className="lp-spin" />}
                  {loading ? "Connecting..." : isSignUp ? "Create Account" : "Sign In"}
                </button>
                <label
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#ccc",
    fontSize: "13px",
    marginBottom: "12px",
  }}
>
  <input
    type="checkbox"
    checked={rememberMe}
    onChange={() => setRememberMe(!rememberMe)}
  />
  Remember Me
</label>
              </form>
 
              <div className="lp-sw">
                {isSignUp ? "Already have an account? " : "New here? "}
                <button className="lp-swl" type="button" onClick={switchMode}>
                  {isSignUp ? "Sign in" : "Create account"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

