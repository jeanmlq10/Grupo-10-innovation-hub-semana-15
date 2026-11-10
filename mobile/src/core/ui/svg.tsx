// Equivalente de `SvgPicture.string(svg)` de flutter_svg.
import React from "react";
import { SvgXml } from "react-native-svg";

export function SvgString({ xml, width, height }: { xml: string; width: number; height: number }) {
  // Se quitan los comentarios <!-- --> (el parser de react-native-svg no los necesita).
  return <SvgXml xml={xml.replace(/<!--[\s\S]*?-->/g, "")} width={width} height={height} />;
}
