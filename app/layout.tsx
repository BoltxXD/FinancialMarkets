import type { Metadata } from "next";
import "./globals.css";
import "./site-experience.css";
export const metadata: Metadata = {title:"Financial Markets Club | Monroe Township High School",description:"Student-led company research, market discussion, and a simulated investment portfolio at Monroe Township High School.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},themeColor:"#f7f7f5"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
