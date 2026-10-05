import type { Config } from "tailwindcss";

// Paleta do design DABLIW (docs/design-para-copiar.md): fundo creme, cartões
// brancos, acento dourado/bronze. As escalas "slate" e "brand" foram
// redefinidas para a paleta quente, de modo que todas as telas existentes
// herdam o novo visual sem trocar classe por classe.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f6f5f2", // fundo da página
          100: "#f1efea", // hover, trilha, item ativo
          200: "#e6e3dc", // borda padrão
          300: "#d0ccc2", // borda de campo/botão
          400: "#9a948a",
          500: "#736d62", // texto terciário
          600: "#57524a", // texto secundário
          700: "#3f3b35",
          800: "#2b2823",
          900: "#1f1d19", // texto
          950: "#141310",
        },
        brand: {
          50: "#f7f2e8",
          100: "#efe5d0",
          200: "#e0cfa8",
          300: "#c9a96e", // dourado claro
          400: "#a8895a",
          500: "#7a6640", // dourado: sobrelinha, foco
          600: "#6e5a35", // destaque: botão principal, links
          700: "#4f4026", // destaque forte: hover
          800: "#3d3120",
          900: "#2b2217",
          950: "#1c160e",
        },
        success: {
          50: "#eef4ec",
          100: "#dae8d6",
          500: "#4f8348",
          600: "#3d6b37",
          700: "#305529",
        },
        danger: {
          50: "#fbefeb",
          100: "#f6dcd4",
          500: "#c4553b",
          600: "#b3432a",
          700: "#8f3420",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        emerald: {
          50: "#eef4ec",
          100: "#dae8d6",
          500: "#4f8348",
          600: "#3d6b37",
          700: "#3d6b37",
        },
        red: {
          50: "#fbefeb",
          100: "#f6dcd4",
          200: "#eec3b7",
          500: "#c4553b",
          600: "#b3432a",
          700: "#8f3420",
        },
      },
      fontFamily: {
        sans: ["Aptos", '"Segoe UI"', "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
