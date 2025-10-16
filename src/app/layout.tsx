import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "콘서트 예약 시스템",
  description: "콘서트 예약 및 좌석 선택 시스템",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster />
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
