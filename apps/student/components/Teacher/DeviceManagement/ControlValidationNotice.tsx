import React from "react";
import { ControlToast } from "./ControlToast";

/** 校验失败仅提醒，不关闭或提交底层表单。 */
export const ControlValidationNotice: React.FC<{ message: string; onClose: () => void }> = (props) =>
  <ControlToast {...props} tone="error" />;
