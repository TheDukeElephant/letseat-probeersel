import { UsersClient } from "@/components/users/users-client"

export const metadata = { title: "Users | Let's Eat Admin" }

export default function UsersPage() {
	return (
		<div className="p-6">
			<UsersClient />
		</div>
	)
}
