type MultaFormValues = {
  veiculoId?: string | null;
  motoristaId?: string | null;
  tipo?: string | null;
  data?: string | null;
  descricao?: string | null;
  valor?: number | null;
  descontarMotorista?: boolean;
};

export default function MultaForm({
  action,
  initial,
  veiculos,
  motoristas,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: MultaFormValues;
  veiculos: { id: string; placa: string }[];
  motoristas: { id: string; nome: string }[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Dados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Tipo *">
            <select name="tipo" required defaultValue={initial?.tipo ?? "MULTA"} className="input">
              <option value="MULTA">Multa</option>
              <option value="LICENCIAMENTO">Licenciamento</option>
            </select>
          </Field>
          <Field label="Placa *">
            <select name="veiculoId" required defaultValue={initial?.veiculoId ?? ""} className="input">
              <option value="">— Selecionar —</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Motorista">
            <select name="motoristaId" defaultValue={initial?.motoristaId ?? ""} className="input">
              <option value="">— Nenhum —</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data (infração/vencimento)">
            <input name="data" defaultValue={initial?.data ?? ""} className="input" placeholder="dd/mm/aaaa" />
          </Field>
          <Field label="Valor">
            <input
              name="valor"
              type="number"
              step="0.01"
              defaultValue={initial?.valor ?? ""}
              className="input"
              placeholder="0,00"
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Descrição *">
              <textarea
                name="descricao"
                required
                defaultValue={initial?.descricao ?? ""}
                rows={3}
                className="input"
                placeholder="Ex: Excesso de velocidade na BR-163, km 210"
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="descontarMotorista"
                defaultChecked={initial?.descontarMotorista ?? false}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium text-slate-700">Descontar valor da multa do motorista</span>
            </label>
          </div>
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
