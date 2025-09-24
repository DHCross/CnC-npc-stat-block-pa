/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle font loading in environments without internet access
  env: {
    NEXT_FONT_GOOGLE_MOCKED_RESPONSES: JSON.stringify([
      {
        url: "https://fonts.googleapis.com/css2",
        css: "/* Fallback CSS for offline builds */"
      }
    ])
  },
};

export default nextConfig;