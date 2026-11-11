// Prueba de humo: la app completa arranca (fuentes, DI, navegación, tema) y,
// sin sesión guardada, muestra la Bienvenida igual que la versión Flutter.
import { render, screen } from "@testing-library/react-native";
import React from "react";

import App from "../App";

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

test("arranca y muestra la pantalla de bienvenida", async () => {
  render(<App />);
  expect(await screen.findByText("¡Bienvenido!", {}, { timeout: 10000 })).toBeTruthy();
  expect(screen.getByText("Iniciar sesión")).toBeTruthy();
  expect(screen.getByText("¿No tienes cuenta? Regístrate")).toBeTruthy();
  expect(screen.getByText("Continuar como visitante")).toBeTruthy();
}, 20000);
