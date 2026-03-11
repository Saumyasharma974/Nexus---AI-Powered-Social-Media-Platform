/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bgMain: '#0f0f0f',
                bgSecondary: '#1a1a1a',
                bgCard: '#1e1e1e',
                accent: '#6366f1',
                textPrimary: '#ffffff',
                textSecondary: '#a1a1aa'
            }
        },
    },
    plugins: [],
}
