function Menu() {
  const token = localStorage.getItem("token");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bienvenido al SIGPH</h1>
      {token ? (
        <p className="mt-2">Sesión iniciada correctamente ✅</p>
      ) : (
        <p className="mt-2 text-red-500">No tienes sesión activa</p>
      )}
    </div>
  );
}

export default Menu;
