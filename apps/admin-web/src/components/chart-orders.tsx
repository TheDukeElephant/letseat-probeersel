"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Mock order totals per day (web/app channels)
const ordersData = [
  { date: "2024-06-01", web: 120, app: 80 },
  { date: "2024-06-02", web: 150, app: 95 },
  { date: "2024-06-03", web: 90, app: 70 },
  { date: "2024-06-04", web: 180, app: 110 },
  { date: "2024-06-05", web: 210, app: 140 },
  { date: "2024-06-06", web: 190, app: 130 },
  { date: "2024-06-07", web: 230, app: 160 },
  { date: "2024-06-08", web: 170, app: 125 },
  { date: "2024-06-09", web: 260, app: 180 },
  { date: "2024-06-10", web: 200, app: 150 },
  { date: "2024-06-11", web: 240, app: 175 },
  { date: "2024-06-12", web: 255, app: 185 },
  { date: "2024-06-13", web: 230, app: 160 },
  { date: "2024-06-14", web: 280, app: 190 },
  { date: "2024-06-15", web: 300, app: 205 },
  { date: "2024-06-16", web: 275, app: 195 },
  { date: "2024-06-17", web: 320, app: 220 },
  { date: "2024-06-18", web: 310, app: 210 },
  { date: "2024-06-19", web: 295, app: 205 },
  { date: "2024-06-20", web: 340, app: 230 },
  { date: "2024-06-21", web: 360, app: 250 },
  { date: "2024-06-22", web: 330, app: 235 },
  { date: "2024-06-23", web: 345, app: 245 },
  { date: "2024-06-24", web: 355, app: 255 },
  { date: "2024-06-25", web: 365, app: 265 },
  { date: "2024-06-26", web: 340, app: 250 },
  { date: "2024-06-27", web: 370, app: 270 },
  { date: "2024-06-28", web: 390, app: 285 },
  { date: "2024-06-29", web: 410, app: 300 },
  { date: "2024-06-30", web: 430, app: 315 },
]

const ordersChartConfig = {
  orders: { label: "Orders" },
  web: { label: "Web", color: "var(--primary)" },
  app: { label: "App", color: "var(--primary)" },
} satisfies ChartConfig

export function ChartOrders() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const filtered = React.useMemo(() => {
    const referenceDate = new Date("2024-06-30")
    let days = 30
    if (timeRange === "7d") days = 7
    if (timeRange === "90d") days = 90
    const start = new Date(referenceDate)
    start.setDate(start.getDate() - days)
    return ordersData.filter(d => new Date(d.date) >= start)
  }, [timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Orders</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Platform order volume</span>
          <span className="@[540px]/card:hidden">Orders</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 90 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-36 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={ordersChartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id="fillWeb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-web)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--color-web)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillApp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-app)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-app)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value as string)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value as string).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="app"
              type="natural"
              fill="url(#fillApp)"
              stroke="var(--color-app)"
              stackId="a"
            />
            <Area
              dataKey="web"
              type="natural"
              fill="url(#fillWeb)"
              stroke="var(--color-web)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
