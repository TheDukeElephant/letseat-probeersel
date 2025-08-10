// Layout handled by (dashboard)/layout.tsx

export const metadata = { title: "Settings | Let's Eat Admin" }

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
      <p className="text-sm text-muted-foreground">Configure platform preferences, billing, and integrations.</p>
    </div>
  )
}
