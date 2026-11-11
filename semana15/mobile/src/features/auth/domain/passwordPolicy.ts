/**
 * La regla de contraseña que Roble exige: "mínimo 8 caracteres, una
 * mayúscula, una minúscula, un número y un símbolo permitido (!, @, #, $, _, -)".
 */
export type PasswordRequirement = {
  id: "length" | "upper" | "lower" | "digit" | "symbol";
  label: string;
  test: (password: string) => boolean;
};

export const PasswordPolicy = {
  minLength: 8,
  allowedSymbols: "!@#$_-",

  /**
   * Los mismos requisitos de `validate`, uno por uno, para mostrarlos como
   * lista de verificación mientras se escribe. No relaja la regla: el
   * registro sigue llamando a `validate` antes de enviar a Roble.
   */
  requirements(): PasswordRequirement[] {
    return [
      { id: "length", label: `Mínimo ${PasswordPolicy.minLength} caracteres`, test: (p) => p.length >= PasswordPolicy.minLength },
      { id: "upper", label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
      { id: "lower", label: "Una letra minúscula", test: (p) => /[a-z]/.test(p) },
      { id: "digit", label: "Un número", test: (p) => /[0-9]/.test(p) },
      {
        id: "symbol",
        label: `Un símbolo: ${PasswordPolicy.allowedSymbols.split("").join(" ")}`,
        test: (p) => p.split("").some((c) => PasswordPolicy.allowedSymbols.includes(c)),
      },
    ];
  },

  validate(password: string): string | null {
    if (password.length < PasswordPolicy.minLength) {
      return `La contrasena debe tener minimo ${PasswordPolicy.minLength} caracteres.`;
    }
    if (!/[A-Z]/.test(password)) return "La contrasena debe incluir una mayuscula.";
    if (!/[a-z]/.test(password)) return "La contrasena debe incluir una minuscula.";
    if (!/[0-9]/.test(password)) return "La contrasena debe incluir un numero.";
    if (!password.split("").some((c) => PasswordPolicy.allowedSymbols.includes(c))) {
      return `La contrasena debe incluir un simbolo: ${PasswordPolicy.allowedSymbols.split("").join(" ")}`;
    }
    return null;
  },
};
