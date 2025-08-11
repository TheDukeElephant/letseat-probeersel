// Layout handled by (dashboard)/layout.tsx
import { GroupsClient } from '@/components/groups/groups-client';

export const metadata = { title: "Let's Eat Admin | Groups" }

export default function GroupsPage() {
  return (
    <div className="p-6">
      <GroupsClient />
    </div>
  )
}
