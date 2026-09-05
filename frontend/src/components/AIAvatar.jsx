import { motion } from "framer-motion";

export default function AIAvatar({ state = "idle", mode = "normal", size = 60 }) {
    return <motion.div className={`ai-avatar ${state} mode-${mode}`} style={{ width: size, height: size }} animate={{ y: state === "idle" ? [0, -4, 0] : 0, scale: state === "generating" ? [1, 1.04, 1] : 1 }} transition={{ duration: 2, repeat: state === "idle" ? Infinity : 0, ease: "easeInOut" }} aria-label={`VNS Agentic AI ${state}`} role="img"><div className="ai-face"><div className="ai-eyes"><span className="eye" /><span className="eye" /></div><motion.div className="ai-mouth" animate={{ scaleX: mode === "funny" ? 1.25 : 1 }} /></div></motion.div>;
}
