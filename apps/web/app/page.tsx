import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col p-6 shadow-lg">
        <div className="text-3xl font-extrabold mb-10 text-center">letseat</div>
        <nav className="flex flex-col space-y-3">
          <a href="#" className="p-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-md">Dashboard</a>
          <a href="#" className="p-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-md">Menu</a>
          <a href="#" className="p-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-md">Orders</a>
          <a href="#" className="p-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-md">History</a>
        </nav>
        <div className="mt-auto pt-6 border-t border-blue-500">
          <a href="#" className="p-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-md">Settings</a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Orders Section */}
        <section className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg overflow-y-auto max-h-[calc(100vh-120px)]">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Orders</h2>
          <ul className="space-y-4 text-gray-700">
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12345 - $25.50</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12346 - $30.00</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12347 - $15.75</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12348 - $42.00</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12349 - $19.99</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12350 - $55.20</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12351 - $10.50</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12352 - $34.80</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12353 - $28.10</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12354 - $50.00</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12355 - $12.30</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12356 - $75.60</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12357 - $22.00</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12358 - $31.40</li>
            <li className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200">Order #12359 - $18.75</li>
          </ul>
        </section>

        <div className="md:col-span-2 flex flex-col gap-10">
          {/* Analytics Section */}
          <section className="bg-teal-700 text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center flex-1">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4 w-full text-center">Analytics</h2>
            {/* Placeholder for graph */}
            <div className="w-full h-64 border-2 border-white border-dashed flex items-center justify-center text-gray-300 text-lg">
              Graph Placeholder
            </div>
          </section>

          {/* Total Earnings Section */}
          <section className="bg-blue-700 text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center flex-1">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4 w-full text-center">Total Earnings</h2>
            {/* Placeholder for total earnings */}
            <div className="text-4xl font-extrabold">$12,345.67</div>
          </section>
        </div>
      </main>
    </div>
  );
}
