/** Abort the previous GET and reject stale results even if a transport ignores abort. */
export function createLatestRequest() {
  let controller: AbortController | undefined;
  return {
    start() {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      return { signal: current.signal, isCurrent: () => controller === current && !current.signal.aborted };
    },
    cancel() { controller?.abort(); },
  };
}
