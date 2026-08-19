import { getCargoList, getTipoMotoristaList } from "@/lib/settings";

type MotoristaFormValues = {
  nome?: string | null;
  sexo?: string | null;
  cadastro?: string | null;
  admissao?: string | null;
  cpf?: string | null;
  cargo?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  pix?: string | null;
  placa?: string | null;
};

export default async function MotoristaForm({
  action,
  initial,
  placas,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: MotoristaFormValues;
  placas: string[];
  submitLabel: string;
}) {
  const [cargoList, tipoMotoristaList] = await Promise.all([getCargoList(), getTipoMotoristaList()]);

  return (
    <form action={action} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Dados do motorista</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nome *">
            <input name="nome" required defaultValue={initial?.nome ?? ""} className="input" />
          </Field>
          <Field label="CPF">
            <input name="cpf" defaultValue={initial?.cpf ?? ""} className="input" placeholder="000.000.000-00" />
          </Field>
          <Field label="Sexo">
            <select name="sexo" defaultValue={initial?.sexo ?? ""} className="input">
              <option value="">—</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </select>
          </Field>
          <Field label="Cargo">
            <input name="cargo" list="cargos-motorista" defaultValue={initial?.cargo ?? ""} className="input" />
            <datalist id="cargos-motorista">
              {cargoList.map((c) => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
          </Field>
          <Field label="Tipo de cadastro">
            <select name="cadastro" defaultValue={initial?.cadastro ?? ""} className="input">
              <option value="">—</option>
              {tipoMotoristaList.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Admissão">
            <input name="admissao" defaultValue={initial?.admissao ?? ""} className="input" placeholder="dd/mm/aaaa" />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" defaultValue={initial?.email ?? ""} className="input" />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsapp" defaultValue={initial?.whatsapp ?? ""} className="input" />
          </Field>
          <Field label="PIX">
            <input name="pix" defaultValue={initial?.pix ?? ""} className="input" />
          </Field>
          <Field label="Placa vinculada (CAVALO)">
            <input
              name="placa"
              list="placas-frota"
              defaultValue={initial?.placa ?? ""}
              className="input uppercase"
              placeholder="Ex: SPD1B38"
            />
            <datalist id="placas-frota">
              {placas.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
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
