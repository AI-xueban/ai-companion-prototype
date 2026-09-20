export const getPortalRoot = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  // 优先挂载到 app-viewport，确保被设备框裁剪；再退回 modal-root（如果已被放到框内）；最后兜底 body。
  return (
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body
  );
};
