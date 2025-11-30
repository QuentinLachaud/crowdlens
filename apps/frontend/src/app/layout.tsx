import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrowdLens",
  description: "A web app to share photos from any event",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
