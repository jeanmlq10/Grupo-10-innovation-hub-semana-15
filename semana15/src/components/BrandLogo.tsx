import Image from "next/image";

export function BrandLogo({ variant = "full", className = "" }: { variant?: "full" | "symbol"; className?: string }) {
  const symbol = variant === "symbol";
  return <span className={`brand-logo ${className}`}>
    <Image src={symbol ? "/brand/logo-symbol.png" : "/brand/logo-proyectate.png"} width={symbol ? 359 : 1113} height={symbol ? 473 : 477} alt={symbol ? "Símbolo de Proyéctate" : "Proyéctate"} priority />
  </span>;
}
