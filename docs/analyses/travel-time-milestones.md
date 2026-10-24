# Travel-time milestones

Issue #30 adds a sidebar comparison of constant-speed cruise times for the loaded
scenario's **final** engine `vInf_km_s` and exactly **0.001c = 299.792458 km/s**.
Changing the inspected leg or playing the trajectory does not change this panel.
The existing speed-progress panel retains its rounded 300 km/s target.

## Distances and sources

These are approximate heliocentric distance scales, not encounter coordinates.
Sources checked 2026-10-24.

| Milestone | Adopted distance | Source and interpretation |
| --- | --- | --- |
| Pluto | 39.5 AU | [NASA: What Is Pluto?](https://www.nasa.gov/solar-system/what-is-pluto-grades-5-8/) gives this average solar distance. Pluto's actual distance changes along its eccentric orbit. |
| Heliopause | 120 AU | Rounded scale from the Voyager crossing. [NASA/JPL Voyager project scientist Ed Stone's Q&A](https://science.nasa.gov/mission/voyager/questions-and-answers-with-dr-ed-stone/) describes Voyager 1's August 2012 crossing at about 121 AU. This boundary varies with direction and solar conditions. |
| Oort cloud, inner edge | 2,000 AU | [NASA: Oort Cloud Facts](https://science.nasa.gov/solar-system/oort-cloud/facts/) estimates an inner edge at 2,000–5,000 AU. Use the lower end as the milestone. |
| Oort cloud, outer edge | 100,000 AU | The same NASA source estimates an outer edge at 10,000–100,000 AU. Use the upper end; neither edge is a measured sharp surface. |
| Alpha Centauri / Proxima | 4.24 ly | [CDS SIMBAD: Proxima Centauri](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Proxima+Centauri) lists Gaia EDR3 parallax 768.0665 mas, giving about 4.246 ly. Retain the issue's approximate 4.24 ly milestone. This refers to Proxima (Alpha Centauri C); Alpha Centauri A/B are farther away. |
| Barnard's Star | 5.96 ly | [CDS SIMBAD: Barnard's Star](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Barnard%27s+Star) lists Gaia EDR3 parallax 546.9759 mas, giving about 5.963 ly. |
| Wolf 359 | 7.86 ly | [CDS SIMBAD: Wolf 359](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Wolf+359) lists Gaia EDR3 parallax 415.1794 mas, giving about 7.856 ly. |

The stellar values above use `distance_pc = 1000 / parallax_mas` and
`1 pc ≈ 3.26156 ly`. Their catalogue provenance is
[Gaia EDR3, CDS catalogue I/350](https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/350).
ESA explains the measurements in [Gaia: How far away are the stars?](https://www.cosmos.esa.int/web/gaia/dr3-how-far-away-are-the-stars).
For the nearby-star census and ground-based trigonometric-parallax context, see
the RECONS team's [The Solar Neighborhood XLIV: RECONS Discoveries within 10 Parsecs](https://arxiv.org/abs/1804.07377)
(Henry et al., 2018). The panel uses the approximate distances specified in the
issue, with Gaia parallaxes as their numerical cross-check, rather than implying
precision from an older RECONS ranking.

## Calculation and limits

The pure helpers in `prototype/spacekit/viewer-data.js` use the engine constants
`AU_KM = 149597870.7` and `C_KM_S = 299792.458`, a Julian year of
31,557,600 seconds, and `LIGHT_YEAR_KM = C_KM_S × JULIAN_YEAR_S`.

```text
distance_km = distance_AU × AU_KM   (or distance_ly × LIGHT_YEAR_KM)
cruise_years = distance_km / vInf_km_s / JULIAN_YEAR_S
```

Times below 1,000 years show one decimal place in `yr`; longer times show two
decimals in `k yr` (thousands of years). At exactly 0.001c, the three stellar
milestones take 4,240, 5,960 and 7,860 years. Pluto takes about 0.625 years,
the heliopause 1.898 years, and the Oort edges 31.625 and 1,581.251 years.

Bound orbits (`vInf_km_s: null`) have no escape asymptote and show “—” in the
scenario column. Zero v∞ also shows “—”: it has no finite constant-speed cruise
time. The target comparison remains available in both cases.

This estimate **ignores the time spent leaving the Sun's gravity**: the entire
distance is divided by the final asymptotic speed. It does not integrate the
departure trajectory, subtract the final event's radius, include acceleration or
arrival braking, or follow stellar proper motion. Even solar milestones inside a
scenario's last event radius are just distance scales at that final speed. The
panel is a cruise comparison, not a mission schedule or a stellar intercept
solution. Sail scenarios use the engine's projected final asymptote while the
sail remains deployed.
