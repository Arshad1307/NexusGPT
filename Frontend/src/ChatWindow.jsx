import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import Settings from "./Settings.jsx";
import UpgradePlan from "./UpgradePlan.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
    setAuthUser,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const requestInProgress = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const getReply = async () => {
    if (requestInProgress.current || !prompt.trim()) return;

    requestInProgress.current = true;
    setLoading(true);
    setRequestError("");
    setNewChat(false);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt.trim(),
          threadId: currThreadId,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setAuthUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate a reply.");
      }

      setReply(data.reply);
    } catch (error) {
      console.error("Chat request error:", error.message);
      setRequestError(error.message || "Something went wrong.");
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((previous) => [
        ...previous,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
    }

    setPrompt("");
  }, [reply]);

  const handleProfileClick = () => {
    setIsOpen((previous) => !previous);
    setLogoutError("");
  };

  const handleLogout = async () => {
    setLogoutError("");

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logout failed.");
      }

      setIsOpen(false);
      setAuthUser(null);
    } catch (error) {
      console.error("Logout error:", error.message);
      setLogoutError(
        "Could not contact the server to log out. Please try again.",
      );
    }
  };

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>
          NexusGPT <i className="fa-solid fa-chevron-down"></i>
        </span>

        <button
          type="button"
          className="userIconDiv"
          onClick={handleProfileClick}
          aria-label="Open profile menu"
          aria-expanded={isOpen}
        >
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="dropDown">
          <button
            type="button"
            className="dropDownItem"
            onClick={() => {
              setIsOpen(false);
              setShowSettings(true);
            }}
          >
            <i className="fa-solid fa-gear"></i> Settings
          </button>

          <button
            type="button"
            className="dropDownItem"
            onClick={() => {
              setIsOpen(false);
              setShowUpgrade(true);
            }}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
          </button>

          {logoutError && (
            <p role="alert" style={{ color: "#ff8f8f", padding: "8px" }}>
              {logoutError}
            </p>
          )}

          <button
            type="button"
            className="dropDownItem"
            onClick={handleLogout}
            style={{
              display: "block",
              width: "100%",
              border: "none",
              textAlign: "left",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              background: "transparent",
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
          </button>
        </div>
      )}

      <Chat />

      <ScaleLoader color="#fff" loading={loading} />

      {requestError && (
        <p role="alert" style={{ color: "#ff8f8f" }}>
          {requestError}
        </p>
      )}

      <div className="chatInput">
        <div className="inputBox">
          <input
            placeholder="Ask anything"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                getReply();
              }
            }}
            disabled={loading}
          />

          <div
            id="submit"
            onClick={getReply}
            role="button"
            tabIndex={0}
            aria-label="Send message"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                getReply();
              }
            }}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>

        <p className="info">
          NexusGPT can make mistakes. Check important info. See Cookie
          Preferences.
        </p>
      </div>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showUpgrade && <UpgradePlan onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

export default ChatWindow;
