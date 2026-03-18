import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar"
import { ToastProvider } from "@/lib/toast"
import { ToastContainer } from "@/components/toast-container"

export const metadata: Metadata = {
  title: "Integraseo",
  description: "Gestión de contratos, brigadas, operarios y recordatorios",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Integraseo",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#07105e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
