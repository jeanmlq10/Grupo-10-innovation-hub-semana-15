// Equivalente de auth/ui/views/what_to_do_page.dart: "¿Qué quieres hacer?",
// se muestra una vez después de crear la cuenta, encima de Home.
import React from "react";
import { Text, View } from "react-native";

import { Nav } from "@/src/core/navigation/Nav";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { SvgString } from "@/src/core/ui/svg";

import { FlowScreenBody, Spacer } from "../widgets/authFormWidgets";
import { Brand, Palette } from "@/src/core/theme/brand";

const LIGHT_BULB = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
<g stroke="${Brand.violet}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M18.5 32.5C15 30 12.5 26.3 12.5 22C12.5 15.6 17.6 10.5 24 10.5C30.4 10.5 35.5 15.6 35.5 22C35.5 26.3 33 30 29.5 32.5V36H18.5V32.5Z"/>
<path d="M19.5 40H28.5M21.5 44H26.5"/>
<path d="M24 2.5V5.5M11 7.5L13.2 9.7M37 7.5L34.8 9.7M5.5 31L8.2 29.8M42.5 31L39.8 29.8"/>
</g>
</svg>
`;

function IconSlot({ children, background }: { children: React.ReactNode; background?: string }) {
  return (
    <View style={{ width: 74, height: 74, backgroundColor: background, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
      {children}
    </View>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onTap,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onTap: () => void;
}) {
  return (
    <View style={[{ borderRadius: 12 }, boxShadow({ color: withAlpha(Palette.shadow, 0.06), blur: 14, dy: 4 })]}>
      <InkWell
        onPress={onTap}
        borderRadius={12}
        style={{
          backgroundColor: Colors.white,
          borderRadius: 12,
          borderWidth: 1.2,
          borderColor: HomeColors.flowBorder,
          paddingLeft: 14,
          paddingTop: 20,
          paddingRight: 16,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {icon}
        <View style={{ width: 18 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: HomeColors.flowNavy }}>{title}</Text>
          <View style={{ height: 6 }} />
          <Text style={{ fontSize: 15.5, color: HomeColors.flowSlate, lineHeight: 15.5 * 1.35 }}>{description}</Text>
        </View>
      </InkWell>
    </View>
  );
}

export function WhatToDoPage() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <FlowScreenBody horizontalFraction={0.058}>
        <View style={{ height: 24 }} />
        <Spacer flex={10} />
        <Text style={{ textAlign: "center", fontSize: 22.5, fontWeight: "800", color: HomeColors.flowNavy, letterSpacing: -0.3 }}>
          ¿Qué quieres hacer?
        </Text>
        <View style={{ height: 8 }} />
        <Text style={{ textAlign: "center", fontSize: 16, color: HomeColors.flowSlate }}>Elige por dónde empezar</Text>
        <View style={{ height: 30 }} />
        <ChoiceCard
          icon={
            <IconSlot background={HomeColors.flowLavenderFaint}>
              <SvgString xml={LIGHT_BULB} width={46} height={46} />
            </IconSlot>
          }
          title="Publicar una idea"
          description={"Comparte tu idea\ncon otros."}
          onTap={() => void Nav.off("CreateProject")}
        />
        <View style={{ height: 18 }} />
        <ChoiceCard
          icon={
            <IconSlot>
              <MaterialIcon name="explore_outlined" size={50} color={HomeColors.flowAccent} />
            </IconSlot>
          }
          title="Explorar proyectos"
          description={"Descubre proyectos\ny únete a ellos."}
          onTap={() => Nav.back()}
        />
        <View style={{ height: 32 }} />
        <Spacer flex={5} />
        <Text style={{ textAlign: "center", fontSize: 14.5, color: HomeColors.flowFootnote, lineHeight: 14.5 * 1.4 }}>
          {"Podrás cambiar esto más adelante\ndesde el menú principal."}
        </Text>
        <View style={{ height: 24 }} />
        <Spacer flex={4} />
      </FlowScreenBody>
    </View>
  );
}
