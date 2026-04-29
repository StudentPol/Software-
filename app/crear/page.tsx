export default function CrearSala() {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            ← Volver
          </a>
          <h2 className="text-2xl font-medium mb-8">Crear sala</h2>
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Tu nombre</label>
              <input
                type="text"
                placeholder="Ej: Laia"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">¿Qué estáis buscando?</label>
              <input
                type="text"
                placeholder="Ej: algo barato y sin gluten para 5 personas"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Zona</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option>Gràcia</option>
                <option>Eixample</option>
                <option>Barceloneta</option>
                <option>Poblenou</option>
                <option>Sant Pere</option>
              </select>
            </div>
            <button className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity mt-2">
              Crear sala y buscar restaurantes
            </button>
          </div>
        </div>
      </main>
    )
  }