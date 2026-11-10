// Equivalente de notifications/ui/widgets/quote_box.dart.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";

export function QuoteBox({ text }: { text: string }) {
  return (
    <View style={{ padding: 14, backgroundColor: HomeColors.surfaceGrey, borderRadius: 12 }}>
      <Text style={{ fontSize: 13.5, color: HomeColors.textSecondary, lineHeight: 13.5 * 1.35 }}>{text}</Text>
    </View>
  );
}
