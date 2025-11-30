module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Allow unescaped quotes and apostrophes in JSX text
    "react/no-unescaped-entities": "off",
    // Allow <img> tags (we use blob URLs which next/image doesn't support well)
    "@next/next/no-img-element": "off",
  },
};
