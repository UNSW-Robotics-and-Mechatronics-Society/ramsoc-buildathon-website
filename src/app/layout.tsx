import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./styles.css";

export const metadata: Metadata = {
  title: {
    default: "Buildathon 2026 | UNSW RAMSoc",
    template: "%s | Buildathon 2026",
  },
  description:
    "A six-week mechatronics hackathon run by UNSW RAMSoc. Build a team of 2-6, get a kit, and bring a brief to life.",
  openGraph: {
    title: "Buildathon 2026 | UNSW RAMSoc",
    description:
      "A six-week mechatronics hackathon run by UNSW RAMSoc. Build a team of 2-6, get a kit, and bring a brief to life.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#ffcf00",
          colorPrimaryForeground: "#0a2a55",
          colorBackground: "#08376f",
          colorForeground: "#eaf1ff",
          colorMutedForeground: "#a9c2e8",
          colorInput: "#0a3d88",
          colorInputForeground: "#eaf1ff",
          colorBorder: "rgba(255,255,255,0.16)",
          borderRadius: "0.5rem",
        },
      }}
    >
      <html lang="en">
        <body className="font-main">{children}</body>
      </html>
    </ClerkProvider>
  );
}
