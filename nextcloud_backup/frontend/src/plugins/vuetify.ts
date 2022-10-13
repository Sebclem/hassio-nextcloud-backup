// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Vuetify
import { createVuetify } from "vuetify";

const darkTheme = {
  dark: true,
  colors: {
    primary: "#0091ea",
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
