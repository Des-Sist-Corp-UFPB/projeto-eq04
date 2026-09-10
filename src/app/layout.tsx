import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alelib",
  description: "Loja online de e-books",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        {/* Umami — analytics compartilhado da disciplina. Website ID e URL
            não são segredos (ficam visíveis no HTML de qualquer visitante),
            por isso hardcoded aqui em vez de env var. */}
        <script
          defer
          src="https://umami.dsc.rodrigor.com/script.js"
          data-website-id="4626fbaf-adcd-405b-8bb0-f54ebb0a1622"
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-neutral-50 text-neutral-900 antialiased`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}