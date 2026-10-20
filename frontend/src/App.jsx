import { Outlet, useLoaderData } from "react-router";
import Navbar from "./components/Navbar";

function App() {
  const user = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
