// Layout handled by (dashboard)/layout.tsx

export const metadata = { title: "Let's Eat Admin | Restaurants" }

export default function RestaurantsPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Restaurants</h2>
      <p className="text-sm text-muted-foreground">View and manage restaurants. (Future: real-time updates, status changes, refunds)</p>
    </div>
  )
}
