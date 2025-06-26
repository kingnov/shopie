import type { Config } from 'tailwindcss';

export default {
  content: [
    "./src/**/*.{html,ts}", "./src/app/pages/**/*{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
