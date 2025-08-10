import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ChartOrders } from "@/components/chart-orders"
import { SectionCards } from "@/components/section-cards"

export const metadata = {
  title: "Overview | Let's Eat Admin",
}

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6 space-y-6">
        <ChartOrders />
        <ChartAreaInteractive />
      </div>
    </div>
  )
}
