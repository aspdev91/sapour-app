import React from 'react';
import { LucideProps } from 'lucide-react';

interface IconWrapperProps extends LucideProps {
  IconComponent: any; // Simplified for React 19 compatibility
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ IconComponent, ...props }) => {
  return <IconComponent {...props} />;
};

export default IconWrapper;
