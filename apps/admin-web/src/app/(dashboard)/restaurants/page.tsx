// Layout handled by (dashboard)/layout.tsx
import { RestaurantsClient } from '@/components/restaurants/restaurants-client';

export const metadata = { title: "Let's Eat Admin | Restaurants" }

export default function RestaurantsPage() {
  return (
    <div className="p-6">
      <RestaurantsClient />
    </div>
  )
}
