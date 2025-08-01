
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        maven: ['Maven Pro', 'sans-serif'],
        opensauce: ['Open Sauce One', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        'turquoise': '#20CBC5',
        'richturquoise': '#00C4CC',
        'turqlight': '#7FE1E5',
        'orange': '#FF803D',
        'lightestgray': '#FAFAFA',
        'lightgray': '#F3F3F3',
        'grayblock': '#F2F2F0',
        'gray': '#E1E1E1',
        'darkergray': '#ACACAC',
        'darkBlue': '#0A1A44',
        'badred': '#CC0000',
        'goodgreen': '#11A90F',
        'urlblue': '#2563eb',
        'newBlack': '#1A213D',
        'primary-blue': '#00bfff',
        'secondary-blue': '#cee4f4',
        'secondary-blue-light': '#e3f2fd',
        'blue-dark': '#1a213d',
        'new-grey': '#929292',
      },
      gridTemplateColumns: {
        'landing-large': 'repeat(5, minmax(200px, 1fr))',
        'landing-small': 'repeat(4, minmax(200px, 1fr))',
      },
    },
  },
  plugins: [],
};
