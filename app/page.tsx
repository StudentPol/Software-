export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium mb-3">Planify</h1>
        <p className="text-muted-foreground text-lg">
          Encuentra el restaurante perfecto para tu grupo
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        
          <a href="/plan/crear"
          className="flex items-center gap-4 p-5 rounded-xl border border-border hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">+</div>
          <div>
            <p className="font-medium">Crear sala</p>
            <p className="text-sm text-muted-foreground">Elige preferencias y comparte el código</p>
          </div>
        </a>
        
          <a href="/unirse"
          className="flex items-center gap-4 p-5 rounded-xl border border-border hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl">#</div>
          <div>
            <p className="font-medium">Unirme a sala</p>
            <p className="text-sm text-muted-foreground">Ingresa el código que te compartieron</p>
          </div>
        </a>
      </div>
    </main>
  )
}