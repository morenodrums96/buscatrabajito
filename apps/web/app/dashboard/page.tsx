import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <span className="text-5xl">🎉</span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">¡Ya estás dentro!</h1>
        <p className="mt-2 text-gray-500">
          Estamos buscando vacantes para ti. Te avisamos en cuanto encontremos algo.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
          Tu perfil está activo — revisamos nuevas vacantes cada 30 minutos.
        </div>
      </div>
    </main>
  );
}
