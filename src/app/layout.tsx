import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/components/shared/AppLogo";
import { DynamicFavicon } from "@/components/shared/DynamicFavicon";

// Font Awesome CSS CDN
const fontAwesomeCdn = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Tamu BKAD - Sistem Pelayanan Tamu Digital",
  description: "E-Tamu Badan Keuangan dan Aset Daerah Kabupaten Seruyan - Sistem Pelayanan Tamu Digital",
  keywords: ["E-Tamu", "BKAD", "Buku Tamu", "Kabupaten Seruyan", "Pemerintah", "Digital"],
  authors: [{ name: "BKAD Kabupaten Seruyan" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href={fontAwesomeCdn}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <DynamicFavicon />
            {children}
            <Toaster richColors position="top-right" />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
