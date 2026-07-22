import { Link } from "react-router-dom";
export default function AdultNotice() {
  return (
    <div className="container max-w-3xl py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4">Aviso adulto (+18)</h1>
      <div className="mt-6 text-muted-foreground space-y-4 text-sm leading-relaxed">
        <p>Esta plataforma contém material educacional restrito e sensível. É proibida a permanência de menores de 18 anos.</p>
        <p>Ao continuar, você declara estar em conformidade com a legislação vigente e assume total responsabilidade pelo acesso.</p>
      </div>
    </div>
  );
}
