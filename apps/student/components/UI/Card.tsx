import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  id,
  children, 
  className = '', 
  onClick,
  noPadding = false,
  ...rest
}) => {
  return (
    <div 
      id={id}
      onClick={onClick}
      className={`bg-white rounded-[24px] shadow-sm hover:shadow-md transition-shadow duration-300 ${noPadding ? '' : 'p-5'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
