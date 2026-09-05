const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://agentic-ai-chatbot-vbqm.onrender.com";


export async function sendChatMessage({
    message,
    mode,
    history,
}) {
    const response = await fetch(
        `${API_URL}/api/chat/`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                message,
                mode,
                history,
            }),
        }
    );


    const data = await response.json();


    if (!response.ok) {
        throw new Error(
            data.error || "AI request failed"
        );
    }


    return data;
}