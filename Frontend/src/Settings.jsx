import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function Settings({ onClose }) {
  const { authUser, setAuthUser } = useContext(MyContext);
  const [name, setName] = useState(authUser?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setAuthUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to update profile.");
      }

      setAuthUser(data.user);
      setName(data.user.name);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settingsOverlay" onClick={onClose}>
      <section
        className="settingsPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settingsTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settingsHeader">
          <h2 id="settingsTitle">Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <p className="settingsDescription">Manage your NexusGPT profile.</p>

        <form onSubmit={saveProfile}>
          <label className="settingsLabel">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </label>

          <label className="settingsLabel">
            Email address
            <input value={authUser?.email || ""} readOnly />
          </label>

          {message && <p className="settingsSuccess">{message}</p>}
          {error && (
            <p className="settingsError" role="alert">
              {error}
            </p>
          )}

          <button className="settingsSave" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Settings;
