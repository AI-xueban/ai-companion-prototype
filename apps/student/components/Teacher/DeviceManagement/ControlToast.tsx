import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

export type ControlToastTone = "success" | "error" | "warning" | "info";

export const ControlToast: React.FC<{
  message: string;
  tone: ControlToastTone;
  onClose: () => void;
  duration?: number;
}> = ({ message, tone, onClose, duration = 4500 }) => {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), duration);
    return () => window.clearTimeout(timer);
  }, [message, tone, duration]);
  const Icon = { success: CheckCircle2, error: CircleAlert, warning: TriangleAlert, info: Info }[tone];
  return createPortal(
    <div role={tone === "error" ? "alert" : "status"} className="dc-feedback" data-tone={tone} style={{ zIndex: 10200 }}>
      <Icon size={20} />
      <span>{message}</span>
      <button type="button" aria-label="关闭提示" onClick={onClose}><X size={17} /></button>
    </div>,
    document.body,
  );
};
