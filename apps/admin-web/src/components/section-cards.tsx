"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type UserLite = { id: string; createdAt: string }

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql").replace(/\/$/, "")

export function SectionCards() {
  const [users, setUsers] = React.useState<UserLite[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isMounted = true
    async function run() {
      try {
        setLoading(true)
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `query UsersLite { users { id createdAt } }` }),
          cache: 'no-store'
        })
        const json = await res.json()
        if (!isMounted) return
        if (json.errors) throw new Error(json.errors[0]?.message || 'Failed to load users')
        setUsers(json.data.users)
      } catch (e: any) {
        if (isMounted) setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    run()
    return () => { isMounted = false }
  }, [])

  const totalUsers = users?.length || 0
  // Monthly growth calculation: compare new users this month vs last month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  let thisMonthNew = 0, lastMonthNew = 0
  if (users) {
    for (const u of users) {
      const d = new Date(u.createdAt)
      if (d >= monthStart) thisMonthNew++
      else if (d >= lastMonthStart && d <= lastMonthEnd) lastMonthNew++
    }
  }
  let growthPct: number | null = null
  if (thisMonthNew === 0 && lastMonthNew === 0) growthPct = 0
  else if (lastMonthNew === 0 && thisMonthNew > 0) growthPct = 100
  else if (lastMonthNew > 0) growthPct = ((thisMonthNew - lastMonthNew) / lastMonthNew) * 100

  const growthUp = (growthPct ?? 0) >= 0
  const growthLabel = growthPct === null ? '—' : `${growthUp ? '+' : ''}${growthPct.toFixed(1)}%`

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {/* Revenue (placeholder static) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">$1,250.00</CardTitle>
          <CardAction>
            <Badge variant="outline"><IconTrendingUp />+12.5%</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Trending up this month <IconTrendingUp className="size-4" /></div>
          <div className="text-muted-foreground">Visitors for the last 6 months</div>
        </CardFooter>
      </Card>
      {/* New Customers (placeholder static) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">1,234</CardTitle>
          <CardAction>
            <Badge variant="outline"><IconTrendingDown />-20%</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Down 20% this period <IconTrendingDown className="size-4" /></div>
          <div className="text-muted-foreground">Acquisition needs attention</div>
        </CardFooter>
      </Card>
      {/* Active Accounts (dynamic) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? '…' : totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {growthUp ? <IconTrendingUp /> : <IconTrendingDown />}
              {loading ? '…' : growthLabel}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                {loading ? 'Calculating…' : growthUp ? 'Strong user retention' : 'User growth slowdown'}
                {growthUp ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
              </div>
              <div className="text-muted-foreground">
                {`New this month: ${thisMonthNew} (last month: ${lastMonthNew})`}
              </div>
            </>
          )}
        </CardFooter>
      </Card>
      {/* Growth Rate (placeholder static) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">4.5%</CardTitle>
          <CardAction>
            <Badge variant="outline"><IconTrendingUp />+4.5%</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Steady performance increase <IconTrendingUp className="size-4" /></div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}
