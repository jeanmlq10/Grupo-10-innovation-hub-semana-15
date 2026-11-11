// Equivalente de requests/ui/views/request_sent_page.dart: "¡Solicitud enviada!".
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { PurpleWideButton } from "@/src/features/projects/ui/widgets/wizardBits";

export function RequestSentPage() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 24, paddingTop: 40, paddingRight: 24, paddingBottom: 24, alignItems: "center" }}>
        <View style={{ flex: 1 }} />
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: HomeColors.primaryPurple, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcon name="check" color={Colors.white} size={44} />
        </View>
        <View style={{ height: 24 }} />
        <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>¡Solicitud enviada!</Text>
        <View style={{ height: 10 }} />
        <Text style={{ textAlign: "center", fontSize: 14.5, color: HomeColors.textSecondary, lineHeight: 14.5 * 1.4 }}>
          El creador del proyecto revisará tu solicitud y te notificará su decisión.
        </Text>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: "stretch" }}>
          <PurpleWideButton label="Volver a explorar" onPress={() => Nav.offAllNamed(RouteNames.home)} />
        </View>
      </SafeAreaView>
    </View>
  );
}
