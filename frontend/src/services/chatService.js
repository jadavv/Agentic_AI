const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://agentic-ai-chatbot-vbqm.onrender.com";

const DEFAULT_PROVIDER = "groq";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export async function sendChatMessage({
    message,
    mode,
    history,
    provider = DEFAULT_PROVIDER,
    model = DEFAULT_MODEL,
    signal,
}) {
    const response = await fetch(
        `${API_URL}/api/chat/`,
        {
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

    const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        signal,
        body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Image upload failed");
    }

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

    const response = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        signal,
        body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "File upload failed");
    }

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

    const response = await fetch(`${API_URL}/api/chat/`, {
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Document Q&A failed");
    }

    return {
        title: data.title,
        response:
            data.response ||
            data.answer ||
            data.message ||
            "I could not answer that question about the document.",
    };
}