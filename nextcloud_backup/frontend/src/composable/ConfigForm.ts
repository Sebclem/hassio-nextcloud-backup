import { HTTPError } from "ky";
import { ref, type Ref } from "vue";

export function useConfigForm(
  saveService: (data: any) => Promise<unknown>,
  loadService: () => Promise<any>,
  dataRef: Ref,
  errorsRef: Ref,
  emit: {
    (e: "success"): void;
    (e: "fail"): void;
    (e: "loaded"): void;
    (e: "loading"): void;
  }
) {
  const loading = ref(true);

  function save() {
    loading.value = true;
    clearErrors();
    saveService(dataRef.value)
      .then(() => {
        loading.value = false;
        emit("success");
      })
      .catch(async (reason) => {
        if (reason instanceof HTTPError) {
          const response = await reason.response.json();
          if (Array.isArray(response)) {
            for (const elem of response) {
              errorsRef.value[
                elem.context.key as keyof typeof errorsRef.value
              ] = elem.message;
            }
          }
        }
        loading.value = false;
        emit("fail");
      });
  }

  function clearErrors() {
    for (const elem in errorsRef.value) {
      errorsRef.value[elem as keyof typeof errorsRef.value] = [];
    }
  }

  function loadData() {
    emit("loading");
    loadService().then(() => {
      loading.value = false;
      emit("loaded");
    });
  }

  loadData();
  return { save, loading };
}