import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
    setAuthUser,
  } = useContext(MyContext);

  const getAllThreads = async () => {
    try {
      const response = await fetch(`${API_URL}/thread`, {
        credentials: "include",
      });

      if (response.status === 401) {
        setAuthUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch conversations.");
      }

      const threads = await response.json();

      setAllThreads(
        threads.map((thread) => ({
          threadId: thread.threadId,
          title: thread.title,
        })),
      );
    } catch (error) {
      console.error("Fetch conversations error:", error.message);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
  };

  const changeThread = async (threadId) => {
    try {
      const response = await fetch(
        `${API_URL}/thread/${encodeURIComponent(threadId)}`,
        { credentials: "include" },
      );

      if (response.status === 401) {
        setAuthUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to open conversation.");
      }

      const messages = await response.json();

      setCurrThreadId(threadId);
      setPrevChats(messages);
      setNewChat(false);
      setReply(null);
      setPrompt("");
    } catch (error) {
      console.error("Open conversation error:", error.message);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(
        `${API_URL}/thread/${encodeURIComponent(threadId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.status === 401) {
        setAuthUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete conversation.");
      }

      setAllThreads((previous) =>
        previous.filter((thread) => thread.threadId !== threadId),
      );

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (error) {
      console.error("Delete conversation error:", error.message);
    }
  };

  return (
    <section className="sidebar">
      <button onClick={createNewChat}>
        <img
          src="src/assets/blacklogo.png"
          alt="NexusGPT logo"
          className="logo"
        />
        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      <ul className="history">
        {allThreads?.map((thread) => (
          <li
            key={thread.threadId}
            onClick={() => changeThread(thread.threadId)}
            className={thread.threadId === currThreadId ? "highlighted" : ""}
          >
            {thread.title}

            <i
              className="fa-solid fa-trash"
              onClick={(event) => {
                event.stopPropagation();
                deleteThread(thread.threadId);
              }}
            ></i>
          </li>
        ))}
      </ul>

      <div className="sign">
        <p>By Md Arshad &hearts;</p>
      </div>
    </section>
  );
}

export default Sidebar;
