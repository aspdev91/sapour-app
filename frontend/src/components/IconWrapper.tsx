import React from 'react';
import { LucideProps } from 'lucide-react';

interface IconWrapperProps extends LucideProps {
  IconComponent: React.ComponentType<LucideProps>;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ IconComponent, ...props }) => {
  return <IconComponent {...props} />;
};

export default IconWrapper;
