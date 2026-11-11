// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // El React Compiler NO está activado en este proyecto: los controladores
    // migrados de GetX son objetos mutables que avisan a la UI con
    // useSyncExternalStore (src/core/state/Controller.ts), un patrón que el
    // compilador no puede memorizar con seguridad. Estas reglas sólo validan
    // código para el compilador (incluso marcan el patrón oficial
    // `useRef(new Animated.Value(0)).current`), así que se desactivan.
    // rules-of-hooks y exhaustive-deps siguen activas.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
    },
  },
]);
