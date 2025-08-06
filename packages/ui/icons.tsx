import React from 'react';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

/**
 * A shared wrapper component for Font Awesome icons.
 * This allows consistent usage of icons across all apps.
 */
export const Icon: React.FC<FontAwesomeIconProps> = (props) => {
  return <FontAwesomeIcon {...props} />;
};