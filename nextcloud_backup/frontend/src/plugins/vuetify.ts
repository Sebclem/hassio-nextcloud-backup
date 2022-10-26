// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Vuetify
import { createVuetify } from "vuetify";

const darkTheme = {
  dark: true,
  colors: {
    primary: "#0091ea", //light-blue accent-4
    accent: "#FF6F00", //amber darken-4
  },
};

export default createVuetify(
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
  {
    theme: {
      defaultTheme: "darkTheme",
      themes: {
        darkTheme,
      },
    },
  }
);
