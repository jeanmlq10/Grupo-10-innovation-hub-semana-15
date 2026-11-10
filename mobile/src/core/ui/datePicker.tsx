// Equivalente de `showDatePicker(...)` de Flutter (calendario en español).
// - Android: el diálogo de calendario nativo de Material.
// - iOS: el calendario nativo dentro de un diálogo con "Cancelar"/"Aceptar".
// - Web: un <input type="date"> dentro del mismo diálogo.
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import React, { createElement, useState } from "react";
import { Platform, Text, View } from "react-native";

import { Nav } from "../navigation/Nav";
import { M3 } from "../theme/appTheme";
import { TextButton } from "./material";
import { Overlay } from "./overlay";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function DateDialog({
  initial,
  first,
  last,
  helpText,
}: {
  initial: Date;
  first: Date;
  last: Date;
  helpText: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <View
      style={{
        backgroundColor: M3.elevation.level3,
        borderRadius: 28,
        marginHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        alignSelf: "center",
        maxWidth: 360,
        width: "90%",
      }}
    >
      <Text style={{ paddingHorizontal: 24, fontSize: 14, fontWeight: "500", color: M3.onSurfaceVariant }}>{helpText}</Text>
      <View style={{ paddingHorizontal: 8, paddingVertical: 8, alignItems: "center" }}>
        {Platform.OS === "web" ? (
          createElement("input", {
            type: "date",
            value: iso(value),
            min: iso(first),
            max: iso(last),
            onChange: (e: { target: { value: string } }) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              if (y && m && d) setValue(new Date(y, m - 1, d));
            },
            style: { fontSize: 18, padding: 8, borderRadius: 8, border: "1px solid #ccc" },
          })
        ) : (
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            locale="es-ES"
            minimumDate={first}
            maximumDate={last}
            accentColor={M3.primary}
            onChange={(_, d) => d && setValue(d)}
          />
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 12, gap: 8 }}>
        <TextButton label="Cancelar" onPress={() => Nav.back(null)} />
        <TextButton label="Aceptar" onPress={() => Nav.back(new Date(value.getFullYear(), value.getMonth(), value.getDate()))} />
      </View>
    </View>
  );
}

export async function showDatePicker({
  initialDate,
  firstDate,
  lastDate,
  helpText = "Seleccionar fecha",
}: {
  initialDate: Date;
  firstDate: Date;
  lastDate: Date;
  helpText?: string;
}): Promise<Date | null> {
  if (Platform.OS === "android") {
    return new Promise((resolve) => {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        minimumDate: firstDate,
        maximumDate: lastDate,
        title: helpText,
        positiveButton: { label: "Aceptar" },
        negativeButton: { label: "Cancelar" },
        onChange: (event, date) => {
          if (event.type === "set" && date) resolve(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
          else resolve(null);
        },
      });
    });
  }
  const picked = await Overlay.dialog<Date | null>(() => (
    <DateDialog initial={initialDate} first={firstDate} last={lastDate} helpText={helpText} />
  ));
  return picked ?? null;
}
