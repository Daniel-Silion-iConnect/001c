# Issue #80 screenshots

Both Concept I variants, including the selected scenario picker, captured from
the local viewer in headless Chrome with Three.js/WebGL (SwiftShader).
460px images show the full mobile page; 1400px images show the desktop viewport.

| Variant | 460px | 1400px |
| --- | --- | --- |
| 0.2c Proxima flyby | [Mobile](flyby-460.png) | [Desktop](flyby-1400.png) |
| 0.046c conditional Alpha Cen A capture | [Mobile](capture-460.png) | [Desktop](capture-1400.png) |

Browser assertions at both widths covered the Concept F default, fastest-first
options with trip times, both speed/fraction readouts, bounded target progress,
qualified capture timing, expanded travel-table fit, speed-axis label bounds,
end-of-coast scrubbing/replay, actual picker form navigation and absence of
page errors or horizontal overflow. `npm test`: 329 passed, 0 failed.

The rendered paths show an assumed departure coast to 30 AU; the capture
benchmark is literature context, not a simulated stellar braking trajectory.
