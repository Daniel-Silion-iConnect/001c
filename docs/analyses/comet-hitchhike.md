# Hitchhiking on the Great Comet of 1843 (C/1843 D1)

Issue #69. **Verdict: no-go as a passive 300 km/s escape mechanism, and a poor
substitute for Concept C's solar Oberth stage.** Riding this bound comet gives
no solar escape. Its deeper perihelion improves the Oberth multiplier, but
reaching solar v∞ = 300 km/s still requires an ideal **74.54 km/s prograde
burn**, while facing **44.55 MW/m²** normal solar irradiance. A natural shade
or gas push does not close that gap.

All derived numbers below are reproduced by the stdlib-only functions and
`CometHitchhikeTests` in [`analysis/ideas_calc.py`](../../analysis/ideas_calc.py).
They run with `python3 analysis/ideas_calc.py` and through `npm test`.
These are Newtonian two-body estimates and illustrative environment budgets,
not a propagated rendezvous, thermal design, or new engine event. In particular,
the engine's deferred `hitchhike` event does not implement this mission.

## Published orbit and the meaning of 570 km/s

The primary orbit source is [JPL's SBDB API response for C/1843 D1](https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=C%2F1843%20D1&full-prec=true),
retrieved **2026-10-25**. The [browser lookup](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=C%2F1843%20D1)
and [API documentation](https://ssd-api.jpl.nasa.gov/doc/sbdb.html) provide
alternative access and field definitions. This is the **SAO_2008** catalog
solution, producer **Kreutz**, source **SAO**, flagged **two_body: T**, equinox
**J2000**. Its epoch is assumed to be perihelion, JD **2394259.411**; JPL's
comment warns that historical UT times are stored as ET. There are about
200 observations over 45 days, 1843-03-05 through 1843-04-19, and no supplied
element uncertainties. Preserve that provenance rather than implying a modern
high-precision ephemeris.

| Published element | Frozen input |
|---|---:|
| Perihelion q, from solar centre | 0.005527 AU |
| Eccentricity e | 0.999914 |
| Inclination to ecliptic i | 144.3548° (retrograde) |
| Ascending node Ω | 3.5272° |
| Argument of perihelion ω | 82.6390° |
| Catalog a; aphelion Q | 64.2674419 AU; 128.5293567 AU |

Use the calculator's existing rounded μ☉ = 1.32712×10²⁰ m³/s²,
AU = 1.496×10¹¹ m and R☉ = 6.957×10⁸ m. With a = q/(1 − e),
Q = a(1 + e), ε = −μ☉/(2a), and v_p² = μ☉(1 + e)/q:

| Derived quantity | Result |
|---|---:|
| q | **826,839 km = 1.18850 R☉** |
| Height above nominal photosphere, q − R☉ | **131,139 km** |
| Perihelion speed v_p | **566.566 km/s**, consistent with “≈570” |
| Solar escape speed at q | 566.578 km/s |
| Specific heliocentric orbital energy ε | **−6.90172 km²/s² = −6.90172 MJ/kg** |
| a; Q, recomputed from q and e | **64.26744 AU; 128.52936 AU** |
| Keplerian period from a | about **515 years** |

The catalog also contains a redundant period of 187373.25 days (about 513
years), slightly inconsistent with a under these constants. We derive the
period from q and e consistently; neither value is a next-return prediction.
Small errors in e near unity greatly change a, Q and period, while barely
changing v_p. Planetary perturbations, fragmentation and non-gravitational
forces require a new orbit solution to predict an actual return.

Since ε < 0, **there is no real v∞**: this ellipse turns around at Q. Saying
“v∞ ≈ 0” is a useful near-parabolic shorthand, not a positive escape speed;
the calculator returns `bound: True` and `vInf_km_s: None`. A probe detached
without a relative kick shares that energy. The Sun supplied the spectacular
local speed during the fall and takes it back during the climb. Only
**12.18 m/s** prograde at perihelion would make the ideal orbit parabolic,
but that merely reaches zero escape energy.

## Oberth burn and comparison with Concept C

For a tangential prograde impulse Δv at fixed q, energy conservation gives

\[
v_\infty^2=2\varepsilon+2v_p\Delta v+(\Delta v)^2,
\qquad
\Delta v_{\rm exact}=\sqrt{2\mu_\odot/q+v_\infty^2}-v_p.
\]

If the incoming orbit is nearly parabolic and Δv ≪ v_p, dropping 2ε and
(Δv)² gives **v∞ ≈ √(2 v_p Δv)**. Inverting this approximation for 300 km/s
gives **79.43 km/s**; the exact answer is **74.535 km/s**, about 6.6% less.
The final local speed would be **641.101 km/s**. Here the kick is 13% of v_p,
so the quadratic term cannot be discarded for a precise requirement.

Compare with [Concept C's baseline, §4.3](reference-scenarios.md#43-back-of-envelope-calculation-concept-c),
which already assumes a speculative incoming solar v∞ of 45 km/s and a
24 km/s STP burn at **3.5 R☉**. Keep that incoming energy explicit:

| Ideal impulse comparison | C/1843 D1 orbit | Concept C baseline |
|---|---:|---:|
| Perihelion | 1.1885 R☉ | 3.5 R☉ |
| Incoming ε (km²/s²) | −6.902 | +1012.5 (= 45²/2) |
| Incoming perihelion speed | 566.566 km/s | 333.213 km/s |
| Solar v∞ after **24 km/s** prograde | **166.605 km/s** | **136.364 km/s** |
| Burn alone needed for solar v∞ = 300 km/s | **74.535 km/s** | **112.888 km/s** |
| Normal solar flux | **44.553 MW/m²** | **5.137 MW/m²** |

The comet buys a 22% increase in v∞ for the same 24 km/s impulse, at **8.67×
the irradiance**. It does not supply Concept C's assumed incoming hyperbolic
energy, outbound tether chain, or an independent “570 km/s bonus.” With the
same assumed Isp = 1000–1250 s, the single equivalent ideal rocket equation
MR = exp(Δv/(g₀ Isp)) gives **MR ≈ 2000–437** for 74.535 km/s, compared with
11.56 at 24 km/s and 1000 s. Staging changes the mass accounting, but needs
its own dry-mass and thrust budget. These are not demonstrated STP missions.

## Heating, exposure and the shield requirement

Using the nominal **1361 W/m² at 1 AU**, consistent with
[NASA's irradiance measurements](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science),
the flux through a plane normal to the solar radius is F = 1361/q_AU² =
**44.553 MW/m²**, or **32,736 suns**. For a flat shield with solar
absorptivity α, thermal emissivity ε_th and radiating/projected area ratio f,

\[
T_{\rm eq}=\left({\alpha F\over f\epsilon_{\rm th}\sigma_{\rm SB}}\right)^{1/4}.
\]

One black emitting face (f = 1) gives **5294 K**. The point-source,
isothermal black sphere convention (f = 4) gives **3744 K**. At this q the
Sun has angular radius **57.29°**. A sphere intercepts rays from that whole
disk, so its absorbed power exceeds πR_n²F by
**g = 2/[1 + √(1 − (R☉/q)²)] = 1.29835**, assuming uniform solar radiance.
The corresponding sphere temperature is **3996 K**. The normal flat-plane
flux remains F. This finite-disk correction follows angular integration;
it also appears in [Gundlach et al. (2012), eqs. 5–6](https://arxiv.org/abs/1203.1808).
Limb darkening, reradiation from the coma and surface temperature variations
are outside these estimates. These radiative temperatures are not the
temperature of sublimating ice or the coronal plasma.

Even assuming α/ε_th = 0.15 for a one-face shield gives **3295 K**. To hold
that face at **1650 K** requires **α/ε_th ≤ 0.00943**; at **3000 K**, ≤ 0.1031.
Two equally effective emitting faces double the allowed ratio, but the back
face must radiate to space without heating the payload. Such low solar
absorption with high thermal emission at these temperatures has not been
established for this mission. With the Sun spanning **114.6°**, a grazing
shield cannot treat all incident rays as one nearly parallel beam.

[Parker's carbon-composite shield](https://science.nasa.gov/mission/parker-solar-probe/)
is 11.43 cm thick and designed for about 1377°C (1650 K); that does not
qualify it for this flux. A candidate would need a refractory, highly
reflective and insulated shield with demonstrated hot optical properties,
probably supplemented by regenerative/transpiration cooling or expendable
ablator. Its mass, erosion, pointing, coronal particle heating and burn
plume geometry remain unsolved. The [Benkoski NIAC report](https://ntrs.nasa.gov/api/citations/20250001946/downloads/NIAC_2022_PhI_Benkoski_Oberth.pdf)
supports investigation of a combined STP shield/heat exchanger, not survival
at 1.19 R☉: its 30×30 cm helium test reached 2500 suns, equivalent to 4.3 R☉,
and developed a fissure. The required flux here is about 13 times that test.

The unpowered comet's residence times come from **Kepler's equation**, not
from dividing a radial distance by its tangential perihelion speed. For
p = q(1 + e), solve cos ν = (p/r − 1)/e, then
tan(E/2) = √[(1 − e)/(1 + e)] tan(ν/2) and
Δt = 2√(a³/μ☉)(E − e sin E). The area law also gives the incident normal-plane
fluence **∫F dt = 2(1361) AU² ν/√(μ☉p)**:

| Window, inbound plus outbound | Time inside | Normal-plane fluence |
|---|---:|---:|
| r ≤ 2 R☉ | **98.69 min** | **179.61 GJ/m²** |
| r ≤ 2q = 2.3770 R☉ (F ≥ peak/4) | **129.73 min** | **204.27 GJ/m²** |
| r ≤ 3.5 R☉ | **223.66 min** | **246.75 GJ/m²** |

These are exposure windows on the catalog ellipse; an escaping burn changes
the outbound leg. The timescale q/v_p is **24.3 min**. The impulsive Oberth
calculation requires a burn much shorter than this; spreading 74.5 km/s over
hours needs finite-thrust propagation and reduces the ideal benefit. Even
at a uniform 10 g the burn lasts about 760 s. A shield must handle both peak
flux and hours of accumulated heating, including after detachment.

## Second-order help and hazards

The following nucleus properties are **chosen examples**, not measurements
of C/1843 D1: radius R_n = **1 km**, density **500 kg/m³**, gas speed
u = **1 km/s**, and water-like sublimation cost L = **2.8 MJ/kg**.
The icy energy-balance model is motivated by Gundlach et al.; L is a rounded
thermodynamic scale, not a high-temperature chemistry model. Changing the
ice fraction, gas composition, size or activity changes these results.

**A sunshade, for a very close rider.** An opaque spherical nucleus gives
a full umbra whose apex lies R_n q/(R☉ − R_n) from its centre. At perihelion
this is only **188.5 m beyond the antisolar surface** for R_n = 1 km.
This exact two-sphere geometry matters for the enormous apparent Sun.
An intact nucleus can block direct photospheric light only for a rider very
close to its night side. It cannot shield an already accelerating probe;
a 74.5 km/s relative speed crosses 188 m in **2.5 ms**. Hot nucleus/coma
radiation, scattering and particles remain: a 1000 K black surface emits
**56.7 kW/m²** before view-factor reduction. Shape, rotation, gas, shrinking
radius and breakup all move or remove the shadow.

**Outgassing recoil of the carrier.** Spending all incident solar power on
gas gives a peak rate scale ṁ ≤ gπR_n²F/L ≈ **6.49×10⁷ kg/s** for this
example. If all the momentum were aligned and the mass were fixed,
a = ṁu/M_n; integrate the normal fluence within 2q and conservatively hold
g at its peak to get **Δv ≲ 0.142 km/s as a fixed-mass scale**. The associated
mass loss is 14% of the initial 2.09×10¹² kg nucleus, so fixed mass is only
an approximation (the corresponding constant-area rocket correction is
about **0.153 km/s**). Real shrinking area, reradiation, gas kinetic energy
and opposing jets reduce this optimistic budget. At perihelion antisolar
recoil is radial, perpendicular to v_p, so it does not get the prograde
Oberth cross term there. Even treating it optimistically as a 0.15 km/s
tangential kick yields only about 12.5 km/s v∞. It cannot replace 74.5 km/s.

**Gas push or drag on the probe.** Independently assume an isotropic
ṁ = **10⁶ kg/s** outflow at 1 km/s. At a **10 km centre distance**,
ρ_g = ṁ/(4πd²u) gives incident momentum flux ρ_g u² = **0.796 Pa**.
For A/m = **0.01 m²/kg** and order-unity absorption coupling, that is
0.00796 m/s², or **61.9 m/s** if maintained throughout the 2q window.
It scales as ṁu(A/m)/d²; this is a hypothetical constant local flow, not a
measured or predicted impulse. Jets, shielding, rotation and entrainment
change the direction and strength. A co-moving probe meets gas at order u,
**not at 570 km/s**; after release, the much larger probe/coma relative speed
can make collisions destructive. A gas sail trades more area for more
heating, dust exposure and control torque.

**Dust and plasma impacts.** For ambient material stationary in the solar
frame, w = **570 km/s** gives ½w² = **1.6245×10¹¹ J/kg**: a **1 μg** grain
carries **162 J**, **1 mg** carries **162 kJ**, and **1 g** carries **162 MJ**.
Actual velocities are vector differences; orbiting dust and radial coronal
flows are not stationary. Locally co-moving coma dust initially has much
smaller relative speed. These energies do not establish a collision rate:
no grain density or column is assumed. Dust sublimation can reduce the
innermost solid population; [Sekanina & Chodas (2012)](https://arxiv.org/abs/1205.5839)
infer Lovejoy's dust loss below about 1.8 R☉. That does not remove inbound
dust, fresh fragments, vapour or coronal particle heating. Nucleus shade
blocks only some directions and offers no general impact protection.

**Breakup and erosion.** The solar radial tidal acceleration across one
nucleus radius is 2μ☉R_n/q³ = **4.70×10⁻⁴ m/s²**, versus its self-gravity
4πGρR_n/3 = **1.40×10⁻⁴ m/s²**. This comparison flags danger, not a breakup
criterion for a solid, rotating, outgassing body. The subsolar energy-limited
erosion scale inside 2q, ∫Fdt/(ρL), is **146 m**, before chemistry, changing
surface geometry or conduction. Evaporation can keep ice cool by consuming
the body; it does not prove a lasting platform or anchor. Outgassing can
also compress a nucleus and resist tides, as Gundlach et al. show. Lovejoy
survived perihelion but disintegrated about **1.6 days later**, according to
Sekanina & Chodas. Surviving the closest point alone is insufficient.

## Rendezvous, timing and available targets

Matching a comet means matching its **position and velocity vector at the
same time**, including its retrograde inclination. From the frozen orbit,
at the inbound **1 AU radius** the comet has **−41.84 km/s radial** and
**3.13 km/s transverse** velocity (total **41.96 km/s**), and ecliptic latitude
**−35.64°**. It is not near Earth just because r = 1 AU. Its ecliptic node
radii are **0.00980 and 0.01268 AU**, both deep inside Mercury's orbit.
Even the minimum mismatch to *any* hypothetical local circular orbit at
1 AU is **49.61 km/s**; this is a state comparison, not a launch Δv solution.
An early interception on a matching eccentric transfer, planetary assists,
or outer-system plane changes can alter the propulsion cost, but require
target-specific trajectory optimisation. The comet cannot erase that cost.

An unmatched near-perihelion flyby is no capture: at a relative speed of
570 km/s, a **1 km** region is crossed in **1.75 ms**. A 1 s timing error
corresponds to **567 km** along this perihelion orbit. These are sensitivity
scales, not navigation tolerances for an already matched rider. The
[JPL Comet Hitchhiker study](https://www.jpl.nasa.gov/news/comet-hitchhiker-would-take-tour-of-small-bodies/)
discusses material-limited tether maneuvers around 1.5 km/s, or a speculative
10 km/s with advanced tethers/harpoons; it does not validate a 570 km/s catch
or anchoring to a disintegrating sungrazer. Rendezvous must precede the pass,
with the burn stage and its own thermal protection carried along.

C/1843 D1 is a historical target, last observed in 1843; the catalog ellipse
is not a reliable booking for the mid-24th century. Historical Kreutz
examples include **C/1882 R1**, **C/1965 S1 (Ikeya–Seki)** and
**C/2011 W3 (Lovejoy)**; the first two and the group's fragmentation are
discussed by Gundlach et al. The [NRL Sungrazer guide](https://sungrazer.nrl.navy.mil/soho_guide)
describes frequent small Kreutz discoveries and predictable sky tracks, but
explicitly distinguishes knowing the tracks from knowing arrival times.
The [SOHO Lovejoy chronology](https://soho.nascom.nasa.gov/hotshots/2011_12_12/)
records its announcement on December 2 and perihelion on December 16, 2011:
about two weeks' notice for that unusually conspicuous object.

As of **2026-10-25**, a more recent caution is **C/2026 A1 (MAPS)**:
[NASA reported its destruction during the April 4, 2026 passage](https://science.nasa.gov/blogs/the-sun-spot/2026/04/16/nasa-heliophysics-spacecraft-witness-comets-demise/).
These examples are historical comparators, not a list of available future
rides. A usable mission needs a newly surveyed large survivor, early precise
astrometry and a feasible pre-perihelion transfer; family membership supplies
neither a scheduled rendezvous nor a guaranteed nucleus.

## Decision for the project

Retain this as an explanatory limit case alongside
[Concept C](reference-scenarios.md#4-concept-c-infrastructure-heavy-pre-deployed-tether-chain--stpntp-oberth-speculative--aspirational-full-stack)
and the [exotic propulsion comparison](exotic-ideas.md#great-comet-of-1843-hitchhike-issue-69).
A bound sungrazer supplies no passive interstellar escape energy. Its
perihelion can amplify a real propulsive kick, but **74.5 km/s Δv, severe
mass ratio, 44.6 MW/m², short-lived shade, uncertain survival and difficult
rendezvous** make it a worse engineering baseline than studying a controlled
Concept C dive at 3.5 R☉. That preference does not validate Concept C's
speculative tether infrastructure or its full-stack 300 km/s claim.
