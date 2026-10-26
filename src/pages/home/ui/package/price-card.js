import { $, fitSticky } from '../../../../shared/lib/index.js';

// The price card stays beside the package list as it scrolls, with its foot always reachable.
export function initPriceCard() {
  fitSticky($('.price-card'), 24);
}
