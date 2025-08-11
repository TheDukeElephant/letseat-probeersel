import { UsersClient } from "@/components/users/users-client"

export const metadata = { title: "Let's Eat Admin | Users" }

export default function UsersPage() {
	return (
		<div className="p-6">
			<UsersClient />
		</div>
	)
}
