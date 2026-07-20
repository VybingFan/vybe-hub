const firstAvailable = (...values: Array<string | undefined>) =>
  values.find((value) => value?.trim())?.trim() ?? "";

export const appLinks = {
  ios: firstAvailable(import.meta.env.VITE_IOS_APP_URL),
  android: firstAvailable(import.meta.env.VITE_ANDROID_APP_URL),
  deepLink: firstAvailable(import.meta.env.VITE_APP_DEEP_LINK),
};

export function getPreferredAppLink() {
  if (typeof navigator === "undefined") return appLinks.ios || appLinks.android;
  return /android/i.test(navigator.userAgent)
    ? appLinks.android || appLinks.ios
    : appLinks.ios || appLinks.android;
}
