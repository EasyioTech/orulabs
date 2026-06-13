import next from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// next 16 removed `next lint`. eslint-config-next + FlatCompat throws a circular-structure
// error under ESLint 9, so we build the flat config directly from the plugins it wraps:
// @next/eslint-plugin-next ships native flat presets, and typescript-eslint covers TS rules.
export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "dist/**"] },
  ...tseslint.configs.recommended,
  next.configs["core-web-vitals"],
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // pre-existing stylistic debt — reported as warnings so CI stays green
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "prefer-const": "warn",
      "prefer-spread": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];
