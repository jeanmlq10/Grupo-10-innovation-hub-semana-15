// Equivalente de projects/ui/widgets/deadline_picker_field.dart: campo de
// fecha límite ("30 oct 2026" con el icono de calendario). Solo deja elegir
// desde hoy en adelante.
import React from "react";
import { Text } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { showDatePicker } from "@/src/core/ui/datePicker";
import { InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { formatShortDate } from "@/src/core/utils/dateFormat";

export function DeadlinePickerField({
  value,
  onPicked,
  placeholder = "Elegir fecha",
}: {
  value: Date | null;
  onPicked: (d: Date) => void;
  placeholder?: string;
}) {
  const pick = async () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const current = value;
    const picked = await showDatePicker({
      initialDate: current != null && !(current.getTime() < first.getTime()) ? current : first,
      firstDate: first,
      lastDate: new Date(today.getFullYear() + 3, 11, 31),
      helpText: "Fecha límite",
    });
    if (picked != null) onPicked(picked);
  };

  return (
    <InkWell
      onPress={() => void pick()}
      borderRadius={12}
      accessibilityLabel={placeholder}
      style={{
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        paddingHorizontal: 13,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <MaterialIcon name="calendar_month_outlined" color={HomeColors.primaryPurple} size={20} />
      <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, color: value == null ? HomeColors.textSecondary : HomeColors.textPrimary }}>
        {value == null ? placeholder : formatShortDate(value)}
      </Text>
    </InkWell>
  );
}
