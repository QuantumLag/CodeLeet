import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
export const metadata: Metadata = { title: "Codeleet — Programming Practice", description: "Solve coding challenges and track your progress." };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body><Shell>{children}</Shell></body></html>; }
