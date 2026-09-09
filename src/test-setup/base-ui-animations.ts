/**
 * Disable Base UI's animation-aware unmounting in the happy-dom test environments.
 *
 * Base UI's `useAnimationsFinished` decides how to unmount a popup (dialog,
 * popover, menu, …) by feature-detecting `Element.prototype.getAnimations`:
 *
 *   - absent  -> the unmount callback runs synchronously
 *   - present -> the unmount is deferred behind `requestAnimationFrame` and
 *                `Promise.all(element.getAnimations().map((a) => a.finished))`
 *
 * happy-dom gained a `getAnimations()` implementation, which flipped every
 * Base UI popup in our jsdom-style tests onto the deferred path. Because
 * happy-dom has no real animation timeline, those promises settle a microtask
 * (and a frame) later than the synchronous assertions that follow `fireEvent`,
 * so closed popups appeared to linger in the DOM.
 *
 * `BASE_UI_ANIMATIONS_DISABLED` is Base UI's documented escape hatch for
 * exactly this situation: it forces the synchronous unmount path regardless of
 * `getAnimations` support. Real animation behavior is still exercised by the
 * Storybook project, which runs in a real browser.
 */

declare global {
  var BASE_UI_ANIMATIONS_DISABLED: boolean;
}

globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

export {};
