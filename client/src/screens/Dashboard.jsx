import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Brain,
  Check,
  Clock,
  Download,
  File,
  LogOut,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Upload,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { axiosInstance } from "../utils/axiosInstance";
import { notify } from "../utils/notify";
import { removeToken } from "../utils/sessionStorage";
import { generateChatPDF } from "../utils/pdfGenerator";

const TypingAnimation = () => (
  <div className="flex items-center space-x-1 p-4">
    <Brain className="h-5 w-5 flex-shrink-0" />
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
    <span className="text-sm text-gray-500">AI is typing...</span>
  </div>
);

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [sessionFiles, setSessionFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const activeSession = sessions.find(
    (session) => session.sessionId === activeSessionId,
  );

  const formatTimestamp = (dateString) => {
    if (!dateString) return getCurrentTimestamp();
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentTimestamp = () =>
    new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownloadPDF = () => {
    if (chatMessages.length === 0) {
      notify("No messages to download.", "info");
      return;
    }
    setIsDownloading(true);
    try {
      generateChatPDF(activeSession, chatMessages);
    } catch (err) {
      notify("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const refreshFiles = () =>
    axiosInstance.get("/upload").then((response) => {
      if (response.data.success) {
        setFiles(response.data.files);
      }
    });

  const loadSessionFiles = (sessionId) =>
    axiosInstance.get(`/chat/sessions/${sessionId}/files`).then((response) => {
      if (response.data.success) {
        setSessionFiles(response.data.files);
      }
    });

  const loadSessionMessages = (sessionId) => {
    setIsLoadingChat(true);
    axiosInstance
      .get(`/chat/sessions/${sessionId}/messages`)
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        const transformedMessages = [];
        response.data.messages.forEach((chat) => {
          transformedMessages.push({
            id: `user-${chat.chatId}`,
            type: "user",
            content: chat.userMsg,
            timestamp: formatTimestamp(chat.createdAt),
          });
          transformedMessages.push({
            id: `ai-${chat.chatId}`,
            type: "ai",
            content: chat.aiResponse,
            timestamp: formatTimestamp(chat.createdAt),
          });
        });

        if (transformedMessages.length === 0) {
          transformedMessages.push({
            id: "welcome",
            type: "ai",
            content:
              "Create or select a document set for this chat, then ask a question.",
            timestamp: getCurrentTimestamp(),
          });
        }

        setChatMessages(transformedMessages);
      })
      .catch(() => {
        setChatMessages([
          {
            id: "welcome",
            type: "ai",
            content: "Failed to load this chat. Try selecting it again.",
            timestamp: getCurrentTimestamp(),
          },
        ]);
        notify("Failed to fetch chat messages!", "error");
      })
      .finally(() => {
        setIsLoadingChat(false);
      });
  };

  const refreshSessions = () =>
    axiosInstance.get("/chat/sessions").then((response) => {
      if (response.data.success) {
        setSessions(response.data.sessions);
        return response.data.sessions;
      }

      throw new Error(response.data.message);
    });

  const createSession = () =>
    axiosInstance.post("/chat/sessions").then((response) => {
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      setSessions((prev) => [response.data.session, ...prev]);
      setActiveSessionId(response.data.session.sessionId);
      return response.data.session;
    });

  useEffect(() => {
    const token = sessionStorage.getItem("USER_SESS_TOKEN");
    if (!token) {
      notify("You need to log in first!", "error");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    axiosInstance.get("/users/me").then((response) => {
      if (response.data.success) {
        setUserData(response.data.user.email);
        setIsEmailVerified(response.data.user.isEmailVerified);
      } else {
        notify(response.data.message || "Failed to fetch user data!", "error");
      }
    });
  }, []);

  useEffect(() => {
    Promise.all([refreshFiles(), refreshSessions()])
      .then(([, fetchedSessions]) => {
        if (fetchedSessions.length > 0) {
          setActiveSessionId(fetchedSessions[0].sessionId);
        } else {
          return createSession();
        }
      })
      .catch(() => {
        notify("Failed to initialize dashboard!", "error");
      });
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;

    loadSessionMessages(activeSessionId);
    loadSessionFiles(activeSessionId).catch(() => {
      notify("Failed to fetch attached documents!", "error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const isFileAttached = (fileId) =>
    sessionFiles.some((file) => file.fileId === fileId);

  const handleNewChat = () => {
    createSession().catch(() => {
      notify("Failed to create chat session!", "error");
    });
  };

  const attachFile = (fileId) => {
    if (!activeSessionId) return;

    axiosInstance
      .post(`/chat/sessions/${activeSessionId}/files`, { fileId })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        return loadSessionFiles(activeSessionId);
      })
      .catch(() => {
        notify("Failed to attach document!", "error");
      });
  };

  const detachFile = (fileId) => {
    if (!activeSessionId) return;

    axiosInstance
      .delete(`/chat/sessions/${activeSessionId}/files/${fileId}`)
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        setSessionFiles((prev) => prev.filter((file) => file.fileId !== fileId));
      })
      .catch(() => {
        notify("Failed to detach document!", "error");
      });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping || !activeSessionId) return;

    if (!isEmailVerified) {
      notify("Please verify your email first!", "error");
      return;
    }

    if (sessionFiles.length === 0) {
      notify("Attach at least one document to this chat first.", "error");
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: getCurrentTimestamp(),
    };

    const messageToSend = message;
    setChatMessages((prev) => [
      ...prev.filter((msg) => msg.id !== "welcome"),
      userMessage,
    ]);
    setMessage("");
    setIsTyping(true);

    axiosInstance
      .post(`/chat/sessions/${activeSessionId}/messages`, {
        userMsg: messageToSend,
      })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        const aiMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: response.data.response,
          timestamp: getCurrentTimestamp(),
        };

        setChatMessages((prev) => [...prev, aiMessage]);
        if (response.data.session) {
          setSessions((prev) =>
            prev.map((session) =>
              session.sessionId === response.data.session.sessionId
                ? response.data.session
                : session,
            ),
          );
        }
      })
      .catch((error) => {
        notify(error.message || "Failed to get AI response!", "error");
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!isEmailVerified) {
      notify("Please verify your email first!", "error");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("pdfFile", file);

    const uploadPath = activeSessionId
      ? `/upload?sessionId=${activeSessionId}`
      : "/upload";

    axiosInstance
      .post(uploadPath, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        return Promise.all([
          refreshFiles(),
          activeSessionId ? loadSessionFiles(activeSessionId) : Promise.resolve(),
        ]);
      })
      .then(() => {
        notify("File uploaded successfully!", "success");
      })
      .catch((error) => {
        notify(error.message || "File upload failed!", "error");
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const removeFile = (fileId) => {
    axiosInstance
      .delete(`/upload/${fileId}`)
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        setFiles((prev) => prev.filter((file) => file.fileId !== fileId));
        setSessionFiles((prev) => prev.filter((file) => file.fileId !== fileId));
        notify("File deleted successfully!", "success");
      })
      .catch(() => {
        notify("File deletion failed!", "error");
      });
  };

  const handleLogout = () => {
    removeToken();
    notify("You have been logged out successfully!", "success");
    navigate("/login", { replace: true });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="h-screen bg-white text-black flex flex-col">
      <ToastContainer />
      {!isEmailVerified && (
        <div className="bg-yellow-100 border-b-2 border-yellow-400 p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-semibold">
                Please verify your email to upload documents and chat.
              </span>
            </div>
            <button
              onClick={() => {
                axiosInstance
                  .post("/auth/resend-verification", { email: userData })
                  .then(() => {
                    notify("Verification email sent!", "success");
                  })
                  .catch(() => {
                    notify("Failed to resend verification email!", "error");
                  });
              }}
              className="px-4 py-1 bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-colors"
            >
              Resend Link
            </button>
          </div>
        </div>
      )}
      <nav className="border-b-2 border-black px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8" />
            <span className="text-2xl font-bold">NotebookAI</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 border border-black">
              <User className="h-5 w-5" />
              <span className="font-semibold">{userData}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-black hover:text-white transition-colors border border-black"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r-2 border-black bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-black">
            <h2 className="text-lg font-bold mb-4">Document Library</h2>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf"
              />
              <button
                className={`w-full p-3 border-2 border-black font-semibold transition-colors flex items-center justify-center ${
                  isUploading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "hover:bg-black hover:text-white"
                }`}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload and Attach
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {files.length === 0 && (
                <div className="text-sm text-gray-500 border border-black p-3 bg-white">
                  No documents uploaded yet.
                </div>
              )}

              {files.map((file) => {
                const attached = isFileAttached(file.fileId);
                const fileName = file.filePath || file.name;
                const fileType =
                  fileName.split(".").pop()?.toUpperCase() || "FILE";

                return (
                  <div
                    key={file.fileId}
                    className="bg-white border-2 border-black p-3 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <File className="h-4 w-4 flex-shrink-0" />
                          <span
                            className="font-bold text-sm truncate"
                            title={fileName}
                          >
                            {fileName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{fileType}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Uploaded at {formatTimestamp(file.uploadedAt)}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <button
                          className={`p-1 transition-colors ${
                            attached
                              ? "bg-black text-white"
                              : "hover:bg-black hover:text-white"
                          }`}
                          onClick={() =>
                            attached
                              ? detachFile(file.fileId)
                              : attachFile(file.fileId)
                          }
                          title={attached ? "Detach" : "Attach"}
                        >
                          {attached ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          className="p-1 hover:bg-black hover:text-white transition-colors"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFile(file.fileId)}
                          className="p-1 hover:bg-red-600 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="border-b border-black px-6 py-3 bg-gray-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="font-bold">{activeSession?.title || "New chat"}</h1>
                <p className="text-sm text-gray-600">
                  {sessionFiles.length} attached document
                  {sessionFiles.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading || chatMessages.length === 0}
                className="flex items-center space-x-2 px-3 py-2 border-2 border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Download chat as PDF"
              >
                {isDownloading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-sm">PDF</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {isLoadingChat ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  <span className="ml-3 text-gray-500">
                    Loading chat history...
                  </span>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-3xl p-4 border-2 border-black ${
                          msg.type === "user"
                            ? "bg-black text-white"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {msg.type === "ai" && (
                            <Brain className="h-5 w-5 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <ReactMarkdown
                              components={{
                                code({
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }) {
                                  const match = /language-(\w+)/.exec(
                                    className || "",
                                  );
                                  return !inline && match ? (
                                    <div className="relative group">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            String(children).trim(),
                                          );
                                        }}
                                        className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                                      >
                                        Copy
                                      </button>
                                      <SyntaxHighlighter
                                        style={atomDark}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, "")}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code
                                      className={`bg-gray-200 px-1 text-sm ${
                                        className || ""
                                      }`}
                                      {...props}
                                    >
                                      {String(children)}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            <div
                              className={`text-xs mt-2 ${
                                msg.type === "user"
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              {msg.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-3xl border-2 border-black bg-gray-50">
                        <TypingAnimation />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="border-t-2 border-black p-4 bg-gray-50">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      sessionFiles.length === 0
                        ? "Attach documents to start chatting..."
                        : "Enter your message..."
                    }
                    disabled={isTyping || sessionFiles.length === 0}
                    className="w-full px-4 py-3 pr-12 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 text-lg disabled:bg-gray-200 disabled:cursor-not-allowed"
                  />
                  <MessageSquare className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping || sessionFiles.length === 0}
                  className="px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {isTyping ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="w-72 border-l-2 border-black bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-black">
            <button
              onClick={handleNewChat}
              className="w-full p-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-semibold flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-bold mb-3">Chats</h3>
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => setActiveSessionId(session.sessionId)}
                  className={`w-full text-left border border-black p-3 transition-colors ${
                    session.sessionId === activeSessionId
                      ? "bg-black text-white"
                      : "bg-white hover:bg-black hover:text-white"
                  }`}
                >
                  <div className="font-semibold truncate">{session.title}</div>
                  <div className="text-xs flex items-center mt-1 opacity-75">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(session.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-black">
            <h3 className="font-bold mb-3">Attached Docs</h3>
            <div className="space-y-2">
              {sessionFiles.length === 0 && (
                <div className="text-sm text-gray-500 bg-white border border-black p-3">
                  No documents attached.
                </div>
              )}
              {sessionFiles.map((file) => (
                <div
                  key={file.fileId}
                  className="bg-white border border-black p-2 flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-semibold truncate">
                    {file.filePath}
                  </span>
                  <button
                    onClick={() => detachFile(file.fileId)}
                    className="p-1 hover:bg-black hover:text-white"
                    title="Detach"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
