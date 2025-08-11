"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

// GraphQL endpoint
const ENV = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
let API = ENV || 'http://localhost:4000/graphql'
if (!/\/graphql$/.test(API)) API = API + '/graphql'

const chartConfig = {
  accounts: {
    label: "Active Accounts",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [rawUsers, setRawUsers] = React.useState<{ id: string; createdAt: string }[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Fetch users once
  React.useEffect(() => {
    let mounted = true
    async function run() {
      try {
        setLoading(true)
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query: `query { users { id createdAt } }` }), cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        if (json.errors) throw new Error(json.errors[0]?.message || 'Failed to load users')
        setRawUsers(json.data.users)
      } catch(e) { if (mounted) setError((e as Error).message) } finally { if (mounted) setLoading(false) }
    }
    run()
    return () => { mounted = false }
  }, [])

  // Build cumulative accounts for selected time range only (ensures always includes today & baseline when 0)
  const filteredData = React.useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const today = new Date()
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))
    const sorted = (rawUsers || []).map(u => new Date(u.createdAt)).sort((a,b)=> a.getTime()-b.getTime())
    // Pointer through users
    let idx = 0
    let cumulative = 0
    const out: { date:string; accounts:number }[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      while (idx < sorted.length && sorted[idx].getTime() <= d.getTime() + 86399999 /* include entire day */) {
        // Only count user once when its calendar day <= current day
        cumulative++
        idx++
      }
      out.push({ date: new Date(d).toISOString().slice(0,10), accounts: cumulative })
    }
    return out
  }, [rawUsers, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Active Accounts</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Cumulative total ({timeRange === '90d' ? '90 days' : timeRange === '30d' ? '30 days' : '7 days'})
          </span>
          <span className="@[540px]/card:hidden">{timeRange === '90d' ? 'Last 90 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 7 days'}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillAccounts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accounts)" stopOpacity={0.9} />
                <stop offset="95%" stopColor="var(--color-accounts)" stopOpacity={0.1} />
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
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              dataKey="accounts"
              width={40}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={(v)=> v.toLocaleString()}
              domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="accounts"
              type="linear"
              fill="url(#fillAccounts)"
              stroke="var(--color-accounts)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              isAnimationActive={true}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
  {!loading && !error && filteredData.length === 0 && <div className="text-xs text-muted-foreground mt-2">No account data{rawUsers && rawUsers.length>0 ? ' in selected range' : ''}</div>}
        {error && <div className="text-destructive text-xs mt-2">{error}</div>}
      </CardContent>
    </Card>
  )
}
