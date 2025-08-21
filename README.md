# React + TypeScript + Vite Custom Template

This is a custom template for building modern React applications with TypeScript and Vite, featuring:

- **PNPM** as the recommended package manager
- **Tailwind CSS** for utility-first styling
- **Prettier** with the Tailwind CSS Prettier plugin for consistent code formatting and class sorting
- **shadcn/ui** for accessible, customizable UI components
- **React Router (Data APIs)** for advanced routing and data loading

## Features

- Fast development with Vite and HMR
- Type-safe React with TypeScript
- Tailwind CSS configured and ready to use
- Prettier auto-formats code and sorts Tailwind classes
- shadcn/ui components installed and configured
- React Router set up in Data APIs mode

## ESLint Configuration

For production-ready linting, enable type-aware rules:

```js
// eslint.config.js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
```

## Prettier Configuration

Prettier is set up with the Tailwind CSS plugin to automatically sort classes:

```json
{
  "trailingComma": "es5",
  "bracketSpacing": true,
  "printWidth": 120,
  "tabWidth": 2,
  "singleQuote": false,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Tailwind CSS

Tailwind is preconfigured. Edit `src/index.css` to customize your design system.

## shadcn/ui

shadcn/ui is installed. Use the CLI to add components as needed:

```sh
pnpm dlx shadcn@latest add button
```

## React Router (Data APIs)

React Router is set up using the Data APIs (`createBrowserRouter`, loaders, actions). See [`src/App.tsx`](./src/App.tsx) for examples.

---

Start building your app with:

```sh
pnpm install
pnpm dev
```
