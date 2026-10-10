import { useState } from "react";
import "./Auth.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister && name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isRegister ? { name: name.trim() } : {}),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
  };

  return (
    <main className="authPage">
      <section className="authCard">
        <div className="authLogo">N</div>

        <h1>Welcome to NexusGPT</h1>

        <p className="authSubtitle">
          {isRegister
            ? "Create your account to get started."
            : "Sign in to continue your conversations."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label className="authLabel">
              Full name
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={60}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="authLabel">
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="email"
              required
            />
          </label>

          <label className="authLabel">
            Password
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </label>

          {error && (
            <p className="authError" role="alert">
              {error}
            </p>
          )}

          <button className="authSubmit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="authSwitch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" onClick={switchMode} disabled={loading}>
            {isRegister ? "Log in" : "Sign up"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default AuthPage;
