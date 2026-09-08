import { useEffect, useRef, useState } from "react";
import { Menu, Plus, Search, Settings, Send, Sparkles, Sun, Moon, Trash2, User, Copy, RotateCcw, Paperclip, Mic, X, PencilLine, XCircle, FileText, Square, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import AIAvatar from "./components/AIAvatar";
import { askDocumentQuestion, sendChatMessage, sendFileChatMessage, sendImageChatMessage } from "./services/chatService";
import "./App.css";

const STORAGE_KEY = "vns-chat-history-v1";
const PREFERENCES_KEY = "vns-ui-preferences-v1";
const DEFAULT_WELCOME = "Hello, I’m VNS Agentic AI. What would you like to build, understand, or improve today?";
const GENERIC_TITLES = new Set(["", "untitled conversation", "new chat", "new conversation"]);

const trendingSuggestions = [
    ["AI Agents", "Build an AI Agent"], ["Agentic AI", "Explain Agentic AI"], ["Generative AI", "Latest AI technologies"],
    ["RAG", "Learn RAG step by step"], ["LangChain", "Explain LangChain"], ["LangGraph", "Explain LangGraph"],
    ["MCP", "Explain MCP"], ["FastAPI", "Create FastAPI backend"], ["Django REST API", "Explain Django REST API"],
    ["React", "React project ideas"], ["Next.js", "Build a Next.js app"], ["Cybersecurity", "Cybersecurity roadmap"],
    ["Machine Learning", "Machine Learning roadmap"], ["Data Science", "Data Science project ideas"], ["Cloud & DevOps", "Cloud and DevOps roadmap"],
];

const modes = [
    ["normal", "Professional", "Focused answers"],
    ["funny", "Creative", "Fresh perspectives"],
    ["angry", "Direct", "Straight to the point"],
    ["sad", "Mentor", "Patient guidance"],
];

const providerOptions = {
    groq: {
        label: "Groq",
        models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
    },
    gemini: {
        label: "Gemini",
        models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
    },
};

const makeChatId = () => `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createChatObject = (title = "New Chat") => ({
    id: makeChatId(),
    title,
    provider: "groq",
    model: providerOptions.groq.models[0],
    messages: [],
    updatedAt: Date.now(),
});

const titleCase = (value) => value.split(" ").map((word) => {
    if (/^[A-Z0-9.&/-]+$/.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}).join(" ");

const deriveChatTitle = (message) => {
    const cleaned = message.replace(/[`*_~>#\[\](){}]/g, " ").replace(/[^\w&+./-]+/g, " ").replace(/\s+/g, " ").trim();
    if (!cleaned) return "New Chat";

    let words = cleaned.split(" ");
    const lower = words.map((word) => word.toLowerCase());
    if (lower[0] === "how" && lower[1] === "to") words = words.slice(2);
    if (["explain", "create", "build", "make", "help", "please"].includes(words[0]?.toLowerCase())) words = words.slice(1);
    if (words[0]?.toLowerCase() === "a" || words[0]?.toLowerCase() === "an") words = words.slice(1);
    if (lower.includes("deploy")) {
        words = words.filter((word) => word.toLowerCase() !== "deploy" && word.toLowerCase() !== "to" && word.toLowerCase() !== "on");
        words.push("Deployment");
    }
    if (words.length > 7) words = words.slice(0, 7);
    return titleCase(words.join(" ")) || "New Chat";
};

const hasMeaningfulTitle = (title) => !GENERIC_TITLES.has(String(title || "").trim().toLowerCase());

const loadSavedChats = () => {
    try {
        if (localStorage.getItem(PREFERENCES_KEY + "-history") === "false") return [];
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not parse saved chats", error);
        return [];
    }
};

function MarkdownMessage({ content, onCopy }) {
    return <>
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
            code: ({ className, children, inline, ...props }) => {
                const language = /language-(\w+)/.exec(className || "")?.[1];
                const code = String(children).replace(/\n$/, "");

                if (inline) {
                    return <code className="inline-code" {...props}>{children}</code>;
                }

                return <div className="code-block-wrap">
                    <div className="code-block-toolbar">
                        <span>{language || "code"}</span>
                        <button type="button" onClick={() => onCopy(code)}><Copy size={12} /> Copy code</button>
                    </div>
                    <SyntaxHighlighter
                        language={language || "text"}
                        style={oneDark}
                        customStyle={{ margin: 0, padding: "15px", background: "transparent" }}
                        PreTag="div"
                    >
                        {code}
                    </SyntaxHighlighter>
                </div>;
            },
        }}
    >{content}</ReactMarkdown>
    <div className="response-feedback" aria-label="Response feedback">
        <button type="button" aria-label="Like response"><ThumbsUp size={13} /></button>
        <button type="button" aria-label="Dislike response"><ThumbsDown size={13} /></button>
    </div>
    </>;
}

function ChatWorkspace() {
    const reduce = useReducedMotion();
    const initialChatState = (() => {
        const stored = loadSavedChats();
        if (stored.length > 0) {
            return { history: stored, currentId: stored[0].id };
        }
        const chat = createChatObject();
        return { history: [chat], currentId: chat.id };
    })();

    const [theme, setTheme] = useState(() => localStorage.getItem("vns-theme") || "dark");
    const [mode, setMode] = useState("normal");
    const [chatHistory, setChatHistory] = useState(initialChatState.history);
    const [currentChatId, setCurrentChatId] = useState(initialChatState.currentId);
    const [searchTerm, setSearchTerm] = useState("");
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState(providerOptions.groq.models[0]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [documentContext, setDocumentContext] = useState(null);
    const [temperature, setTemperature] = useState(() => Number(localStorage.getItem(PREFERENCES_KEY + "-temperature")) || 0.7);
    const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem(PREFERENCES_KEY + "-system-prompt") || "");
    const [chatHistoryEnabled, setChatHistoryEnabled] = useState(() => localStorage.getItem(PREFERENCES_KEY + "-history") !== "false");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [messages, setMessages] = useState(
        () => initialChatState.history.find((chat) => chat.id === initialChatState.currentId)?.messages || []
    );
    const endRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const nearBottomRef = useRef(true);
    const fileInputRef = useRef(null);
    const requestControllerRef = useRef(null);

    const activeChat = chatHistory.find((chat) => chat.id === currentChatId) || chatHistory[0];
    const filteredHistory = [...chatHistory].sort((firstChat, secondChat) => secondChat.updatedAt - firstChat.updatedAt).filter((chat) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        const haystack = `${chat.title} ${chat.messages.map((message) => message.content).join(" ")}`.toLowerCase();
        return haystack.includes(query);
    });
    const isEmptyChat = messages.length === 0;

    useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("vns-theme", theme); }, [theme]);
    useEffect(() => {
        if (!messagesContainerRef.current || !nearBottomRef.current) return;
        messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: reduce ? "auto" : "smooth",
        });
    }, [messages, reduce]);
    useEffect(() => {
        if (!activeChat) return;
        setMessages(activeChat.messages);
        setProvider(activeChat.provider || "groq");
        setModel(activeChat.model || providerOptions[activeChat.provider || "groq"].models[0]);
    }, [activeChat?.id]);
    useEffect(() => {
        if (!currentChatId) return;
        const currentChat = chatHistory.find((chat) => chat.id === currentChatId);
        if (!currentChat) return;
        const firstUserMessage = messages.find((message) => message.role === "user")?.content;
        const nextHistory = chatHistory.map((chat) => {
            if (chat.id !== currentChatId) return chat;
            const nextTitle = !chat.manualTitle && !hasMeaningfulTitle(chat.title) && firstUserMessage
                ? deriveChatTitle(firstUserMessage)
                : chat.title;
            return { ...chat, title: nextTitle, messages, provider, model, updatedAt: Date.now() };
        });
        setChatHistory(nextHistory);
        if (chatHistoryEnabled) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
    }, [messages, provider, model, currentChatId, chatHistoryEnabled]);
    useEffect(() => {
        localStorage.setItem(PREFERENCES_KEY + "-temperature", String(temperature));
        localStorage.setItem(PREFERENCES_KEY + "-system-prompt", systemPrompt);
        localStorage.setItem(PREFERENCES_KEY + "-history", String(chatHistoryEnabled));
        if (!chatHistoryEnabled) localStorage.removeItem(STORAGE_KEY);
    }, [temperature, systemPrompt, chatHistoryEnabled]);
    useEffect(() => {
        const availableModels = providerOptions[provider].models;
        setModel((currentModel) => (availableModels.includes(currentModel) ? currentModel : availableModels[0]));
    }, [provider]);

    const newChat = () => {
        const nextChat = createChatObject();
        setChatHistory((current) => [nextChat, ...current]);
        setCurrentChatId(nextChat.id);
        setMessages(nextChat.messages);
        setProvider(nextChat.provider);
        setModel(nextChat.model);
        setInput("");
        setSidebarOpen(false);
        if (chatHistoryEnabled) localStorage.setItem(STORAGE_KEY, JSON.stringify([nextChat, ...chatHistory]));
    };

    const selectChat = (chatId) => {
        const selectedChat = chatHistory.find((chat) => chat.id === chatId);
        if (!selectedChat) return;
        setCurrentChatId(chatId);
        setMessages(selectedChat.messages);
        setProvider(selectedChat.provider || "groq");
        setModel(selectedChat.model || providerOptions[selectedChat.provider || "groq"].models[0]);
        setSidebarOpen(false);
    };

    const renameChat = (chatId) => {
        const selectedChat = chatHistory.find((chat) => chat.id === chatId);
        if (!selectedChat) return;
        const nextTitle = window.prompt("Rename chat", selectedChat.title);
        if (nextTitle === null) return;
        const trimmedTitle = nextTitle.trim();
        if (!trimmedTitle) return;

        const updatedHistory = chatHistory.map((chat) =>
            chat.id === chatId ? { ...chat, title: trimmedTitle, manualTitle: true, updatedAt: Date.now() } : chat
        );
        setChatHistory(updatedHistory);
        if (chatHistoryEnabled) localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    };

    const deleteChat = (chatId) => {
        const selectedChat = chatHistory.find((chat) => chat.id === chatId);
        if (!selectedChat) return;
        if (!window.confirm(`Delete "${selectedChat.title}"?`)) return;

        const remainingChats = chatHistory.filter((chat) => chat.id !== chatId);
        if (remainingChats.length === 0) {
            const replacement = createChatObject();
            const nextHistory = [replacement];
            setChatHistory(nextHistory);
            setCurrentChatId(replacement.id);
            setMessages(replacement.messages);
            setProvider(replacement.provider);
            setModel(replacement.model);
            if (chatHistoryEnabled) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
            return;
        }

        const nextCurrent = remainingChats[0];
        setChatHistory(remainingChats);
        setCurrentChatId(nextCurrent.id);
        setMessages(nextCurrent.messages);
        setProvider(nextCurrent.provider || "groq");
        setModel(nextCurrent.model || providerOptions[nextCurrent.provider || "groq"].models[0]);
        if (chatHistoryEnabled) localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingChats));
    };

    const handleAttachmentSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const allowedFileTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        const isImage = allowedImageTypes.includes(file.type);
        const isFile = allowedFileTypes.includes(file.type) || /\.(pdf|docx|txt|csv|xlsx)$/i.test(file.name);

        if (!isImage && !isFile) {
            window.alert("Please upload a supported image or file type: JPG, JPEG, PNG, WEBP, PDF, DOCX, TXT, CSV, or XLSX.");
            event.target.value = "";
            return;
        }

        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        setPendingAttachment({ file, previewUrl, isImage, name: file.name, size: file.size });
        event.target.value = "";
    };

    const removePendingAttachment = () => {
        if (pendingAttachment?.previewUrl) {
            URL.revokeObjectURL(pendingAttachment.previewUrl);
        }
        setPendingAttachment(null);
    };

    const clearDocumentContext = () => {
        setDocumentContext(null);
        setPendingAttachment(null);
    };

    const handleDocumentQuestion = async (questionText) => {
        const trimmedQuestion = questionText.trim();
        if (!documentContext || !trimmedQuestion || !currentChatId || loading) return;

        setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
        setInput("");
        setLoading(true);
        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            const data = await askDocumentQuestion({
                message: trimmedQuestion,
                chatId: currentChatId,
                provider,
                model,
                signal: controller.signal,
            });

            applyBackendTitle(data.title);
            setMessages((current) => [...current, { role: "assistant", content: data.response }]);
        } catch (error) {
            console.error(error);
            if (error.name !== "AbortError") {
                setMessages((current) => [...current, {
                    role: "assistant",
                    content: error.message || "I could not answer that question about the uploaded document.",
                }]);
            }
        } finally {
            requestControllerRef.current = null;
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        const text = input.trim();
        const hasAttachment = !!pendingAttachment;
        const canSendText = text.length > 0 && !loading;
        const canSendAttachment = hasAttachment && !loading;

        if (documentContext && !pendingAttachment && text.length > 0 && !loading) {
            await handleDocumentQuestion(text);
            return;
        }

        if ((!canSendText && !canSendAttachment) || loading) return;

        const history = messages.slice(-20);
        setLoading(true);
        setUploadingAttachment(Boolean(pendingAttachment));
        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            if (pendingAttachment) {
                if (pendingAttachment.isImage) {
                    const data = await sendImageChatMessage({
                        message: text || "Sent an image",
                        provider,
                        model,
                        chatId: currentChatId,
                        image: pendingAttachment.file,
                        signal: controller.signal,
                    });
                    applyBackendTitle(data.title);
                    setMessages((current) => [...current, { role: "user", content: text || "Sent an image" }, { role: "assistant", content: data.response || "Image uploaded successfully." }]);
                    removePendingAttachment();
                    setInput("");
                    return;
                }

                const data = await sendFileChatMessage({
                    message: text || "Sent a file",
                    provider,
                    model,
                    chatId: currentChatId,
                    file: pendingAttachment.file,
                    signal: controller.signal,
                });
                applyBackendTitle(data.title);
                setMessages((current) => [...current, { role: "user", content: text || `Sent file: ${pendingAttachment.name}` }, { role: "assistant", content: data.response || "File uploaded successfully." }]);
                setDocumentContext({
                    name: pendingAttachment.name,
                    size: pendingAttachment.size,
                    type: "document",
                });
                removePendingAttachment();
                setInput("");
                return;
            }

            setMessages((current) => [...current, { role: "user", content: text }]);
            setInput("");
            const data = await sendChatMessage({ message: text, mode, provider, model, history, signal: controller.signal });
            applyBackendTitle(data.title);
            setMessages((current) => [...current, { role: "assistant", content: data.response }]);
        } catch (error) {
            console.error(error);
            if (error.name !== "AbortError") {
                const message = error.message === "The AI service is temporarily unavailable." ? "The backend is online, but its AI provider is unavailable. Check the Render service environment variables and logs." : error.message || "I could not reach the AI server. Check the backend URL and try again.";
                setMessages((current) => [...current, { role: "assistant", content: message }]);
                removePendingAttachment();
            }
        } finally {
            requestControllerRef.current = null;
            setLoading(false);
            setUploadingAttachment(false);
        }
    };

    const stopRequest = () => {
        requestControllerRef.current?.abort();
    };

    const regenerateResponse = async (messageIndex) => {
        if (loading || messages[messageIndex]?.role !== "assistant") return;
        const previousUser = [...messages.slice(0, messageIndex)].reverse().find((message) => message.role === "user");
        if (!previousUser) return;

        const history = messages.slice(0, messageIndex - 1).slice(-20);
        setMessages((current) => current.slice(0, messageIndex));
        setLoading(true);
        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            const data = documentContext
                ? await askDocumentQuestion({ message: previousUser.content, chatId: currentChatId, provider, model, signal: controller.signal })
                : await sendChatMessage({ message: previousUser.content, mode, provider, model, history, signal: controller.signal });
            applyBackendTitle(data.title);
            setMessages((current) => [...current, { role: "assistant", content: data.response }]);
        } catch (error) {
            if (error.name !== "AbortError") {
                setMessages((current) => [...current, { role: "assistant", content: error.message || "I could not regenerate that response." }]);
            }
        } finally {
            requestControllerRef.current = null;
            setLoading(false);
        }
    };

    const handleKeyDown = (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } };
    const copy = async (content) => { await navigator.clipboard?.writeText(content); };
    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        nearBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    };
    const applyBackendTitle = (title) => {
        if (!hasMeaningfulTitle(title)) return;
        setChatHistory((current) => current.map((chat) => chat.id === currentChatId && !chat.manualTitle ? { ...chat, title } : chat));
    };

    const documentCard = documentContext ? (
        <div className="document-context-card">
            <div className="document-context-icon"><FileText size={18} /></div>
            <div className="document-context-meta">
                <strong>{documentContext.name}</strong>
                <small>{documentContext.size ? `${(documentContext.size / 1024).toFixed(1)} KB` : "Document ready"}</small>
            </div>
            <button type="button" className="document-context-close" aria-label="Clear document" onClick={clearDocumentContext}><X size={14} /></button>
        </div>
    ) : null;

    const settingsPanel = settingsOpen ? (
        <div className="settings-backdrop" onClick={() => setSettingsOpen(false)}>
            <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
                <div className="settings-header"><div><span className="provider-label">Workspace preferences</span><h2 id="settings-title">Settings</h2></div><button aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X size={18} /></button></div>
                <div className="settings-grid">
                    <label className="settings-field"><span>AI provider</span><select value={provider} onChange={(event) => setProvider(event.target.value)}>{Object.entries(providerOptions).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}</select></label>
                    <label className="settings-field"><span>Model</span><select value={model} onChange={(event) => setModel(event.target.value)}>{providerOptions[provider].models.map((optionModel) => <option key={optionModel} value={optionModel}>{optionModel}</option>)}</select></label>
                    <label className="settings-field"><span>Temperature <output>{temperature.toFixed(1)}</output></span><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></label>
                    <label className="settings-field settings-field-wide"><span>System prompt</span><textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} placeholder="Optional instructions for the assistant" rows="4" /></label>
                    <label className="settings-field"><span>Theme</span><select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="dark">Dark</option><option value="light">Light</option></select></label>
                    <label className="settings-toggle"><input type="checkbox" checked={chatHistoryEnabled} onChange={(event) => setChatHistoryEnabled(event.target.checked)} /><span><strong>Save chat history</strong><small>Keep conversations in this browser</small></span></label>
                </div>
            </section>
        </div>
    ) : null;

    return <div className="chat-app"><div className="chat-bg-glow" /><div className="floating-bubbles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div>
        <aside className={sidebarOpen ? "chat-sidebar open" : "chat-sidebar"}>
            <div className="sidebar-brand"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>VNS</strong> AGENTIC AI<small>INTELLIGENT AUTOMATION SYSTEMS</small></span><button className="mobile-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
            <button className="new-chat-button" onClick={newChat}><Plus size={17} /> New chat</button>
            <div className="chat-search"><Search size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search conversations" /></div>
            <div className="side-heading">Recent conversations</div>
            <div className="conversation-list">
                {filteredHistory.length === 0 && <div className="conversation-empty">No recent conversations</div>}
                {filteredHistory.map((chat) => (
                    <div key={chat.id} className={chat.id === currentChatId ? "conversation-item active" : "conversation-item"}>
                        <button className="conversation" onClick={() => selectChat(chat.id)}>
                            <span>⌁</span>
                            <span>{chat.title}</span>
                            <small>{new Date(chat.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>
                        </button>
                        <div className="conversation-actions">
                            <button aria-label="Rename conversation" onClick={(event) => { event.stopPropagation(); renameChat(chat.id); }}><PencilLine size={12} /></button>
                            <button aria-label="Delete conversation" onClick={(event) => { event.stopPropagation(); deleteChat(chat.id); }}><Trash2 size={12} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="sidebar-section"><div className="side-heading">Agent personality</div>{modes.map(([id, name, description]) => <button key={id} className={mode === id ? "side-mode selected" : "side-mode"} onClick={() => setMode(id)}><span className={`mode-dot ${id}`} /><span><strong>{name}</strong><small>{description}</small></span>{mode === id && <span className="selected-mark" />}</button>)}</div>
            <div className="sidebar-section">
                <div className="side-heading">AI provider</div>
                <div className="provider-row">
                    {Object.entries(providerOptions).map(([id, option]) => (
                        <button key={id} className={provider === id ? "side-mode provider-mode selected" : "side-mode provider-mode"} onClick={() => setProvider(id)}>
                            <span className="mode-dot" />
                            <span><strong>{option.label}</strong></span>
                            {provider === id && <span className="selected-mark" />}
                        </button>
                    ))}
                </div>
                <div className="provider-model-wrap">
                    <label className="provider-label">Model</label>
                    <select className="provider-select" value={model} onChange={(event) => setModel(event.target.value)}>
                        {providerOptions[provider].models.map((optionModel) => (
                            <option key={optionModel} value={optionModel}>{optionModel}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="sidebar-bottom"><button className="sidebar-control" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light mode" : "Dark mode"}</button><button className="sidebar-control" onClick={() => setSettingsOpen(true)}><Settings size={16} /> Settings</button><div className="profile"><span className="profile-avatar"><User size={15} /></span><span><strong>Guest workspace</strong><small>Local session</small></span><span className="profile-more">•••</span></div></div>
        </aside>
        {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
        {settingsPanel}
        <section className="chat-main"><header className="chat-header"><button className="mobile-menu" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="header-agent"><div className="header-avatar"><AIAvatar state={loading ? "thinking" : "idle"} mode={mode} size={31} /></div><div><strong>VNS Agentic AI</strong><span><i /> {modes.find(([id]) => id === mode)?.[1]} mode</span></div></div><div className="header-actions"><span className="secure-label">Private workspace</span><button aria-label="Clear conversation" onClick={newChat}><Trash2 size={17} /></button></div></header>
            <div ref={messagesContainerRef} className="chat-content" onScroll={handleMessagesScroll}><div className="chat-intro"><div className="intro-logo"><AIAvatar state="idle" mode={mode} size={68} /></div><h1>How can I help you today?</h1><p>Your intelligent automation partner for thinking, creating, and building.</p>{isEmptyChat && <div className="suggestion-grid">{trendingSuggestions.map(([topic, prompt]) => <button key={topic} onClick={() => setInput(prompt)}>{topic}<span>↗</span><small>{prompt}</small></button>)}</div>}</div><div className="message-list">{documentContext && <div className="document-context-shell">{documentCard}</div>}{messages.map((message, index) => <motion.article key={index} className={`chat-message ${message.role}`} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}><div className="message-icon">{message.role === "assistant" ? <AIAvatar state="success" mode={mode} size={34} /> : <span className="user-icon"><User size={16} /></span>}</div><div className="message-body"><div className="message-meta"><strong>{message.role === "assistant" ? "VNS Agentic AI" : "You"}</strong><span>{message.role === "assistant" ? "Just now" : "Sent"}</span></div><div className="message-text">{message.role === "assistant" ? <MarkdownMessage content={message.content} onCopy={copy} /> : message.content}</div>{message.role === "assistant" && <div className="message-tools"><button onClick={() => copy(message.content)}><Copy size={13} /> Copy response</button><button onClick={() => regenerateResponse(index)} disabled={loading}><RotateCcw size={13} /> Regenerate</button></div>}</div></motion.article>)}{loading && <article className="chat-message assistant"><div className="message-icon"><AIAvatar state="thinking" mode={mode} size={34} /></div><div className="message-body"><div className="message-meta"><strong>VNS Agentic AI</strong><span>Thinking</span></div><div className="thinking-line"><i /><i /><i /></div><button className="stop-request" type="button" onClick={stopRequest}><Square size={12} /> Stop</button></div></article>}<div ref={endRef} /></div></div>
            <div className="composer-wrap"><div className="composer"><div className="composer-tools"><input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,.pdf,.docx,.txt,.csv,.xlsx" hidden onChange={handleAttachmentSelect} /><button aria-label="Attach file" onClick={() => fileInputRef.current?.click()} disabled={loading}><Paperclip size={17} /></button></div>{pendingAttachment && (pendingAttachment.isImage ? <div className="image-preview"><img src={pendingAttachment.previewUrl} alt="Preview" /><button className="remove-image" aria-label="Remove image" onClick={removePendingAttachment}><XCircle size={16} /></button></div> : <div className="file-preview"><FileText size={16} /><div className="file-preview-meta"><span>{pendingAttachment.name}</span><small>{(pendingAttachment.size / 1024).toFixed(1)} KB</small></div><button className="remove-image" aria-label="Remove file" onClick={removePendingAttachment}><XCircle size={16} /></button></div>)}{documentContext && !pendingAttachment && <div className="uploaded-document-pill"><FileText size={14} /> <span>{documentContext.name}</span></div>}{documentContext ? <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about this document..." rows="1" /> : <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Message VNS Agentic AI..." rows="1" />}<div className="composer-actions"><button aria-label="Voice input"><Mic size={17} /></button><button className="send-message" aria-label="Send message" onClick={sendMessage} disabled={loading || (!input.trim() && !pendingAttachment && !documentContext)}>{uploadingAttachment ? "..." : <Send size={16} />}</button></div></div><div className="composer-note">{documentContext ? "Document Q&A ready — ask a question about the uploaded file." : uploadingAttachment ? "Uploading attachment..." : "VNS Agentic AI can make mistakes. Check important information."}</div></div>
        </section>
    </div>;
}

export default ChatWorkspace;
