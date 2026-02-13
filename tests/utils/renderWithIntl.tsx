import type { ReactElement } from 'react';
import { render } from '@testing-library/react';

// i18n/next-intl was removed from the app, but tests still use this helper.
// Keep the same API so existing test files don't need large refactors.
export function renderWithIntl(ui: ReactElement) {
  return render(ui);
}

