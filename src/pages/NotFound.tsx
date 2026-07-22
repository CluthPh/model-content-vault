import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-widest text-primary">Erro 404</p>
        <h1 className="text-5xl font-bold mt-2">Rota não encontrada</h1>
        <p className="text-muted-foreground mt-3">A página que você procura não existe ou foi movida.</p>
        <Link to="/app" className="inline-block mt-6 px-5 py-2 rounded-md gradient-primary btn-glow">Voltar</Link>
      </div>
    </div>
  );
}
