// Layout handled by (dashboard)/layout.tsx

export const metadata = { title: "Let's Eat Admin | Orders" }

import { OrdersClient } from '@/components/orders/orders-client';

export default function OrdersPage() { return <div className="p-6"><OrdersClient /></div>; }
