const API_URL = (
    import.meta.env.VITE_API_URL ||
    "https://agentic-ai-chatbot-vbqm.onrender.com"
).replace(/\/+$/, "");

const DEFAULT_PROVIDER = "gemini";
const DEFAULT_MODEL = "gemini-3.6-flash";

const statusMessages = {
    400: "The AI request was invalid. Please check the message and selected model.",
    401: "The AI server rejected the request. Check the backend provider credentials.",
    403: "The AI server refused this request. Check the backend permissions and CORS settings.",
    404: "The AI endpoint was not found. Check the deployed backend URL and route.",
    500: "The AI server encountered an internal error.",
    502: "The AI provider is unavailable right now.",
    503: "The AI server or provider is temporarily unavailable.",
};

const readResponse = async (response) => {
    const raw = await response.text();
    let data = {};
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch (error) {
            if (response.ok) throw new Error("The AI server returned an invalid response.");
            data = { error: raw.slice(0, 240) };
        }
    }

    if (!response.ok) {
        const backendMessage = data.error || data.detail || data.message;
        throw new Error(backendMessage || statusMessages[response.status] || `AI request failed with HTTP ${response.status}.`);
    }

    return data;
};

const request = async (url, options) => {
    try {
        const response = await fetch(url, options);
        return await readResponse(response);
    } catch (error) {
        if (error.name === "AbortError") throw error;
        if (error instanceof TypeError) {
            throw new Error("Unable to connect to the AI server. Check VITE_API_URL, the Render service, and backend CORS settings.");
        }
        throw error;
    }
};

export async function sendChatMessage({
    message,
    mode,
    history,
    provider = DEFAULT_PROVIDER,
    model = DEFAULT_MODEL,
    signal,
}) {
    return request(`${API_URL}/api/chat/`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            signal,
            body: JSON.stringify({
                message,
                mode,
                provider,
                model,
                history,
            }),
        });
}

export async function sendImageChatMessage({
    message,
    provider = DEFAULT_PROVIDER,
    model = DEFAULT_MODEL,
    chatId,
    image,
    signal,
}) {
    if (!image) {
        throw new Error("No image selected");
    }

    const formData = new FormData();
    formData.append("message", message || "Sent an image");
    formData.append("provider", provider);
    formData.append("model", model);
    formData.append("chat_id", chatId || "");
    formData.append("image", image);

    const data = await request(`${API_URL}/api/chat/`, {
        method: "POST",
        signal,
        body: formData,
    });

    return data;
}

export async function sendFileChatMessage({
    message,
    provider = DEFAULT_PROVIDER,
    model = DEFAULT_MODEL,
    chatId,
    file,
    signal,
}) {
    if (!file) {
        throw new Error("No file selected");
    }

    const formData = new FormData();
    formData.append("message", message || "Sent a file");
    formData.append("provider", provider);
    formData.append("model", model);
    formData.append("chat_id", chatId || "");
    formData.append("file", file);
    formData.append("document", file);

    const data = await request(`${API_URL}/api/chat/`, {
        method: "POST",
        signal,
        body: formData,
    });

    return data;
}

export async function askDocumentQuestion({
    message,
    chatId,
    provider = DEFAULT_PROVIDER,
    model = DEFAULT_MODEL,
    signal,
}) {
    if (!message || !chatId) {
        throw new Error("Document question is missing");
    }

    const data = await request(`${API_URL}/api/chat/`, {
        method: "POST",
        signal,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
            question: message,
            chat_id: chatId,
            chatId,
            provider,
            model,
        }),
    });

    return {
        title: data.title,
        response:
            data.response ||
            data.answer ||
            data.message ||
            "I could not answer that question about the document.",
    };
}