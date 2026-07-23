import { useEffect, useState } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType() {
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [forcedDevice, setForcedDevice] = useState<DeviceType | null>(() => {
    try {
      return (localStorage.getItem('forcedDevice') as DeviceType) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    function onResize() {
      setScreenWidth(window.innerWidth);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const deviceType: DeviceType = forcedDevice
    ? forcedDevice
    : screenWidth < 768
    ? 'mobile'
    : screenWidth < 1024
    ? 'tablet'
    : 'desktop';

  const isMobile = deviceType === 'mobile' || deviceType === 'tablet';

  function overrideDevice(dt: DeviceType | null) {
    setForcedDevice(dt);
    try {
      if (dt) localStorage.setItem('forcedDevice', dt);
      else localStorage.removeItem('forcedDevice');
    } catch {}
  }

  return { isMobile, deviceType, forcedDevice, overrideDevice, screenWidth };
}

export default useDeviceType;
