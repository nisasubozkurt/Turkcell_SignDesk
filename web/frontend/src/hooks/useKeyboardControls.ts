import { useEffect } from 'react';
import { KEYBOARD_KEYS } from '@/utils/constants';

interface UseKeyboardControlsProps {
  onSpace: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
  onQuit?: () => void;
  enabled?: boolean;
}

export const useKeyboardControls = ({
  onSpace,
  onBackspace,
  onClear,
  onEnter,
  onQuit,
  enabled = true,
}: UseKeyboardControlsProps): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle different keys
      switch (event.key) {
        case KEYBOARD_KEYS.SPACE:
        case ' ':
          event.preventDefault();
          onSpace();
          console.log('⌨️ Space key pressed');
          break;

        case KEYBOARD_KEYS.BACKSPACE:
        case 'Backspace':
          event.preventDefault();
          onBackspace();
          console.log('⌨️ Backspace key pressed');
          break;

        case KEYBOARD_KEYS.ENTER:
        case 'Enter':
          event.preventDefault();
          onEnter();
          console.log('⌨️ Enter key pressed');
          break;

        case KEYBOARD_KEYS.C:
        case 'c':
        case 'C':
          event.preventDefault();
          onClear();
          console.log('⌨️ C key pressed (Clear)');
          break;

        case KEYBOARD_KEYS.Q:
        case 'q':
        case 'Q':
          if (onQuit) {
            event.preventDefault();
            onQuit();
            console.log('⌨️ Q key pressed (Quit)');
          }
          break;

        default:
          // Ignore other keys
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onSpace, onBackspace, onClear, onEnter, onQuit]);
};