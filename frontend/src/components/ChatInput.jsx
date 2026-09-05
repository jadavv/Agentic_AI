import {
    Send,
    Sparkles,
} from "lucide-react";


export default function ChatInput({
    value,
    setValue,
    onSend,
    loading,
}) {

    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            onSend();

        }

    };


    return (

        <div className="input-wrapper">

            <div className="chat-input">

                <button
                    className="prompt-button"
                    title="Improve Prompt"
                >
                    <Sparkles size={18} />
                </button>


                <textarea
                    value={value}
                    onChange={(event) =>
                        setValue(
                            event.target.value
                        )
                    }

                    onKeyDown={handleKeyDown}

                    placeholder="Message Nova AI..."
                    rows={1}
                    disabled={loading}
                />


                <button
                    className="send-button"
                    onClick={onSend}
                    disabled={
                        loading ||
                        !value.trim()
                    }
                >
                    <Send size={18} />
                </button>

            </div>


            <p>
                Enter to send • Shift + Enter
                for new line
            </p>

        </div>
    );
}