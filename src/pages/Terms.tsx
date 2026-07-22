import { Link } from "react-router-dom";
export default function Terms() {
  return (
    <div className="container max-w-3xl py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4">Termos de uso</h1>
      <div className="prose prose-invert mt-6 text-muted-foreground space-y-4 text-sm leading-relaxed">
        <p>Ao acessar a plataforma Yakuza Mentor, você declara ser maior de 18 anos e aceita todos os termos aqui descritos.</p>
        <p>O conteúdo é destinado unicamente aos alunos cadastrados pela administração. É expressamente proibido compartilhar, redistribuir, gravar, retransmitir, imprimir ou reproduzir qualquer parte do material.</p>
        <p>O descumprimento destas regras acarretará suspensão imediata do acesso e as medidas legais cabíveis.</p>
      </div>
    </div>
  );
}
