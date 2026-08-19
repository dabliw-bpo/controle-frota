"use client";

import { useState } from "react";
import { formatCpf } from "@/lib/cpf";

export default function CpfInput({
  name = "cpf",
  required = false,
  className = "input",
  defaultValue = "",
}: {
  name?: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(formatCpf(defaultValue));

  return (
    <input
      name={name}
      required={required}
      inputMode="numeric"
      maxLength={14}
      placeholder="000.000.000-00"
      value={value}
      onChange={(e) => setValue(formatCpf(e.target.value))}
      className={className}
    />
  );
}
