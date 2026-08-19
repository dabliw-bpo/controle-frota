import { getStatusList, getTipoList } from "@/lib/settings";

type VeiculoFormValues = {
  placa?: string | null;
  status?: string | null;
  empresaNome?: string | null;
  docCnpj?: string | null;
  numeroPatrimonio?: string | null;
  carroceria?: string | null;
  fabricacaoAno?: string | null;
  marcaModeloVersao?: string | null;
  renavam?: string | null;
  chassi?: string | null;
  cor?: string | null;
  valor?: number | null;
  motorista?: string | null;
  rastreador?: string | null;
  antt?: string | null;
  notaFiscal?: string | null;
  rotaAtual?: string | null;
  produtoAtual?: string | null;
  ocorrencias?: string | null;
  observacoes?: string | null;
};

export default async function VeiculoForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: VeiculoFormValues;
  submitLabel: string;
}) {
  const [statusList, tipoList] = await Promise.all([getStatusList(), getTipoList()]);

  return (
    <form action={action} className="space-y-6">
      <Section title="Identificação">
        <Field label="Placa *">
          <input
            name="placa"
            required
            defaultValue={initial?.placa ?? ""}
            className="input uppercase"
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={initial?.status ?? "ATIVO"} className="input">
            {statusList.map((s) => (
              <option key={s.chave} value={s.chave}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo">
          <input
            name="carroceria"
            list="tipos-veiculo"
            defaultValue={initial?.carroceria ?? ""}
            className="input"
          />
          <datalist id="tipos-veiculo">
            {tipoList.map((t) => (
              <option key={t.id} value={t.nome} />
            ))}
          </datalist>
        </Field>
        <Field label="Marca / Modelo / Versão">
          <input
            name="marcaModeloVersao"
            defaultValue={initial?.marcaModeloVersao ?? ""}
            className="input"
          />
        </Field>
        <Field label="Ano fabricação">
          <input name="fabricacaoAno" defaultValue={initial?.fabricacaoAno ?? ""} className="input" />
        </Field>
        <Field label="Cor">
          <input name="cor" defaultValue={initial?.cor ?? ""} className="input" />
        </Field>
        <Field label="Valor (R$)">
          <input
            name="valor"
            type="number"
            step="0.01"
            defaultValue={initial?.valor ?? ""}
            className="input"
          />
        </Field>
        <Field label="Nº patrimônio">
          <input
            name="numeroPatrimonio"
            defaultValue={initial?.numeroPatrimonio ?? ""}
            className="input"
          />
        </Field>
      </Section>

      <Section title="Documentação">
        <Field label="Renavam">
          <input name="renavam" defaultValue={initial?.renavam ?? ""} className="input" />
        </Field>
        <Field label="Chassi">
          <input name="chassi" defaultValue={initial?.chassi ?? ""} className="input" />
        </Field>
        <Field label="ANTT">
          <input name="antt" defaultValue={initial?.antt ?? ""} className="input" />
        </Field>
        <Field label="Nota fiscal">
          <input name="notaFiscal" defaultValue={initial?.notaFiscal ?? ""} className="input" />
        </Field>
        <Field label="Rastreador">
          <input name="rastreador" defaultValue={initial?.rastreador ?? ""} className="input" />
        </Field>
      </Section>

      <Section title="Empresa responsável">
        <Field label="Empresa / Responsável">
          <input name="empresaNome" defaultValue={initial?.empresaNome ?? ""} className="input" />
        </Field>
        <Field label="CNPJ">
          <input name="docCnpj" defaultValue={initial?.docCnpj ?? ""} className="input" />
        </Field>
      </Section>

      <Section title="Operação atual">
        <Field label="Motorista">
          <input name="motorista" defaultValue={initial?.motorista ?? ""} className="input" />
        </Field>
        <Field label="Rota atual">
          <input name="rotaAtual" defaultValue={initial?.rotaAtual ?? ""} className="input" />
        </Field>
        <Field label="Produto">
          <input name="produtoAtual" defaultValue={initial?.produtoAtual ?? ""} className="input" />
        </Field>
        <Field label="Ocorrências" full>
          <textarea
            name="ocorrencias"
            defaultValue={initial?.ocorrencias ?? ""}
            className="input"
            rows={2}
          />
        </Field>
        <Field label="Observações" full>
          <textarea
            name="observacoes"
            defaultValue={initial?.observacoes ?? ""}
            className="input"
            rows={2}
          />
        </Field>
      </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="block font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
