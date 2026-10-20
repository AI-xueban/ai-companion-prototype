import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, X } from "lucide-react";

/** 校验失败仅提醒，不关闭或提交底层表单。 */
export const ControlValidationNotice: React.FC<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);
  return createPortal(
    <div role="alert" className="dc-feedback" data-tone="error" style={{ zIndex: 10200 }}>
      <CircleAlert size={17} />
      <span>{message}</span>
      <button type="button" aria-label="关闭提示" onClick={onClose}><X size={16} /></button>
    </div>,
    document.body,
  );
};
