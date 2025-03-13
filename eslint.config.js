const eslint = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

const rules = {
  "no-alert": "warn",
  "no-eval": "error",
  "require-await": "warn",
  "no-useless-escape": "warn",
  "@typescript-eslint/no-require-imports": "off" // ✅ Allow require() in CommonJS
};

module.exports = [
  // JavaScript Rules
  {
    files: ["lib/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...rules
    }
  },
  // TypeScript Rules
  {
    files: ["src/**/*.ts", "types/**/*.d.ts"],
    plugins: { "@typescript-eslint": tseslint },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module"
      },
      globals: {
        __dirname: "readonly",
        require: "readonly",
        process: "readonly",
        ...globals.node
      }
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "no-undef": "off", // ✅ Disable this for Node.js globals
      "@typescript-eslint/no-require-imports": "off" // ✅ Allow require() in CommonJS
    }
  }
];
