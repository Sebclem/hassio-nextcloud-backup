import { computed } from "vue";
import { useDisplay } from "vuetify";

export function useMenuSize() {
  const { xs, mdAndDown } = useDisplay();
  const width = computed(() => {
    if (xs.value) {
      return undefined;
    } else if (mdAndDown.value) {
      return "80%";
    } else {
      return "50%";
    }
  });
  const isFullScreen = xs;
  return { width, isFullScreen };
}
