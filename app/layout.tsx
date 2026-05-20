import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Precios de Transferencia",
  description: "Plan de trabajo sincronizado con Supabase",
};

const themeScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem('dashboard-theme');
    const cookieTheme = document.cookie.match(/(?:^|; )dashboard-theme=(dark|light)(?:;|$)/)?.[1];
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : cookieTheme || (prefersLight ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
