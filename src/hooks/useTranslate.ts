import { useAppStore } from "../store/useAppStore";

export function useTranslate() {
  const translate = useAppStore((s) => s.translate);
  const isLoading = useAppStore((s) => s.isLoading);
  const loadingMessage = useAppStore((s) => s.loadingMessage);
  const error = useAppStore((s) => s.error);
  return { translate, isLoading, loadingMessage, error };
}
