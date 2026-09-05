import { useEffect, useRef, useState } from "react";
import { Menu, Plus, Search, Settings, Send, Sparkles, Sun, Moon, Trash2, User, Copy, RotateCcw, Paperclip, Mic, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import AIAvatar from "./components/AIAvatar";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const modes = [
    ["normal", "Professional", "Focused answers"],
    ["funny", "Creative", "Fresh perspectives"],
    ["angry", "Direct", "Straight to the point"],
    ["sad", "Mentor", "Patient guidance"],
];

function ChatWorkspace() {
    const reduce = useReducedMotion();
    const [theme, setTheme] = useState(() => localStorage.getItem("vns-theme") || "dark");
    const [mode, setMode] = useState("normal");
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: "assistant", content: "Hello, I’m VNS Agentic AI. What would you like to build, understand, or improve today?" }]);
    const endRef = useRef(null);

    useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("vns-theme", theme); }, [theme]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, [messages, loading, reduce]);

    const newChat = () => { setMessages([{ role: "assistant", content: "New conversation ready. What is on your mind?" }]); setInput(""); setSidebarOpen(false); };
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        const history = messages.slice(-20);
        setMessages((current) => [...current, { role: "user", content: text }]); setInput(""); setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/chat/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, mode, history }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Request failed");
            setMessages((current) => [...current, { role: "assistant", content: data.response }]);
        } catch (error) { console.error(error); setMessages((current) => [...current, { role: "assistant", content: "I could not connect to the AI server. Please check the Django backend and try again." }]); } finally { setLoading(false); }
    };
    const handleKeyDown = (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } };
    const copy = async (content) => { await navigator.clipboard?.writeText(content); };

    return <div className="chat-app"><div className="chat-bg-glow" /><div className="floating-bubbles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div>
        <aside className={sidebarOpen ? "chat-sidebar open" : "chat-sidebar"}>
            <div className="sidebar-brand"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>VNS</strong> AGENTIC AI<small>INTELLIGENT AUTOMATION SYSTEMS</small></span><button className="mobile-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
            <button className="new-chat-button" onClick={newChat}><Plus size={17} /> New chat</button>
            <div className="chat-search"><Search size={15} /><input placeholder="Search conversations" /></div>
            <div className="side-heading">Recent conversations</div>
            <div className="conversation-list"><button className="conversation active"><span>⌁</span><span>Untitled conversation</span><small>Now</small></button><button className="conversation"><span>⌁</span><span>Product launch ideas</span><small>Yesterday</small></button><button className="conversation"><span>⌁</span><span>React dashboard plan</span><small>Aug 28</small></button></div>
            <div className="sidebar-section"><div className="side-heading">Agent personality</div>{modes.map(([id, name, description]) => <button key={id} className={mode === id ? "side-mode selected" : "side-mode"} onClick={() => setMode(id)}><span className={`mode-dot ${id}`} /><span><strong>{name}</strong><small>{description}</small></span>{mode === id && <span className="selected-mark" />}</button>)}</div>
            <div className="sidebar-bottom"><button className="sidebar-control" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light mode" : "Dark mode"}</button><button className="sidebar-control"><Settings size={16} /> Settings</button><div className="profile"><span className="profile-avatar"><User size={15} /></span><span><strong>Guest workspace</strong><small>Local session</small></span><span className="profile-more">•••</span></div></div>
        </aside>
        {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
        <section className="chat-main"><header className="chat-header"><button className="mobile-menu" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="header-agent"><div className="header-avatar"><AIAvatar state={loading ? "thinking" : "idle"} mode={mode} size={31} /></div><div><strong>VNS Agentic AI</strong><span><i /> {modes.find(([id]) => id === mode)?.[1]} mode</span></div></div><div className="header-actions"><span className="secure-label">Private workspace</span><button aria-label="Clear conversation" onClick={newChat}><Trash2 size={17} /></button></div></header>
            <div className="chat-content"><div className="chat-intro"><div className="intro-logo"><AIAvatar state="idle" mode={mode} size={68} /></div><h1>How can I help you today?</h1><p>Your intelligent automation partner for thinking, creating, and building.</p><div className="suggestion-grid"><button onClick={() => setInput("Help me plan a new product launch")}>Plan a product launch <span>↗</span></button><button onClick={() => setInput("Explain this concept in a simple way")}>Explain a complex idea <span>↗</span></button><button onClick={() => setInput("Review and improve my code")}>Review my code <span>↗</span></button></div></div><div className="message-list">{messages.map((message, index) => <motion.article key={index} className={`chat-message ${message.role}`} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}><div className="message-icon">{message.role === "assistant" ? <AIAvatar state="success" mode={mode} size={34} /> : <span className="user-icon"><User size={16} /></span>}</div><div className="message-body"><div className="message-meta"><strong>{message.role === "assistant" ? "VNS Agentic AI" : "You"}</strong><span>{message.role === "assistant" ? "Just now" : "Sent"}</span></div><div className="message-text">{message.content}</div>{message.role === "assistant" && <div className="message-tools"><button onClick={() => copy(message.content)}><Copy size={13} /> Copy</button><button><RotateCcw size={13} /> Regenerate</button></div>}</div></motion.article>)}{loading && <article className="chat-message assistant"><div className="message-icon"><AIAvatar state="thinking" mode={mode} size={34} /></div><div className="message-body"><div className="message-meta"><strong>VNS Agentic AI</strong><span>Thinking</span></div><div className="thinking-line"><i /><i /><i /></div></div></article>}<div ref={endRef} /></div></div>
            <div className="composer-wrap"><div className="composer"><div className="composer-tools"><button aria-label="Attach file"><Paperclip size={17} /></button></div><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Message VNS Agentic AI..." rows="1" /><div className="composer-actions"><button aria-label="Voice input"><Mic size={17} /></button><button className="send-message" aria-label="Send message" onClick={sendMessage} disabled={loading || !input.trim()}><Send size={16} /></button></div></div><div className="composer-note">VNS Agentic AI can make mistakes. Check important information.</div></div>
        </section>
    </div>;
}

export default ChatWorkspace;
