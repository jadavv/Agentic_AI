import {
    User,
    Copy,
    RefreshCcw,
} from "lucide-react";

import AIAvatar from "./AIAvatar";


export default function ChatMessage({
    message,
    mode,
    onRegenerate,
}) {

    const isAI =
        message.role === "assistant";


    const copyMessage = async () => {

        await navigator.clipboard.writeText(
            message.content
        );

    };


    return (

        <div
            className={
                isAI
                    ? "message-row ai"
                    : "message-row user"
            }
        >

            <div className="message-avatar">

                {isAI ? (
                    <AIAvatar
                        size={38}
                        mode={mode}
                    />
                ) : (
                    <User size={19} />
                )}

            </div>


            <div className="message-content">

                <div className="message-author">

                    {isAI
                        ? "Nova AI"
                        : "You"}

                </div>


                <div className="message-bubble">

                    {message.content}

                </div>


                {isAI && (

                    <div className="message-actions">

                        <button
                            onClick={copyMessage}
                        >
                            <Copy size={14} />
                            Copy
                        </button>


                        <button
                            onClick={onRegenerate}
                        >
                            <RefreshCcw size={14} />
                            Regenerate
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}
