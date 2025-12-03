declare global {
  interface Window {
    googlePixelId?: string;
  }
}

export const initGooglePixel = (): void => {
  if (typeof window === 'undefined') return;

  if (window.googlePixelId) {
    return;
  }

  window.googlePixelId = "69305905d511e28dc43ae3fc";

  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("defer", "");
  script.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-google.js");

  document.head.appendChild(script);

  console.log('Google Pixel initialized with ID:', window.googlePixelId);
};
