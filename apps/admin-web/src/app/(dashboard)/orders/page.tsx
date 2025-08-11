// Layout handled by (dashboard)/layout.tsx

export const metadata = { title: "Let's Eat Admin | Orders" }

export default function OrdersPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
      <p className="text-sm text-muted-foreground">View and manage incoming orders. (Future: real-time updates, status changes, refunds)</p>
    </div>
  )
}
