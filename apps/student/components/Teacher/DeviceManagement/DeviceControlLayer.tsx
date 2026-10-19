import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

let activeLayers = 0;
let originalOverflow = "";
const focusableSelector =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]';

/** 管控页专用弹层：轻量过渡、焦点约束和嵌套层级。 */
export const DeviceControlLayer: React.FC<{
  labelId: string;
  onClose: () => void;
  variant?: "drawer" | "dialog";
  size?: "normal" | "wide";
  level?: number;
  children: (close: () => void) => React.ReactNode;
}> = ({
  labelId,
  onClose,
  variant = "drawer",
  size = "normal",
  level = 0,
  children,
}) => {
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const callback = useRef(onClose);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  callback.current = onClose;
  const close = useCallback(() => {
    if (timer.current) return;
    setClosing(true);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    timer.current = setTimeout(
      () => callback.current(),
      reduceMotion ? 0 : 170,
    );
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    if (activeLayers++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const frame = requestAnimationFrame(() => {
      const target =
        panel.current?.querySelector<HTMLElement>("[data-autofocus]");
      (target ?? panel.current)?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timer.current) clearTimeout(timer.current);
      if (--activeLayers === 0) document.body.style.overflow = originalOverflow;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const top = [...document.querySelectorAll<HTMLElement>(".dc-overlay")]
        .sort((a, b) => Number(a.dataset.level) - Number(b.dataset.level))
        .pop();
      if (!panel.current || top?.contains(panel.current) !== true) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const targets = [
        ...panel.current.querySelectorAll<HTMLElement>(focusableSelector),
      ].filter((el) => el.getClientRects().length > 0);
      if (!targets.length) {
        event.preventDefault();
        panel.current.focus();
        return;
      }
      const first = targets[0],
        last = targets[targets.length - 1],
        current = document.activeElement;
      if (event.shiftKey && (current === first || current === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (current === last || !panel.current.contains(current))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [close]);

  return createPortal(
    <div
      className="dc-overlay"
      data-variant={variant}
      data-size={size}
      data-level={level}
      data-closing={closing}
      style={{ zIndex: 10000 + level * 10 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className="dc-panel"
        onClick={(event) => event.stopPropagation()}
      >
        {children(close)}
      </div>
    </div>,
    document.body,
  );
};
