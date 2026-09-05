import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Check, ChevronDown, Code2, Copy, Database, FileText, Globe2, Lightbulb, Menu, Moon, Play, Search, Send, Sparkles, Sun, Terminal, WandSparkles, X } from "lucide-react";
import AIAvatar from "./components/AIAvatar";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "https://agentic-ai-chatbot-vbqm.onrender.com";
const modes = [
    { id: "normal", name: "Professional", icon: BrainCircuit },
    { id: "funny", name: "Creative", icon: Sparkles },
    { id: "angry", name: "Direct", icon: Terminal },
    { id: "sad", name: "Mentor", icon: Lightbulb },
];
const capabilities = [
    ["01", "Coding", "Ship clean interfaces, APIs, and automations.", Code2],
    ["02", "Research", "Turn scattered signals into useful direction.", Search],
    ["03", "Learning", "Understand hard topics at your own pace.", Lightbulb],
    ["04", "Writing", "Find the sharpest version of your point of view.", FileText],
    ["05", "Analysis", "See patterns hiding in your data.", Database],
    ["06", "Automation", "Move from idea to repeatable workflow.", WandSparkles],
];
const tools = [["Web search", "Find the signal", Globe2], ["Code runner", "Build and debug", Code2], ["Data analysis", "Make it legible", Database], ["Documents", "Work from context", FileText]];
const reveal = (reduce, delay = 0) => ({ initial: reduce ? false : { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: reduce ? 0 : 0.7, delay } });

function Button({ children, secondary = false, href, onClick, className = "" }) {
    return <a className={`button ${secondary ? "button-secondary" : ""} ${className}`} href={href} onClick={onClick}>{children}</a>;
}
function SectionLabel({ number, children }) { return <div className="section-label"><span>{number}</span>{children}</div>; }

function App() {
    const reduce = useReducedMotion();
    const [theme, setTheme] = useState(() => localStorage.getItem("nova-theme") || "dark");
    const [menuOpen, setMenuOpen] = useState(false);
    const [mode, setMode] = useState("normal");
    const [prompt, setPrompt] = useState("Build me a website");
    const [generated, setGenerated] = useState(false);
    const [copied, setCopied] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([{ role: "assistant", content: "Hello. I am VNS Agentic AI, your thinking partner. What are we building today?" }]);
    const chatEnd = useRef(null);
    useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("nova-theme", theme); }, [theme]);
    useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, [messages, loading, reduce]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        const history = messages.slice(-20);
        setMessages((current) => [...current, { role: "user", content: text }]); setInput(""); setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/chat/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, mode, history }) });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(response.status >= 500 ? "The AI service is temporarily unavailable." : (data.error || "Request failed"));
            }
            setMessages((current) => [...current, { role: "assistant", content: data.response }]);
        } catch (error) { console.error(error); setMessages((current) => [...current, { role: "assistant", content: error.message === "The AI service is temporarily unavailable." ? "The backend is online, but its AI provider is unavailable. Check the Render service environment variables and logs." : "I could not reach the AI server. Check the backend URL and try again." }]); } finally { setLoading(false); }
    };
    const handlePrompt = (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } };
    const copyPrompt = async () => { await navigator.clipboard?.writeText(generated ? "You are a senior product designer. Build a responsive website for a focused audience. Include clear structure, a refined visual system, mobile behavior, and an accessible output format." : prompt); setCopied(true); setTimeout(() => setCopied(false), 1600); };

    return <div className="site-shell"><div className="grain" />
        <header className="navbar"><a className="brand" href="#home" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Sparkles size={15} /></span><span className="brand-copy"><strong>VNS</strong> AGENTIC AI<small>INTELLIGENT AUTOMATION SYSTEMS</small></span></a><button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><nav className={menuOpen ? "nav-links open" : "nav-links"}>{["home", "features", "studio", "chat", "tools", "future"].map((item) => <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)}>{item}</a>)}</nav><div className="nav-actions"><button className="theme-button" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><a className="login-link" href="#chat">Log in</a><Button href="#chat">Start chat <ArrowUpRight size={15} /></Button></div></header>
        <main>
            <section className="hero scene" id="home"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-copy"><motion.div {...reveal(reduce)} className="eyebrow"><span className="live-dot" /> AI SYSTEM / ONLINE</motion.div><motion.h1 {...reveal(reduce, .1)}>The interface<br /><em>for thinking.</em></motion.h1><motion.p {...reveal(reduce, .2)}>Meet an AI agent that turns curiosity into momentum. Think clearly, create boldly, and build what comes next.</motion.p><motion.div {...reveal(reduce, .3)} className="hero-actions"><Button href="#chat">Start conversation <ArrowUpRight size={16} /></Button><a className="text-link" href="#features">Explore the system <ChevronDown size={15} /></a></motion.div></div><motion.div {...reveal(reduce, .2)} className="hero-agent"><div className="agent-halo" /><AIAvatar state="happy" mode={mode} size={214} /><div className="agent-caption"><span>Nova / 01</span><span>Always ready</span></div></motion.div><div className="hero-meta"><span>Scroll to enter</span><span>01 — 12</span></div></section>
            <section className="awakening scene" id="agent"><div className="awakening-orb"><AIAvatar state="listening" mode={mode} size={150} /></div><div><SectionLabel number="02">The agent awakens</SectionLabel><h2>Always<br /><em>ready.</em></h2><p className="section-copy">A calm, capable presence for the moments when the blank page feels too loud. Nova listens first, then moves with you.</p><div className="status-line"><span className="live-dot" /> LISTENING / RESPONSE LATENCY 42MS</div></div></section>
            <section className="intelligence scene" id="features"><div className="section-intro"><SectionLabel number="03">Intelligence, on demand</SectionLabel><h2>One agent.<br /><em>Infinite possibilities.</em></h2></div><div className="capability-grid">{capabilities.map(([number, title, text, Icon], index) => <motion.article key={title} {...reveal(reduce, index * .06)} className="capability-card"><span className="card-number">{number}</span><Icon size={22} /><h3>{title}</h3><p>{text}</p><ArrowUpRight className="card-arrow" size={17} /></motion.article>)}</div></section>
            <section className="chat-scene scene" id="chat"><div className="section-intro"><SectionLabel number="04">Conversation, in motion</SectionLabel><h2>Bring the<br /><em>big idea.</em></h2><p className="section-copy">No prompt gymnastics. Just a thoughtful conversation with an agent that can follow the thread.</p></div><div className="chat-window"><div className="chat-window-bar"><span className="window-dots"><i /><i /><i /></span><span className="chat-brand"><span className="brand-mark"><Sparkles size={11} /></span> VNS AGENTIC AI</span><span className="window-online"><span className="live-dot" /> online</span></div><div className="chat-messages">{messages.map((message, index) => <motion.div key={index} {...reveal(reduce, index * .04)} className={`chat-bubble ${message.role}`}><span className="bubble-label">{message.role === "assistant" ? "VNS AGENTIC AI" : "YOU"}</span>{message.content}</motion.div>)}{loading && <div className="chat-bubble assistant"><span className="bubble-label">VNS AGENTIC AI / THINKING</span><span className="typing"><i /><i /><i /></span></div>}<div ref={chatEnd} /></div><div className="chat-composer"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handlePrompt} placeholder="Ask VNS Agentic AI anything..." rows="1" /><button aria-label="Send message" onClick={sendMessage} disabled={loading || !input.trim()}><Send size={17} /></button></div></div></section>
            <section className="studio scene" id="studio"><div className="studio-copy"><SectionLabel number="05">Prompt studio</SectionLabel><h2>Your ideas,<br /><em>engineered.</em></h2><p className="section-copy">Turn a rough thought into a prompt with the context, constraints, and clarity to make it useful.</p><div className="quality"><span>Prompt quality</span><strong>{generated ? "82" : "46"}<small>/100</small></strong><div className="quality-bar"><i style={{ width: generated ? "82%" : "46%" }} /></div></div></div><div className="prompt-card"><div className="prompt-top"><span>Prompt / Untitled</span><span className="saved">● autosaved</span></div><label htmlFor="prompt">Your starting point</label><textarea id="prompt" value={prompt} onChange={(event) => { setPrompt(event.target.value); setGenerated(false); }} /><div className="prompt-tags"><span>ROLE</span><span>TASK</span><span>CONTEXT</span><span>OUTPUT</span></div>{generated && <motion.div {...reveal(reduce)} className="generated-prompt">You are a senior product designer. Build a responsive website for a focused audience. Include a clear content hierarchy, a refined visual system, mobile behavior, and an accessible output format.</motion.div>}<div className="prompt-actions"><button onClick={() => setGenerated(true)}><WandSparkles size={15} /> {generated ? "Prompt improved" : "Improve prompt"}</button><button onClick={copyPrompt} className="icon-action" aria-label="Copy prompt">{copied ? <Check size={15} /> : <Copy size={15} />}</button></div></div></section>
            <section className="personality scene"><div className="personality-visual"><AIAvatar state="happy" mode={mode} size={180} /><span className="personality-pulse" /></div><div><SectionLabel number="06">A point of view</SectionLabel><h2>Choose how<br />you <em>think.</em></h2><div className="mode-switcher">{modes.map(({ id, name, icon: Icon }) => <button key={id} className={mode === id ? "selected" : ""} onClick={() => setMode(id)}><Icon size={15} />{name}</button>)}</div><p className="section-copy">{modes.find((item) => item.id === mode)?.name} mode is tuned to match your moment. Same intelligence, a different rhythm.</p></div></section>
            <section className="memory scene"><div className="memory-copy"><SectionLabel number="07">A longer memory</SectionLabel><h2>Your conversations.<br /><em>remembered.</em></h2><p className="section-copy">Ideas get better when they have somewhere to live. Pick up the thread across projects, research, and the in-between.</p></div><div className="memory-map"><div className="memory-line" />{["TODAY", "PROJECTS", "RESEARCH", "SAVED PROMPTS"].map((label, index) => <motion.div key={label} {...reveal(reduce, index * .1)} className={`memory-node node-${index}`}><span>{label}</span><strong>{index === 0 ? "A new direction" : index === 1 ? "Landing page system" : index === 2 ? "Market signals" : "Launch checklist"}</strong></motion.div>)}</div></section>
            <section className="tools scene" id="tools"><div className="section-intro"><SectionLabel number="08">Tools, in one place</SectionLabel><h2>One agent.<br /><em>many tools.</em></h2></div><div className="tools-grid">{tools.map(([title, text, Icon], index) => <motion.div key={title} {...reveal(reduce, index * .08)} className="tool-card"><Icon size={20} /><span>{title}</span><small>{text}</small><ArrowUpRight size={15} /></motion.div>)}</div></section>
            <section className="human scene"><div className="human-quote"><SectionLabel number="09">Human + AI</SectionLabel><h2>Technology should<br /><em>feel human.</em></h2><p>Not just answers.<br /><strong>Better thinking.</strong></p></div><div className="human-agent"><AIAvatar state="happy" mode={mode} size={112} /><div className="signal signal-one">I see where you're going.</div><div className="signal signal-two">Let's make it clearer.</div></div></section>
            <section className="builder scene"><div><SectionLabel number="10">Builder mode</SectionLabel><h2>From thought<br />to <em>shipped.</em></h2><p className="section-copy">A practical partner for the work behind the work. Explore, explain, refactor, and release.</p><Button href="#chat">Build with AI <ArrowUpRight size={16} /></Button></div><div className="code-window"><div className="code-header"><span><i /><i /><i /></span><small>nova_agent.py</small><span><Play size={14} /></span></div><pre><code><span className="code-muted">01</span> <span className="code-key">agent</span> = Nova(<span className="code-string">"builder"</span>){"\n"}<span className="code-muted">02</span> <span className="code-key">context</span> = await agent.listen(idea){"\n"}<span className="code-muted">03</span> <span className="code-key">plan</span> = agent.think(context){"\n"}<span className="code-muted">04</span> <span className="code-key">result</span> = await agent.build(plan){"\n"}<span className="code-muted">05</span> <span className="code-comment">// ship something remarkable</span></code></pre><div className="code-footer"><span><Check size={13} /> Ready</span><span>React · Python · APIs</span></div></div></section>
            <section className="future scene" id="future"><div className="future-orb"><AIAvatar state="idle" mode={mode} size={90} /></div><SectionLabel number="11">The next chapter</SectionLabel><h2>The future of work<br />is <em>collaborative.</em></h2><div className="future-notes"><span>Think faster.</span><span>Create better.</span><span>Build more.</span><span>Learn continuously.</span></div></section>
            <section className="final scene"><div className="final-agent"><div className="agent-halo" /><AIAvatar state="happy" mode={mode} size={180} /></div><SectionLabel number="12">Your turn</SectionLabel><h2>Ready to meet<br />your <em>AI agent?</em></h2><div className="hero-actions"><Button href="#chat">Start chatting <ArrowUpRight size={16} /></Button><a className="text-link" href="#home">Explore VNS AI <ArrowUpRight size={15} /></a></div><footer><span className="brand"><span className="brand-mark"><Sparkles size={13} /></span><span className="brand-copy"><strong>VNS</strong> AGENTIC AI<small>INTELLIGENT AUTOMATION SYSTEMS</small></span></span><span>Your intelligent AI companion.</span><span>© 2026 VNS Systems</span></footer></section>
        </main>
    </div>;
}
export default App;
