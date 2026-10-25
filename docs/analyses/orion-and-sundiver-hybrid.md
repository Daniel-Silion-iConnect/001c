# Orion pulse propulsion and a carbon sundiver at 3 R☉

Issue #71. **Verdict:** the ideal Orion mass ratio is correct for a
**109.405 km/s perihelion burn**, but it does not make Orion a practical
1 kg vehicle. A carbon-based sail is meaningful as a **conditional exotic
energy/mass study**, represented by Concept G, with unproven combined optical,
thermal and structural properties. Bare graphene is not a reflective sail.

The key correction is the approach energy: **β = 0.707694 on a parabolic
arrival**, versus **β = 1.707694 from rest**. The suggested **0.9 g/m² total
areal density and 2,500 m² sail** match the latter, ideal-reflector case.

## Reproduction, constants and scope

[`analysis/ideas_calc.py`](../../analysis/ideas_calc.py) implements
`orion_oberth_budget`, `sail_terminal_energy`, `sundiver_budget` and
`sail_thermal_budget`, with `OrionSundiverTests`. Run:

```sh
npm ci && npm test
python3 analysis/ideas_calc.py
```

The Python suite checks approach energy, rocket mass ratios, optical momentum,
payload mass, equilibrium heat balance and finite sail work against independent
Simpson quadrature. The npm suite runs these checks, validates Concept G's JSON,
and checks its engine/viewer result and finite-jettison behavior.

Use the calculator's existing rounded μ☉ = 1.32712×10²⁰ m³/s²,
R☉ = 6.957×10⁸ m, AU = 1.496×10¹¹ m, c = 2.998×10⁸ m/s and
g₀ = 9.80665 m/s². Solar irradiance S₁ = 1361 W/m² at 1 AU follows
[NASA's solar irradiance measurements](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science).
The engine uses its existing more precise μ☉ and AU; Concept G is calibrated
with those constants to 300 km/s, giving β = **0.710365490**, compared with
Python's **0.710367798**. The difference changes v∞ by less than 0.001 km/s
if the same β is used in both.

All perihelia are distances **from the solar centre**. Here
q = 3 R☉ = **2,087,100 km = 0.0139514 AU**, two solar radii above the
photosphere. These are Newtonian, point-source, two-body estimates, with an
ideal impulse for Orion and a constant, Sun-normal radial sail. Delivery,
navigation, material degradation and hardware feasibility require separate
engineering. The target is the project's rounded **300 km/s solar v∞**;
exactly 0.001c is 299.792458 km/s.

## Orion: what the mass ratio buys

For incoming heliocentric specific energy εᵢ, local incoming speed and the
speed required after a tangential prograde burn are

\[
v_i=\sqrt{2\mu_\odot/q+2\varepsilon_i},\qquad
v_f=\sqrt{2\mu_\odot/q+v_\infty^2},\qquad
\Delta v=v_f-v_i.
\]

On a parabolic approach, εᵢ = 0 and vᵢ = vesc:

| Quantity | Ideal result |
|---|---:|
| Incoming perihelion / escape speed | **356.614 km/s** |
| Post-burn perihelion speed for v∞ = 300 km/s | **466.019 km/s** |
| Tangential perihelion burn | **109.405 km/s** |
| Effective exhaust speed, assumed | **100 km/s**, Isp ≈ 10,197 s |
| Wet / dry mass, exp(109.405/100) | **2.98634** |
| Wet / dry mass for rocket-only Δv = 300 km/s | **20.0855** |

The Sun provides the incoming fall speed; the vehicle must still add
109.405 km/s at perihelion. The **466 km/s is a local speed, not a burn**.
A 300 km/s rocket-only Δv describes an independent speed increment, not this
Oberth maneuver or a complete escape mission. Mass ratio 2.986 includes the
pulse-unit expendables in wet mass and the pusher, absorbers, bus and payload
in final dry mass. It cannot be applied to the scientific payload alone.
The earlier plunge and departure costs are excluded.

The impulse is also an optimistic limit. At an illustrative constant **1 g**,
109.405 km/s takes **3.10 hours**, while the local passage scale q/vᵢ is only
**1.63 hours**. A real finite pulse sequence will span changing radius and
speed; the 2.986 mass ratio does not establish the same Oberth benefit without
propagating that burn. These time scales are included in the calculator output.

### Scale, pulse units and the 1 kg question

[Schmidt, Bonometti & Morton, NASA/AIAA 2000-3856](https://ntrs.nasa.gov/api/citations/20000096503/downloads/20000096503.pdf),
especially pp. 3–8, reviews external pulse coupling, historical spacecraft and
later concepts. Its Saturn-compatible design used a roughly **100,000 kg
propulsion module with a 10 m pusher**, and only **1,800–2,500 s Isp** at that
size. Thus 100 km/s effective exhaust is an optimistic study input, not the
published performance of that compact historical design. The report also
describes multi-thousand-ton vehicles; it establishes no universal smallest
practical Orion.

The scaling obstacle is physical: a fission pulse unit must support criticality
and carries non-scaling containment and initiation overhead. Reducing energy
release does not proportionally reduce that overhead; small yields reduce
useful energy per expendable mass. The NASA review identifies the absence of
a criticality floor as an advantage of proposed fusion pulses, while their
external ignition apparatus remains a different architecture. No kilogram
Orion follows from scaling the rocket equation.

A smaller vehicle also has less inertia per pulse and less structure to spread
the impulse, while the pusher and shock isolation still have to accept the
load. **Inference:** a 1 kg instrument could ride a large pulse ship, but calling
it a 1 kg propulsion system hides the dominant dry mass. For this project's
small independent probe, Orion is a poor fit. We do not invent a minimum pulse
unit or vehicle mass without a complete, sourced design.

### A pusher at 3 R☉

Normal solar irradiance is

\[
S(q)=S_1(\mathrm{AU}/q)^2=\mathbf{6.993\ MW/m^2},
\]

about **5,138 Earth-distance suns**. Nuclear-pulse survival over a short
interaction does not establish survival under continuous sunlight. A plate
with α = ε = 1 reaches **3,332 K** if only one face radiates, or **2,802 K**
with two equal emitting faces. At α = 0.1 and ε = 0.8 on both faces it still
reaches **1,666 K**. These are area-based equilibrium examples, not a pusher
design; geometry, shadowing and cooling can change them. A Sun-facing 10 m
disc would intercept about **549 MW** before reflection. Pulse heating,
ablation and thermal fatigue add to the solar load. Edge-on attitude or a
separate shade needs a trajectory, pulse-geometry and mass analysis.

### Treaties, debris and fallout

The [1963 Partial Test Ban Treaty, Article I(1)(a)](https://treaties.un.org/doc/Publication/UNTS/Volume%20480/volume-480-I-6964-English.pdf)
prohibits its parties' nuclear explosions in outer space, including peaceful
ones. A propulsion label supplies no exception. Article I(1)(b) separately
addresses explosions in other environments that spread radioactive debris
beyond territorial limits. Moving Orion away from Earth reduces local fallout
exposure but does not remove the outer-space prohibition.

The [Outer Space Treaty, Articles IV, VI, VII and IX](https://treaties.un.org/doc/Publication/UNTS/Volume%20610/volume-610-I-8843-English.pdf)
addresses stationing nuclear weapons/WMD, national authorization and supervision,
launching-state liability, and harmful contamination/interference. Article IV
is **not a blanket ban on nuclear energy or every nuclear-propelled craft**;
classification and deployment of explosive pulse units need legal assessment.
The PTBT is the more direct explosion barrier for its parties. Article IX's
due-regard and consultation obligations also matter for a pulse mission.

Fallout is especially problematic for surface/atmospheric operation. In-space
operation still releases radioactive material and prompt radiation; launches
also carry accident and dispersal risks. **Inference:** distance can change
the exposure pathways, not turn this into a clean, treaty-exempt propulsion
method. No fallout dose or launch-safety probability is claimed here.

## Sail: derive β from the actual approach

Define β as outward radiation acceleration divided by true solar gravity.
For a normal radial sail with constant optics,

\[
\ddot{\mathbf r}=-\mu_\odot(1-\beta)\mathbf r/r^3.
\]

Deployment changes neither position nor velocity. Integrating sail work from
q to infinity gives W/m = βμ☉/q. Since εᵢ = vᵢ²/2 − μ☉/q,

\[
\frac12v_\infty^2=\varepsilon_i+\frac{\beta\mu_\odot}{q},
\quad
v_\infty^2=v_i^2+(\beta-1)v_{esc}^2,
\quad
\boxed{\beta=1+\frac{v_\infty^2-v_i^2}{v_{esc}^2}}.
\]

Thus **(β − 1)vesc² by itself assumes vᵢ = 0**. On a parabola the incoming
vesc² cancels the −1 term, so **v∞² = βvesc²**. A pre-existing hyperbolic
arrival contributes its own positive 2εᵢ. If a tangential kick precedes sail
deployment, substitute the *post-kick* speed vᵢ + Δv, as for Concept B.
This energy model is consistent with the radial sail/impulse model studied by
[Bailer-Jones, *The Sun Diver* (2020)](https://arxiv.org/abs/2009.12659);
the numerical cases here are our derivations.

For an unpowered inbound ellipse with aphelion Q,
vᵢ² = 2μ☉/q − 2μ☉/(Q + q), hence

\[
\beta_{ellipse}=\frac{v_\infty^2}{v_{esc}^2}+\frac{q}{Q+q}.
\]

| Release/approach at 3 R☉ | Incoming speed | Required β | Peak radiation acceleration |
|---|---:|---:|---:|
| Parabolic fall | 356.614 km/s | **0.707694** | **2.199 g** |
| Ellipse from Q = 5.204 AU | 356.137 km/s | **0.710368** | **2.207 g** |
| Held at rest until release | 0 km/s | **1.707694** | **5.305 g** |

The rest case requires prior support/delivery and repulsive net gravity;
it is not a free alternative trajectory. Accelerations above are **radiation
force / total mass**, the sail load, rather than gravity-subtracted net radial
acceleration. They peak at q and decline as r⁻². The corresponding gravitational
acceleration is 3.107 g. On the falling cases β < 1, so net central acceleration
remains inward, while radiation still increases true-gravity orbital energy.

## Optical momentum and the full mass budget

For specular reflection fraction R, absorption α and transmission 1 − R − α,
the normal point-source momentum coefficient is **Cᵣ = 2R + α**. With total
areal density σ = (m_payload + σ_sail A)/A,

\[
\beta=\frac{C_r S_1\mathrm{AU}^2}{c\mu_\odot\sigma},\qquad
\sigma=\frac{C_r(0.765560\ \mathrm{g/m^2})}{\beta},\qquad
A=\frac{m_{payload}}{\sigma-\sigma_{sail}}.
\]

Area is finite and positive only when **σ > σ_sail**. All masses accelerate,
including the mirror and its supports. For 1 kg probe mass and
σ_sail = **0.5 g/m²**, a perfect reflector Cᵣ = 2 gives:

| Approach | Total σ including probe | Sail area | Sail mass | Total mass |
|---|---:|---:|---:|---:|
| Parabolic | **2.16353 g/m²** | **601.13 m²** | 0.30056 kg | 1.30056 kg |
| 5.204 AU ellipse | **2.15539 g/m²** | **604.09 m²** | 0.30204 kg | 1.30204 kg |
| Rest | **0.896601 g/m²** | **2,521.42 m²** | 1.26071 kg | 2.26071 kg |

This verifies the approximate **0.9 g/m², 2,500 m²** notes, but only with their
rest-release energy assumption and perfect reflection. On a parabolic approach,
β ≈ 1.7 instead would give roughly **465 km/s**, not 300 km/s.

Concept G assumes **R = 0.9, α = 0.1**, hence Cᵣ = **1.9**, instead of using
perfect reflection and then assigning nonzero absorption. Its elliptical
budget is **σ = 2.04762 g/m²**, **A = 646.15 m²**, about **25.4 m square**,
**0.32308 kg** distributed sail/support mass, and **1.32308 kg total**.
The **1 kg probe allocation must include shielding, deployment/control hardware
and bus** not already in the distributed allocation. Additional mass increases
area linearly if the same areal density and optics remain achievable. Delivery
hardware must separate before sailing or be included in that mass.

## Heat balance and what carbon/graphene does not guarantee

For a thin flat sail, both faces radiating to space,

\[
\alpha S(q)=(\epsilon_f+\epsilon_b)\sigma_{SB}T^4,
\qquad T=\left[\frac{\alpha S(q)}{(\epsilon_f+\epsilon_b)\sigma_{SB}}\right]^{1/4}.
\]

α is averaged over the solar spectrum; ε is averaged over the sail's thermal
spectrum. Kirchhoff's law relates absorption and emission at the **same
wavelength**, not necessarily these two different averages. They cannot be
chosen independently without a physical spectral design, but need not be equal.
At 3 R☉ and an **assumed ε = 0.8 on each face**:

| Solar absorptivity α | Equilibrium temperature |
|---|---:|
| 1.0 | **2,963 K** |
| 0.3 | **2,193 K** |
| 0.1 (Concept G) | **1,666 K** |
| 0.03 | **1,233 K** |
| 0.01 | **937 K** |

One radiating face instead of two raises T by 2¹⁄⁴. A grey absorber with
α = ε on both faces reaches **2,802 K**, independently of that common value.
Low absorptivity alone is insufficient if thermal emissivity falls with it.
At a 3,000 K limit and two ε = 0.8 faces the calculated allowable α is 1.051,
so even α = 1 passes this *radiation-only* temperature limit; at 3,500 K it
has more margin. That does not establish structural or lifetime margin.

[Scheffer's graphene sail study (2015), §III and Table 2](https://arxiv.org/html/1506.09214v2)
uses high-temperature carbon/graphene properties, including a 4,000 K example,
and explains the advantage over aluminium. This motivates investigating
3,000+ K materials; it is not a demonstrated safe operating rating for a
macroscopic sail. Sublimation in vacuum, defects, coatings, joints, tensile
strength at temperature and exposure time all require data. A graphene mirror
stack would also need to retain its optical properties under those conditions.

Aluminium melts at **933.45 K**, as tabulated by
[NIST-JANAF](https://janaf.nist.gov/tables/Al-001.html). Even granting the very
favorable two ε = 0.8 faces, staying below that temperature requires
**α < 0.00985** at 3 R☉. That is not a realistic assumption for an ordinary
thin Al mirror in this model; low thermal emissivity tightens the requirement.
Aluminium is not a suitable baseline for this near-Sun sail. Melting point
alone is also not a vacuum evaporation/lifetime qualification.

[Mak et al., PRL 101, 196405 (2008)](https://arxiv.org/abs/0810.1269)
measured graphene absorbance near **2.3%** above 0.5 eV in their measured
range, with low-energy deviations. This is not 100% reflection or a full
hot-solar-spectrum specification. A transparent sheet with R ≈ 0 and
α = 0.023 has Cᵣ ≈ 0.023, **87 times less momentum per area than a perfect
reflector**. Assigning this optics to the proposed 0.5 g/m² sail gives a
maximum bare-sail β ≈ **0.0352**, already below 0.708 before adding payload:
no area can meet the target at those simultaneous assumptions.

A true monolayer is far lighter than 0.5 g/m², and multilayers change both
mass and spectra. Neither case justifies mixing monolayer transparency,
bulk-carbon emissivity, and ideal-mirror thrust. An opaque absorbing carbon
sail would have Cᵣ ≈ 1, half the ideal-reflector momentum, and a different
mass/area/thermal budget. Carbon is a candidate material family, not a single
certified set of sail properties.

## Concept B comparison and the engine scenario

[Concept B](reference-scenarios.md#33-back-of-envelope-calculation-concept-b)
starts on the same 5.204 AU aphelion family but at **10 R☉**. It has
β = **0.25**, a **6 km/s** perihelion kick, vₚ before/after ≈ 194.46/200.46 km/s,
and engine v∞ = **107.56 km/s**. Its ideal energy balance is

\[
v_\infty^2=2\varepsilon_i+2v_p\Delta v+(\Delta v)^2+\beta v_{esc}^2.
\]

The parabolic pure-sail value there is **97.66 km/s**. Concept G goes **3.33×
closer** and has **2.84× larger β**. Sail work βμ☉/q is therefore about
**9.47× greater**, giving about **3.08× greater pure-sail v∞**. Concept B's
kick raises its result, but its lower lightness and shallower dive still leave
it far below 300 km/s. Concept G also faces **11.11× more irradiance** and a
much more demanding total areal density; its higher result is purchased with
those assumptions, not free energy from relabeling the same sail.

[`scenario-g.json`](../../prototype/spacekit/scenarios/scenario-g.json) starts
at aphelion on the delivered ellipse. A single engine-compatible `solarSail`
event moves to perihelion and deploys **β = 0.710365490**. It adds **zero
impulsive Δv**; projected escape energy includes the remaining sail work.
The sail remains deployed to infinity, and the engine predicts **300 km/s**.
The from-rest β > 1 case is documented only: the attractive-conic engine
supports 0 ≤ β < 1, so we do not encode a fictitious impulse or extend the
engine to repulsive gravity for this issue.

Jettison at a finite outbound radius rⱼ retains only
βμ☉(1/q − 1/rⱼ), giving

\[
v_{\infty,j}^2=v_{\infty,\mathrm{retained}}^2-2\beta\mu_\odot/r_j.
\]

There is no instantaneous speed loss on jettison in this model. Finite
jettison therefore misses the calibrated 300 km/s target unless β or the
incoming energy is increased; the tests verify this behavior.

The scenario index labels G **exotic/speculative, conceptual TRL 2**. Its
showstopper is the combination of large-area deployment, control, 90% solar
reflection, adequate thermal emission, and the complete **1.323 kg** mass
budget at **6.99 MW/m²**. The narrative exposes those assumptions in the viewer.
No Orion event is added: its 1 kg architecture is not meaningful here.

Remaining model limits include attitude/steering, sail deformation and loading,
perihelion deployment transients, finite sail lifetime, coronal/dust exposure,
and payload heat isolation. At 3 R☉ the Sun's angular radius is 19.47°;
the point-source momentum approximation itself is only approximate. A uniform
solar-disk integration for a normal flat specular sail gives a momentum/flux
factor (2/3)(1 + cos θ + cos² θ)/(1 + cos θ) ≈ **0.972**, relative to the
point-source value, before limb darkening and spectral effects. This few-percent
correction is not propagated by the engine. The displayed 300 km/s is a
conditional model target, not an operational precision claim.
