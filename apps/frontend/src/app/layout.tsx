import type { Metadata } from "next";
import "./globals.css";
import { PhotoProvider } from "@/context/PhotoContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "CrowdLens",
  description: "Organize your photos into events and visualize them on a world map",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PhotoProvider>
            {children}
          </PhotoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
