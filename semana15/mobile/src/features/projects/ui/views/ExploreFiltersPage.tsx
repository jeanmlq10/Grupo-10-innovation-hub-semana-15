// Equivalente de projects/ui/views/explore_filters_page.dart: "Filtros".
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { FilledButton, IconButton, OutlinedButton } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { ExploreFilters } from "../../domain/models/exploreFilters";
import { HomeController } from "../viewmodels/homeController";
import {
  CREATION_DATE_ORDER,
  ExploreFilterLabels,
  MEMBER_AVAILABILITY_ORDER,
  ROLE_ORDER,
  TASK_AVAILABILITY_ORDER,
} from "../widgets/exploreFilterLabels";
import { FilterOptionChip } from "../widgets/FilterOptionChip";

function Section({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <View style={{ paddingBottom: 22 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "700", color: HomeColors.flowNavy }}>{title}</Text>
        <MaterialIcon name={icon} color={HomeColors.flowPurple} size={20} />
      </View>
      <View style={{ height: 10 }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  );
}

export function ExploreFiltersPage() {
  const di = useDI();
  const [controller] = useState(() => di.resolve<HomeController>(TOKENS.HomeController));
  const [draft, setDraft] = useState<ExploreFilters>(controller.filters.value);

  const apply = () => {
    controller.applyFilters(draft);
    Nav.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingLeft: 20, paddingTop: 14, paddingRight: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: "800", color: HomeColors.flowNavy }}>Filtros</Text>
          <IconButton icon="close" tooltip="Cerrar" color={HomeColors.flowNavy} onPress={() => Nav.back()} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 20 }}>
          <Section title="Fecha de creación" icon="calendar_month_outlined">
            {CREATION_DATE_ORDER.map((option) => (
              <FilterOptionChip
                key={option}
                label={ExploreFilterLabels.creationDate[option]}
                selected={draft.creationDate === option}
                onTap={() => setDraft(draft.copyWith({ creationDate: option }))}
              />
            ))}
          </Section>
          <Section title="Disponibilidad de tareas" icon="check_box_outlined">
            {TASK_AVAILABILITY_ORDER.map((option) => (
              <FilterOptionChip
                key={option}
                label={ExploreFilterLabels.taskAvailability[option]}
                selected={draft.taskAvailability === option}
                onTap={() => setDraft(draft.copyWith({ taskAvailability: option }))}
              />
            ))}
          </Section>
          <Section title="Disponibilidad de miembros" icon="group_outlined">
            {MEMBER_AVAILABILITY_ORDER.map((option) => (
              <FilterOptionChip
                key={option}
                label={ExploreFilterLabels.memberAvailability[option]}
                selected={draft.memberAvailability === option}
                onTap={() => setDraft(draft.copyWith({ memberAvailability: option }))}
              />
            ))}
          </Section>
          <Section title="Rol del proyecto" icon="manage_accounts_outlined">
            <FilterOptionChip label="Todos" selected={draft.roles.size === 0} onTap={() => setDraft(draft.copyWith({ roles: new Set() }))} />
            {ROLE_ORDER.map((role) => (
              <FilterOptionChip
                key={role}
                label={ExploreFilterLabels.roles[role]}
                selected={draft.roles.has(role)}
                onTap={() => setDraft(draft.toggleRole(role))}
              />
            ))}
          </Section>
        </ScrollView>
        <View style={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20, paddingBottom: 16 }}>
          <FilledButton
            label="Aplicar filtros"
            onPress={apply}
            backgroundColor={HomeColors.flowPurple}
            foregroundColor={Colors.white}
            borderRadius={10}
            height={50}
            style={{ height: 50 }}
            textStyle={{ fontSize: 15, fontWeight: "700" }}
          />
          <View style={{ height: 10 }} />
          <OutlinedButton
            label="Limpiar filtros"
            onPress={() => setDraft(ExploreFilters.none)}
            foregroundColor={HomeColors.flowPurple}
            backgroundColor={HomeColors.flowLavenderFaint}
            borderColor={HomeColors.flowBorder}
            borderRadius={10}
            height={50}
            style={{ height: 50 }}
            textStyle={{ fontSize: 15, fontWeight: "600" }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
