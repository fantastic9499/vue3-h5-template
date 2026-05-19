import { onErrorCaptured, ref } from 'vue';
import type { Ref } from 'vue';

interface IErrorBoundaryResult {
  error: Ref<Error | null>;
  hasError: Ref<boolean>;
  resetError: () => void;
}

export function useErrorBoundary(): IErrorBoundaryResult {
  const error = ref<Error | null>(null);
  const hasError = ref(false);

  onErrorCaptured((err) => {
    console.error('[ErrorBoundary]', err);
    error.value = err;
    hasError.value = true;
    return false;
  });

  function resetError(): void {
    error.value = null;
    hasError.value = false;
  }

  return { error, hasError, resetError };
}
