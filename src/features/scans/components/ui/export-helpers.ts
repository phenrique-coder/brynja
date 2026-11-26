import { RefObject, useEffect } from 'react';

/**
 * Attaches outside-click and Escape-key handlers to close open dropdown menus cleanly.
 */
export function useDismissibleMenu(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onDismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss();
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, containerRef, onDismiss]);
}

/**
 * Triggers a browser file download from either text or binary exported data.
 */
export function downloadBrowserFile(
  filename: string,
  mimeType: string,
  data: string | Uint8Array,
): void {
  const payload: BlobPart =
    data instanceof Uint8Array ? new Uint8Array(data) : data;
  const blob = new Blob([payload], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
