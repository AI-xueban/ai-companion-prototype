import React from 'react';

/**
 * 兼容旧原型页面的布局包装器。
 * 合并版不保留原型标注工具，因此这里只维持 DOM 与 className，不注入标注交互。
 */
export const Annotatable = ({
  children,
  className = '',
}: {
  annotationId: string;
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

