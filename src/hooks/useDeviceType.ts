import { useState, useEffect } from 'react';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  screenWidth: number;
  overrideDevice?: (type: DeviceType | null) => void;
  forcedDevice: DeviceType | null;
}

export function useDeviceType(mobileBreakpoint = 768, tabletBreakpoint = 1024): DeviceInfo {
  const [forcedDevice, setForcedDevice] = useState<DeviceType | null>(() => {
    try {
      const saved = localStorage.getItem('aria_forced_device');
      return (saved as DeviceType) || null;
    } catch {
      return null;
    }
  });

  const getDeviceInfo = (forced: DeviceType | null) => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: true, deviceType: 'desktop' as DeviceType, screenWidth: 1200 };
    }

    const width = window.innerWidth;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(ua);

    if (forced) {
      return {
        isMobile: forced === 'mobile',
        isTablet: forced === 'tablet',
        isDesktop: forced === 'desktop',
        deviceType: forced,
        screenWidth: width,
      };
    }

    const isMobile = width < mobileBreakpoint || (isMobileUA && width < tabletBreakpoint);
    const isTablet = (width >= mobileBreakpoint && width < tabletBreakpoint) || isTabletUA;
    const isDesktop = !isMobile && !isTablet;

    const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'mobile' : 'desktop'; // Mobile and Tablet share the touch-optimized mobile experience or tablet view

    return {
      isMobile: isMobile || isTablet, // Group mobile and tablet as touch/app experience
      isTablet,
      isDesktop: !isMobile && !isTablet,
      deviceType: (isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop') as DeviceType,
      screenWidth: width,
    };
  };

  const [deviceInfo, setDeviceInfo] = useState(() => getDeviceInfo(forcedDevice));

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo(forcedDevice));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [forcedDevice, mobileBreakpoint, tabletBreakpoint]);

  const overrideDevice = (type: DeviceType | null) => {
    setForcedDevice(type);
    if (type) {
      localStorage.setItem('aria_forced_device', type);
    } else {
      localStorage.removeItem('aria_forced_device');
    }
    setDeviceInfo(getDeviceInfo(type));
  };

  return {
    ...deviceInfo,
    overrideDevice,
    forcedDevice,
  };
}
