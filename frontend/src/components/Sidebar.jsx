import {
    Plus,
    Search,
    Settings,
    LogOut,
} from "lucide-react";

import AIAvatar from "./AIAvatar";


const modes = [
    ["normal", "Professional", "🧠"],
    ["funny", "Funny", "😂"],
    ["angry", "Angry", "😡"],
    ["sad", "Sad", "😢"],
];


export default function Sidebar({
    mode,
    setMode,
    clearChat,
}) {

    return (

        <aside className="sidebar">

            <div className="brand">

                <AIAvatar
                    size={44}
                    mode={mode}
                />

                <div>
                    <strong>Nova AI</strong>
                    <small>AI Agent</small>
                </div>

            </div>


            <button
                className="new-chat"
                onClick={clearChat}
            >
                <Plus size={18} />
                New Chat
            </button>


            <div className="search-box">

                <Search size={16} />

                <input
                    placeholder="Search chats..."
                />

            </div>


            <p className="section-title">
                AI PERSONALITY
            </p>


            <div className="mode-list">

                {modes.map(
                    ([id, name, emoji]) => (

                        <button
                            key={id}
                            className={
                                mode === id
                                    ? "mode active"
                                    : "mode"
                            }

                            onClick={() =>
                                setMode(id)
                            }
                        >

                            <span>
                                {emoji}
                            </span>

                            {name}

                        </button>

                    )
                )}

            </div>


            <div className="sidebar-bottom">

                <button className="sidebar-item">
                    <Settings size={17} />
                    Settings
                </button>


                <button className="sidebar-item">
                    <LogOut size={17} />
                    Logout
                </button>

            </div>

        </aside>
    );
}
