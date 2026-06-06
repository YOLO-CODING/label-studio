export function debounce(fn: (...args: any[]) => any, delay = 300) {
  let timeout = -1;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
