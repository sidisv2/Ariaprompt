import React from 'react';
import { DeviceType } from '../../hooks/useDeviceType';

interface DeviceSwitcherBadgeProps {
  deviceType: DeviceType;
  forcedDevice: DeviceType | null;
  overrideDevice: (type: DeviceType | null) => void;
  screenWidth: number;
}

/**
 * Debug device switcher badge - hidden by default to preserve production UI
 */
export const DeviceSwitcherBadge: React.FC<DeviceSwitcherBadgeProps> = () => {
  return null;
};

export default DeviceSwitcherBadge;
