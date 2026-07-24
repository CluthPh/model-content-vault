import { Link } from "react-router-dom";
export default function Privacy() {
  return (
    <div className="container max-w-3xl py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar</Link>
      <h1 className="text-3xl font-bold mt-4">Política de privacidade</h1>
      <div className="mt-6 text-muted-foreground space-y-4 text-sm leading-relaxed">
        <p>
          Para analisar pedidos de acesso, tratamos nome, e-mail de contato, data da solicitação,
          status da análise e um identificador irreversível derivado do endereço IP.
        </p>
        <p>
          Contas aprovadas recebem um código exclusivo. O código completo não é armazenado em
          texto legível e não utilizamos a senha do e-mail informado.
        </p>
        <p>
          Supabase é utilizado para banco, autenticação e armazenamento privado. Cloudflare é
          utilizado para hospedagem, proteção anti-bot e entrega segura do site.
        </p>
        <p>
          Pedidos são acessíveis somente pela administração. Você pode solicitar correção ou
          exclusão dos seus dados diretamente à administração da mentoria.
        </p>
      </div>
    </div>
  );
}
