import { Link } from "react-router-dom";
export default function Privacy() {
  return (
    <div className="container max-w-3xl py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4">Política de privacidade</h1>
      <div className="mt-6 text-muted-foreground space-y-4 text-sm leading-relaxed">
        <p>Coletamos apenas os dados necessários para autenticação (nome e e-mail) e para acompanhar o progresso do aluno na mentoria.</p>
        <p>Seus dados não são compartilhados com terceiros e são armazenados em ambiente seguro, com criptografia e controle de acesso.</p>
        <p>Você pode solicitar a exclusão de sua conta a qualquer momento entrando em contato com a administração.</p>
      </div>
    </div>
  );
}
