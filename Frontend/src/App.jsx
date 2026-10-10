import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import AuthPage from "./AuthPage.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect } from "react";
import { v1 as uuidv1 } from "uuid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) setAuthUser(null);
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setAuthUser(data.user);
        }
      } catch (error) {
        console.error("Session check failed:", error.message);

        if (!cancelled) setAuthUser(null);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const providerValues = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    newChat,
    setNewChat,
    prevChats,
    setPrevChats,
    allThreads,
    setAllThreads,
    authUser,
    setAuthUser,
  };

  if (checkingSession) {
    return (
      <div className="app">
        <p style={{ color: "white", margin: "auto" }}>Loading NexusGPT...</p>
      </div>
    );
  }

  if (!authUser) {
    return <AuthPage onAuthenticated={(user) => setAuthUser(user)} />;
  }

  return (
    <div className="app">
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  );
}

export default App;
