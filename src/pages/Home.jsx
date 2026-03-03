function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-2">
          Welcome 👋
        </h2>
        <p className="text-gray-600">
          {user?.fullName || user?.username}
        </p>
      </div>
    </div>
  );
}

export default Home;
