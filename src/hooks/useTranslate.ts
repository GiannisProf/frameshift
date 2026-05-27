export function useTranslate() {
  return {
    translate: async () => {},
    isLoading: false,
    loadingMessage: "",
    error: null as string | null,
  };
}
