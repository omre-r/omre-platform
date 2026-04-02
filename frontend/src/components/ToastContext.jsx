import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
}

// provider

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const toast = useCallback((message, type = "info", duration = 8000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);

        timers.current[id] = setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
                delete timers.current[id];
            }, 320);
        }, duration);
    }, []);

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current[id]);
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            delete timers.current[id];
        }, 320);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

const TYPE_CONFIG = {
    success: { borderColor: "#7dbd6a",               dotColor: "#7dbd6a" },
    error:   { borderColor: "#c0392b",               dotColor: "#c0392b" },
    info:    { borderColor: "rgba(210,175,140,0.75)", dotColor: "rgba(210,175,140,0.75)" },
};

function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            pointerEvents: "none",
        }}>
            {toasts.map(t => (
                <Toast key={t.id} t={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function Toast({ t, onDismiss }) {
    const { borderColor, dotColor } = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;

    return (
        <div style={{ pointerEvents: "all" }}>
            <div
                className={t.exiting ? "toast-exit" : "toast-enter"}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minWidth: "360px",
                    maxWidth: "480px",
                    padding: "14px 16px",
                    background: "linear-gradient(145deg, #2a0808ee, rgba(14,14,14,0.97))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderLeft: `3px solid ${borderColor}`,
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                }}
            >
                <div style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                }} />

                <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    fontSize: "1.40rem",
                    letterSpacing: "0.3px",
                    color: "#f0ebe6",
                    flex: 1,
                    lineHeight: 1.3,
                }}>
                    {t.message}
                </span>

                <button
                    onClick={() => onDismiss(t.id)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.3)",
                        fontSize: "1.15rem",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                        flexShrink: 0,
                        transition: "color 0.15s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>

            <div style={{
                height: "2px",
                width: "100%",
                background: borderColor,
                opacity: 0.22,
                borderRadius: "0 0 12px 12px",
                animation: "toast-progress 6s linear forwards",
            }} />
        </div>
    );
}
