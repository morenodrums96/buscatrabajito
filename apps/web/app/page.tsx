export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <span className="text-4xl">💼</span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-white leading-tight">
          Encuentra tu próximo empleo en México y LATAM
        </h1>
        <p className="mt-4 text-lg text-blue-200">
          BuscaTrabajito rastrea OCC, LinkedIn, Computrabajo y más — y te avisa
          cuando aparece algo para ti.
        </p>

        {/* Waitlist form */}
        <form className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <input
            type="email"
            placeholder="tu@correo.com"
            className="px-4 py-3 rounded-lg text-gray-900 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Quiero acceso anticipado
          </button>
        </form>
        <p className="mt-3 text-sm text-blue-300">
          Gratis para siempre en plan básico. Sin spam.
        </p>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-center">
        {[
          { icon: "🔔", title: "Alertas en tiempo real", desc: "Vacantes nuevas cada 30 minutos directo a tu correo o WhatsApp" },
          { icon: "📄", title: "CV con IA", desc: "Genera tu CV profesional respondiendo preguntas simples" },
          { icon: "🌎", title: "México y LATAM", desc: "OCC, LinkedIn, Computrabajo, Bumeran, Remotive y más" },
        ].map((f) => (
          <div key={f.title} className="bg-white/10 rounded-xl p-6 text-white">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-2 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-blue-200">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}