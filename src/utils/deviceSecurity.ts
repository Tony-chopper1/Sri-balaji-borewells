// Sri Balaji Borewells - Device Fingerprint & Security Identifier
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress?: string;
}

const DEVICE_STORAGE_KEY = 'borewell_device_id_v1';

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      id = 'dev-' + crypto.randomUUID();
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'dev-' + Math.random().toString(36).substring(2, 15);
  }
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return {
    deviceId: getOrCreateDeviceId(),
    deviceName: `${browser} on ${os}`,
    browser,
    os,
  };
}
