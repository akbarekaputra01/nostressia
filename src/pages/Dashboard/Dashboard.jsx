import Navbar from "../../components/Navbar";

function Dashboard() {
  return (
    <>
      <Navbar />

      <div className="p-6">
        <h2 className="text-3xl font-semibold">Dashboard</h2>
        <p className="mt-2 text-gray-600">Selamat datang di Nostressia!</p>
      </div>
    </>
  );
}

export default Dashboard;
