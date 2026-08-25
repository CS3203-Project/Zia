import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Keeps Leaflet's idea of the map size in step with its container.
 *
 * Leaflet measures once on init. If the container isn't at its final size at
 * that moment — inside a modal that's still opening, a tab that was hidden, or a
 * mobile viewport that reflows as the browser chrome collapses — the map renders
 * against stale dimensions and you get grey bands, tiles that stop short of the
 * edge, or a map wedged into a fraction of its box.
 *
 * Watching the container with a ResizeObserver fixes all of those cases, plus
 * orientation changes, without anyone having to remember to call invalidateSize.
 */
export default function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => map.invalidateSize({ animate: false });

    // Re-measure once layout has settled after mount.
    const frame = requestAnimationFrame(refresh);
    const settle = window.setTimeout(refresh, 250);

    const container = map.getContainer();
    const observer = new ResizeObserver(refresh);
    observer.observe(container);

    // iOS in particular reflows after the rotation event rather than during it.
    const onOrientation = () => window.setTimeout(refresh, 300);
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, [map]);

  return null;
}
