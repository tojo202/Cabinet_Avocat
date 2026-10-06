import { Lottie } from "lottie-react"
import loadingData from "@/assets/Loading.json"

export function LoadingScreen({
  message = "CabinetPro – Chargement de votre session...",
}: {
  message?: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="size-64">
        <Lottie src={loadingData} loop autoplay />
      </div>
      <p className="mt-4 text-lg font-medium text-primary animate-pulse">{message}</p>
    </div>
  )
}
