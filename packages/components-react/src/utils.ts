/**
 * Get the current operating system
 * @returns string
 */
export function getOS() {
  const userAgent = navigator.userAgent;
  let operatingSystem = 'Unknown';

  if (userAgent.indexOf('Win') !== -1) {
    operatingSystem = 'Windows';
  } else if (userAgent.indexOf('Mac') !== -1) {
    operatingSystem = 'MacOS';
  } else if (userAgent.indexOf('Linux') !== -1) {
    operatingSystem = 'Linux';
  } else if (userAgent.indexOf('Android') !== -1) {
    operatingSystem = 'Android';
  } else if (userAgent.indexOf('iOS') !== -1) {
    operatingSystem = 'iOS';
  }

  return operatingSystem;
}
