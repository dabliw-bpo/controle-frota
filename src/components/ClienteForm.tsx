type ClienteFormValues = {
  nome?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
};

export default function ClienteForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: ClienteFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Dados do cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nome / Razão social *">
            <input name="nome" required defaultValue={initial?.nome ?? ""} className="input" />
          </Field>
          <Field label="CNPJ">
            <input name="cnpj" defaultValue={initial?.cnpj ?? ""} className="input" placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Telefone">
            <input name="telefone" defaultValue={initial?.telefone ?? ""} className="input" />
          </Field>
          <Field label="Cidade">
            <input name="cidade" defaultValue={initial?.cidade ?? ""} className="input" />
          </Field>
          <Field label="UF">
            <input name="uf" maxLength={2} defaultValue={initial?.uf ?? ""} className="input uppercase" placeholder="Ex: MT" />
          </Field>
          <Field label="Observações">
            <input name="observacoes" defaultValue={initial?.observacoes ?? ""} className="input" />
          </Field>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-5 py-2.5"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
