// Equivalente de projects/ui/views/team_needed_page.dart: "Equipo necesario" (2/4).
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { IconName } from "@/src/core/ui/MaterialIcon";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { DeadlinePickerField } from "../widgets/DeadlinePickerField";
import { TeamRoleTile } from "../widgets/TeamRoleTile";
import { GreyTextField, WizardHeader, WizardTitle } from "../widgets/wizardBits";
import { WizardNavButtons } from "../widgets/WizardNavButtons";
import { Palette } from "@/src/core/theme/brand";

const ROLES: { role: string; subtitle: string; icon: IconName; background: string; iconColor: string }[] = [
  { role: "Desarrollador/a", subtitle: "Se encarga del desarrollo técnico", icon: "code", background: Palette.violetTint, iconColor: Palette.secondary },
  { role: "Diseñador/a", subtitle: "Apoya con la parte visual", icon: "palette_outlined", background: Palette.cyanTint, iconColor: Palette.primary },
  { role: "Investigador/a", subtitle: "Busca y analiza información", icon: "search", background: Palette.limeTint, iconColor: Palette.primary },
  { role: "Comunicador/a", subtitle: "Maneja la difusión del proyecto", icon: "campaign_outlined", background: Palette.violetTint, iconColor: Palette.primary },
  { role: "Líder de proyecto", subtitle: "Coordina el equipo", icon: "person_outline", background: Palette.limeTint, iconColor: Palette.secondary },
  { role: "Otro", subtitle: "Especifica el rol", icon: "more_horiz", background: Palette.surfaceMuted, iconColor: Palette.textMuted },
];

export function TeamNeededPage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  const [otherRole, setOtherRole] = useState(controller.otherRoleName.value);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <WizardHeader step={2} />
        <View style={{ height: 20 }} />
        <WizardTitle title="Equipo necesario" subtitle="¿Qué miembros necesitas?" />
        <View style={{ height: 20 }} />
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {ROLES.map((role) => (
            <React.Fragment key={role.role}>
              <TeamRoleTile
                icon={role.icon}
                iconBackground={role.background}
                iconColor={role.iconColor}
                title={role.role}
                subtitle={role.subtitle}
                count={controller.roleCount(role.role)}
                onIncrement={() => controller.incrementRole(role.role)}
                onDecrement={() => controller.decrementRole(role.role)}
              />
              {role.role === "Otro" && controller.roleCount("Otro") > 0 ? (
                <View style={{ paddingBottom: 12, paddingLeft: 4, paddingRight: 4 }}>
                  <Text style={{ fontWeight: "600", fontSize: 13.5, color: HomeColors.textPrimary }}>¿Qué rol necesitas?</Text>
                  <View style={{ height: 8 }} />
                  <GreyTextField
                    value={otherRole}
                    onChangeText={(v) => {
                      setOtherRole(v);
                      controller.setOtherRoleName(v);
                    }}
                    hint="Especifica el rol"
                  />
                </View>
              ) : null}
            </React.Fragment>
          ))}
          <View style={{ height: 8 }} />
          <Text style={{ fontSize: 15, fontWeight: "bold", color: HomeColors.textPrimary }}>Fecha límite para postularse al equipo</Text>
          <View style={{ height: 8 }} />
          <DeadlinePickerField value={controller.teamDeadline.value} onPicked={(d) => controller.setTeamDeadline(d)} />
          <View style={{ height: 12 }} />
        </ScrollView>
        <View style={{ height: 8 }} />
        <WizardNavButtons onBack={() => Nav.back()} onNext={() => void Nav.to("TaskInfo")} />
      </SafeAreaView>
    </View>
  );
}
