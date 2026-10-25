# Exotic propulsion brainstorm (issue #35)

Goal: v∞ ≥ 300 km/s (0.001c) for a 1 kg probe. The owner seeded two ideas (antimatter, lunar centrifuge). Each agent then proposed at least two new ones, which the coordinator checked independently in
[`analysis/ideas_calc.py`](../../analysis/ideas_calc.py) (`python3 analysis/ideas_calc.py`, stdlib only). Raw agent outputs are in [`agent-brainstorms/`](agent-brainstorms/).
"⚠" marks an agent number that is off by more than 20%, or that rests on an unphysical assumption.

## Ranked table

| # | Idea | Origin | v∞ contribution (checked) | Feasibility (TRL) | Showstopper | Verdict |
|---|------|--------|---------------------------|-------------------|-------------|---------|
| 1 | Photon-recycling cavity catapult, lunar-anchored (photonic laser thruster, N≈300 bounces over 10⁵ km) | Claude | **306.9 km/s** direct; 392 MW laser for 714 s (78 MWh/shot) at 40 g | 2 | Keeping a cavity at N≥300 with a 22 m, 2.7 g/m² membrane mirror receding at 280 km/s (nrad pointing, λ/10 figure) | **Promising** |
| 2 | Po-210 direct-charge 71 kV xenon ion drive | Claude | **Δv 317 km/s**, v∞ ≈ 315–320 km/s | 2–3 | 0.4 kg Po-210 ≈ 4× world output, decays 0.5%/day; direct-charge efficiency 30% assumed vs. a few % demonstrated | **Promising** (long-shot supply) |
| 3 | Chirped pellet slipstream (laser-launched pellets ionised and magnetically reflected at a fixed 100 km/s relative speed) | Codex | **317.7 km/s**; 3.75 kg of pellets, ~131 GJ launch energy (agent said ~150, −13%) | 2 | Pellet-stream aiming and ionisation over AU scales; one un-ionised pellet destroys the probe | Long-shot |
| 4 | Solar-wind bank shot (one 60° plasma-wing turn in the wind frame) | Codex | **370.7 km/s** (L/D = 10) | 2 | Requires a ~4.4×10¹⁰ m² (118 km radius) plasma interaction region with L/D 10 from kg-scale hardware | Long-shot |
| 5 | Dusty-plasma fission-fragment rocket burn at 3 R☉ (+ Jovian EDT slingshot) | Antigravity | **240.6 km/s** for 50 g of fuel (agent 247.7 used an unphysical hyperbolic inbound leg ⚠); about 85 g of fuel reaches 300 | 2 | Fragment self-absorption in the fuel dust; waste heat on the superconducting mirror at 3 R☉ | Long-shot (pairs with Concept C) |
| 6 | Lunar centrifuge / mass driver (owner) | Owner | v∞ relative to Earth of 1.5–7.3 km/s (CFRP to CNT); **~0 km/s left after a solar dive** (the 24 km/s dive shed absorbs it) but it saves a ×1.6–3.1 chemical mass ratio | 4–5 (SpinLaunch subscale on Earth) | Rotor strength: v_tip ≈ √(2σ ln(taper)/ρ). g-load on the probe | **Promising as stage-0 enabler**, no-go as the main engine |
| 7 | Coronal solar-pumped laser array + ablation kick at perihelion | Antigravity | 240.1 km/s, or 299.1 with a β=0.25 sail (arithmetic checks) | 2 | **Unstated ⚠:** a 2 m spot at 0.036 AU needs a 7 km transmitter aperture, phased, at 0.05 AU in the corona | No-go |
| 8 | Antimatter: beamed-core pion rocket (owner) | Owner | Physics allows it: 2.5 mg p̄ at η≈0.1, mass ratio 1.003 | 1–2 | Production ~10 ng/yr → **250,000 yr**; storage record ~10⁻¹⁹ kg (gap ~10¹³); ~$1.6×10¹¹ at $62.5 T/g | No-go (this century) |
| 9 | Antimatter: solid-core thermal (owner) | Owner | v_e ≈ 10 km/s → MR = e³⁰ ≈ 10¹³ | 2 | Wall temperature caps v_e; only useful as an Oberth-burn engine (≈ NTP class) | No-go |
| 10 | MagLIF micro-pulse "Orion-Oberth" kicker | Antigravity | Agent claims 312 km/s. **Checked: 62–96 km/s ⚠** (its own formula gives v_e = 9.5 km/s, not 300; alpha-only 4.2 km/s) | 1–2 | ~150 g flux-compression generators reaching 20 MA ignition | No-go |

### Top 3
1. **Photon-recycling cavity catapult**: 307 km/s v∞ with no solar dive, for 78 MWh per shot. The Moon is the ideal recoil anchor (a free-flying one would need ≥560 t).
2. **Po-210 alpha-voltaic ion drive**: 317 km/s Δv from 6.4 kg wet. The numbers check to <1%; the problem is supply and conversion efficiency.
3. **Chirped pellet slipstream**: 318 km/s with ~131 GJ of external energy; the problem is aiming and ionisation.

The [Concept D scenario](../../prototype/spacekit/scenarios/scenario-d.json)
implements the ideal cavity check using `laserCavityBoost` (see
[event notation](../ORBITAL_NOTATION.md#lasercavityboost)). The reference probe
mass is **2 kg**; **40 g is acceleration**, not a 40 gram probe. The engine
integrates constant photon thrust over the 714 s shot at the launch position,
with no powered-leg propagation or Earth/Moon escape losses. Its precise
physical constants differ slightly from the rounded Python constants, by less
than 0.01 km/s in Δv and v∞. Optical stability remains the showstopper; the
scenario is explicitly exotic and speculative.

The [Concept E scenario](../../prototype/spacekit/scenarios/scenario-e.json)
implements the Po-210 check with `ionDrive` (see
[event notation](../ORBITAL_NOTATION.md#iondrive)). The matching
`po210_ion_drive` function in `analysis/ideas_calc.py` integrates all future
exponential decay energy: 57.6 kW initial heat × 0.3 conversion × 0.7 thruster
efficiency × (138.376 days / ln 2) = **2.08637×10¹¹ J** of jet energy.
For 4 kg xenon, vₑ = **322.984 km/s**, Isp = **32935.157345 s**, and the
6.4/2.4 mass ratio gives **316.792 km/s Δv**. The engine caps propellant use
by both energy and wet-minus-dry mass. The reference assumes the entire decay
energy budget (an infinite-time upper bound) is used at fixed Isp.

The allowed first-order approximation applies that Δv as a **radial outward
impulse at the start** of a circular 1 AU solar orbit. Keeping its tangential
orbital speed gives v∞ = √(Δv² − μ☉/AU) = **315.388 km/s**, within the table's
315–320 km/s range. This geometry is explicit; a prograde impulse would give a
different escape speed. The preview propagates the resulting coast, not a
months-long powered flight. Gravity during thrust, steering, heat rejection
and Earth escape require a finite-thrust follow-up model. Po-210 supply
(0.4 kg, about four times world output), rapid decay, and the assumed 30%
direct-charge conversion versus a few percent demonstrated remain the
showstoppers. Concept E is labeled exotic and speculative, TRL 2–3.

The [Concept F scenario](../../prototype/spacekit/scenarios/scenario-f.json)
implements the chirped pellet check with `pelletStream` (see
[event notation](../ORBITAL_NOTATION.md#pelletstream)). The matching
`chirped_pellet_stream` function in `analysis/ideas_calc.py` extracts the
original calculation without changing its reference inputs: **10,000 pellets
of 0.375 g**, **3.75 kg** total, **2 kg probe mass**, **100 km/s** relative speed,
and **80% momentum-transfer efficiency** give **300 km/s Δv**. The
**317.7 km/s** in the table is solar v∞, not the stream's Δv. Reflected pellets
are expelled, so the probe mass stays constant; launch speeds must rise to
keep the relative speed fixed. The midpoint launch-energy sum over probe
speeds 0–300 km/s gives **131.25 GJ**, excluding initial heliocentric motion,
launcher inefficiency and ionisation energy.

The reference starts at solar escape speed at 5 AU (**18.837 km/s**) and
subtracts a conservative gravity-loss allowance μ☉ · (30 days) / (5 AU)²
(**0.615 km/s**). The scenario encodes this already-debited **18.223 km/s**
speed at the perihelion of an initial ellipse, then applies the full
300 km/s prograde equivalent impulse at 5 AU. It therefore gives
v∞ = √((v_escape + Δv − Δv_gravity)² − v_escape²) = **317.665 km/s**,
within 0.001 km/s of Python's rounded solar constants. This is the original
scalar speed budget, not a propagated 30-day powered flight; the preview
shows only the resulting coast, with delivery to 5 AU outside the model.
Aiming and ionising every pellet over AU scales remains the showstopper:
one un-ionised pellet destroys the probe. Concept F is exotic and
speculative, TRL 2.

### Pellet material (Concept F, issue #60)

**Recommendation: aluminium pellets, launched on separate reflective sail chips.**
This is a material choice for further study, not a demonstrated launcher or
reflector. Aluminium is noncryogenic, comparatively easy to handle, and has a
higher melting point than lithium or polyethylene. Its singly ionised plasma
needs a larger field region than lithium's, but a smaller one than iron's.
Use a low-absorption dielectric launch sail carrying the aluminium payload;
an aluminium sphere alone is a poor photon sail. If the sail is discarded,
steer it clear of the probe; if retained, include its mass and composition in
the intercepted pellet. The baseline budgets below include only the specified
pellet mass, with no allowance for launch sails or their disposal.

All derived numbers here come from `pellet_material_comparison` and
`pellet_launch_and_environment` in
[`analysis/ideas_calc.py`](../../analysis/ideas_calc.py). Inputs are explicitly
assumed where no engineering design exists. The baseline remains **10,000 ×
0.375 g**, **3.75 kg total**, **100 km/s approach speed**, **2 kg probe**, and
**0.8 of ideal reflected momentum**: **60 N s per pellet**, **300 km/s Δv**,
**317.7 km/s solar v∞**. A neutral pellet carries **1.875 MJ** in the probe's
frame; ionisation must finish upstream, with no solid core reaching the probe.

**Density and ionisation.** Diameters are equivalent solid spheres,
d = (6m/πρ)^(1/3), even when a launch package is flat. “Single” means removing
one electron from **every separated atom**, including every C and H/D atom in
plastic; charging a whole pellet once or making molecular ions is insufficient.
“Full” sums **all successive atomic ionisation energies**, not just the last
one. For each species, N = m f N_A/A and E = N e ΣI, using mass fraction f,
molar mass A in consistent units and I in eV. These are **atomic energy floors**
from neutral ground-state gas, excluding sublimation/vaporisation,
dissociation, heating, radiation, recombination and source/coupling losses.
For hydrogen, “single” and “full” both end at separated protons; this omits
breaking H₂. Deuterium uses hydrogen's atomic ionisation energy as an
approximation. Deuteration offers no assumed fusion gain.

| Material at the stated phase | Density (g/cm³) | Diameter at 0.375 g (mm) | Single (kJ/pellet) | Full (MJ/pellet) |
|---|---:|---:|---:|---:|
| Lithium, solid | 0.534 | 11.028 | 28.110 | 1.0609 |
| Aluminium, solid | 2.699 | 6.426 | 8.027 | 8.8572 |
| Polyethylene hydrocarbon, CH₂ reference grade | 0.890 | 9.301 | 99.201 | 2.7274 |
| Deuterated polyethylene, CD₂, estimated density | 1.01768 | 8.895 | 86.755 | 2.3852 |
| Coated iron: 95% Fe core + 5% Al shell by mass | 7.18517 | 4.637 | 5.265 | 21.7512 |
| Frozen H₂, near triple point | 0.08659 | 20.223 | 488.143 | 0.4881 |
| Frozen Ne, near triple point | 1.444 | 7.916 | 38.665 | 6.2964 |

Densities and metallic melting points are from the PDG material tables:
[lithium](https://pdg.lbl.gov/2024/AtomicNuclearProperties/HTML/lithium_Li.html),
[aluminium](https://pdg.lbl.gov/2024/AtomicNuclearProperties/HTML/aluminum_Al.html),
[iron](https://pdg.lbl.gov/2024/AtomicNuclearProperties/HTML/iron_Fe.html), and
[polyethylene](https://pdg.lbl.gov/2020/AtomicNuclearProperties/HTML/polyethylene.html).
The polymer grade matters: CD₂ density is **estimated** by multiplying the CH₂
density by its repeat-mass ratio at unchanged volume, not taken as a measured
material constant. The iron mixture assumes additive volumes; its Al shell
is **107.80 μm** thick. Frozen-H₂ density is from
[NBS Report 9796, §2.4](https://ntrs.nasa.gov/api/citations/19720005708/downloads/19720005708.pdf);
frozen-Ne density is the solid value used in
[CoolProp's melting-line correlation](https://coolprop.org/fluid_properties/fluids/Neon.html#melting-line),
not the liquid density. Ionisation inputs are tabulated stage by stage in
[NIST ASD 5.12](https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html):
[Li](https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&format=1&level_out=on&seq_out=on&shells_out=on&spectra=Li&unc_out=on&units=1),
[C](https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&format=1&level_out=on&seq_out=on&shells_out=on&spectra=C&unc_out=on&units=1),
[Ne](https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&format=1&level_out=on&seq_out=on&shells_out=on&spectra=Ne&unc_out=on&units=1),
[Al](https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&format=1&level_out=on&seq_out=on&shells_out=on&spectra=Al&unc_out=on&units=1),
[Fe](https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&format=1&level_out=on&seq_out=on&shells_out=on&spectra=Fe&unc_out=on&units=1).
Hydrogen's threshold is from [NIST's elemental data](https://physics.nist.gov/cgi-bin/Elements/elInfo.pl?context=frames&element=1);
deuterium mass is from [PDG](https://pdg.lbl.gov/2024/AtomicNuclearProperties/HTML/deuterium_liquid.html),
and physical constants are from [NIST CODATA](https://physics.nist.gov/cuu/Constants/index.html). Values checked
2026-10-24; extra output digits support reproduction, not engineering precision.

**Survival: laser launch, sunlight and ablation.** For a freely rotating,
isothermal sphere with equal solar absorptivity and thermal emissivity,
T = [S/(4σr²)]^(1/4). Taking
[NASA's 1 AU irradiance](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science)
S = 1361 W/m² gives **278.3 K at 1 AU**, **124.5 K at 5 AU**
(**54.44 W/m²** there). Actual T scales with (absorptivity/emissivity)^(1/4);
coatings, orientation, transient heating and sublimation change these estimates.
They are not survival guarantees or a sublimation-lifetime calculation.

| Material | Launch and coast assessment (inference from the phase/thermal constraints) |
|---|---|
| Lithium | Melts at **453.6 K**; requires protection from air/moisture in manufacture. Low absorption and a separate launch sail are essential. Ordinary coast sunlight is less demanding than the launch beam, but heating or asymmetric ablation can melt, fragment or deflect it. |
| Aluminium | Melts at **933.5 K** and is noncryogenic. A passivated payload is the practical baseline; a native oxide and any coating still require an extra ionisation/ablation budget. Separate the optical sail from the pellet's thermal design. Ablating only the surface leaves a lethal neutral core. |
| CH₂ / CD₂ | The ideal equilibrium melting point of polyethylene is **414.6 K**; actual grades soften/melt differently. Laser absorption can decompose, outgas or ablate it and change its aim. A separate reflective carrier helps; deuteration does not solve the thermal limit. Coast temperatures may be acceptable if optical properties allow, but UV degradation and mass loss need measurement. |
| Coated Fe | Iron melts at **1811 K**, but ferromagnetism disappears near **1043 K**; the assumed aluminium shell melts first. The coating can reduce absorption/oxidation, with measured optical properties still required. A cool core helps coilgun coupling; hot ionised iron has no useful bulk ferromagnetism. Complete core vaporisation is harder to guarantee than surface flash-off. |
| Frozen H₂ | Triple point **13.8033 K**: the grey-sphere estimate at 5 AU is far too warm. Needs shielding/refrigeration or a quantified short-flight sublimation budget. Direct laser heating and recoil from boil-off are especially problematic; weak solar absorption alone does not establish a lifetime. |
| Frozen Ne | Triple point **24.56 K**: also cryogenic far below the grey estimate. Chemically inert, but laser heating, sublimation and cryogenic containment remain penalties. A sacrificial shell adds mass and another plasma species. |

For phase references see the PDG links above,
[NIST polyethylene data](https://srd.nist.gov/JPCRD/jpcrd178.pdf),
[NIST iron thermal data](https://srd.nist.gov/jpcrdreprint/1.3253100.pdf), and
[ITS-90 hydrogen fixed point](https://www.nist.gov/si-redefinition/kelvin/kelvin-its-90)
/ [NIST neon phase data](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440019&Mask=4).
A launch sail's thermal balance is distinct from a coasting sphere:
T = [αI/(2εσ)]^(1/4) for equal emission from both faces. An **illustrative**
I = 1 GW/m², α = 10⁻⁵, ε = 0.5 per face gives **648 K**. This already exceeds
the Li and polymer limits if thermally coupled to them. These are assumed
optical properties, not properties asserted for aluminium. Beam stability,
attachment loads and heat transfer still need design; see the experimental
and modelling context in
[the flexible lightsail study](https://www.nature.com/articles/s41467-024-47476-1).

**Magnetic reflection is a plasma problem.** With ion mass A u and charge z e,
r_L = A u w/(z e B). The following compares **100 km/s** transverse motion in a
**local 10 mT field**, not a specified sail coil or its field at large distance.
Each entry lists the singly charged state followed by the bare nucleus.

| Material / ion species | A/z (u per elementary charge), single → full | r_L (m), single → full | Self-collision mean free path (m), singly charged example below |
|---|---|---|---|
| Li | 6.940 → 2.313 | 0.719 → 0.240 | 0.371 |
| Al | 26.982 → 2.076 | 2.796 → 0.215 | 1.443 |
| CH₂: C; H | 12.011 → 2.002; 1.008 → 1.008 | 1.245 → 0.207; 0.104 → 0.104 | 0.750; 0.375 |
| CD₂: C; D | 12.011 → 2.002; 2.014 → 2.014 | 1.245 → 0.207; 0.209 → 0.209 | 0.858; 0.429 |
| Fe core; Al shell | 55.845 → 2.148; 26.982 → 2.076 | 5.788 → 0.223; 2.796 → 0.215 | 3.144; 28.862 |
| H₂: H | 1.008 → 1.008 | 0.104 → 0.104 | 0.054 |
| Ne | 20.180 → 2.018 | 2.091 → 0.209 | 1.079 |

The collision column assumes the entire pellet is uniformly expanded into a
**10 m radius** sphere, **T_i = 10 eV**, **ln Λ = 10**, **z = 1**. With
n_i = N_i/(4πR³/3), use the thermal ion self-collision estimate
ν_ii = 4.80×10⁻⁸ z⁴ n_i ln Λ/(√μ T_i^(3/2)) s⁻¹, with n_i in cm⁻³ and
μ = m_i/m_proton, from the
[2023 NRL Plasma Formulary, pp. 28–29](https://homepage.physics.uiowa.edu/~ghowes/teach/phys4731/resources/NRL_Plasma_Formulary_2023.pdf).
Here the quoted path is explicitly defined as √(2kT_i/m_i)/ν_ii. Mixture
entries include **only self-collisions** at each constituent's density;
cross-species collisions and ion–neutral charge exchange are not calculated.
Neither the cloud size nor its temperature is predicted by an ablation model.
The directed approach energy is not the random thermal temperature.

For Al this gives n_i ≈ **1.998×10¹² cm⁻³**, ν_ii ≈ **5.86×10³ s⁻¹**, and a
path shorter than the cloud: independent particle orbits are not sufficient.
At **100 m radius**, density and rate fall by the volume ratio, giving
**1.998×10⁹ cm⁻³**, **5.86 s⁻¹**, and a **1443 m** path at the same assumed
charge/temperature. Dilution can reduce collisions, but demands capture of
a much wider cloud; a real coil's field also falls with distance. At fixed
n_i and T_i the rate scales as z⁴; the bare-nucleus radii do not imply an
otherwise unchanged, collisionless, fully stripped cloud.

The 10 m example has **895 Pa** directed ram pressure ρw², versus only
**39.79 Pa** magnetic pressure B²/(2μ₀) at 10 mT, over a **0.200 ms** cloud
crossing. This is a warning that the field must withstand the pulse; these
illustrative dimensions are **not a reflector design**. Collective electric
fields, field exclusion, electron coupling, recombination, neutrals,
geometry and pulse heating determine actual capture and reflection. Small
ion gyroradii help; they do not establish a magnetic mirror loss cone or a
reflection efficiency. A magnetic mirror along converging field lines also
needs a suitable pitch angle, whereas a transverse field can bend particles.
[Particle simulations of magnetic sails](https://www.jstage.jst.go.jp/article/jsts/20/2/20_2_26/_article)
show why ion orbit size relative to the interaction region matters.

Thus Li⁺ and H⁺ turn most tightly, Al⁺ and Ne⁺ are intermediate, Fe⁺ needs the
largest region, and CH₂/CD₂ fragments have different orbits. The light species
also have higher thermal self-collision rates in this equal-mass, equal-volume
example; **no material earns an assumed 80% from these estimates**. Full
stripping makes the heavier species' A/z similar, at substantial energy cost.
A cold ferromagnetic core is useful to a launcher, not a substitute for
ionisation at the probe. The recommended Al plasma need not be fully stripped,
but its neutral fraction and charge distribution must be controlled.

**Launch scheme and chirp.** In the existing simplified launcher frame,
v_launch = v_probe + w: as the probe gains **0–300 km/s**, launch speeds rise
approximately **100–400 km/s**. Schedule these speeds against the **arrival**
state, including flight time and solar dynamics in a future delivery solution;
this arithmetic is not a solved firing schedule from Earth to 5 AU.
Per-pellet launch KE spans **1.875–30.000 MJ**, and its midpoint sum is
**131.25 GJ**. This excludes the initial heliocentric speed, sail mass,
launcher inefficiency, ionisation and heating.

- **Laser-driven sail chips (recommended baseline to investigate):** accelerate
  a reflective carrier with the Al pellet attached. Do not focus launch light
  onto the bare pellet and expect it to stay intact. For a single-pass,
  perfectly reflecting sail, momentum requires E_light ≈ m c v_launch/2 at
  these nonrelativistic speeds: **5.621–22.485 GJ per pellet**, or **140.531 TJ**
  over the chirped stream. The **131.25 GJ is pellet KE, not laser input**.
  Power, aperture, pointing, optical properties, carrier mass and separation
  can only worsen that ideal budget; photon recycling would be a different
  architecture. Ablative launch can change the photon-momentum limit by
  expelling reaction mass, but must budget that propellant, lost pellet mass
  and recoil errors separately.
- **Coilgun alternative:** an Fe core couples ferromagnetically while cool;
  conducting Al can instead use an induction launcher, with eddy-current
  heating and switching constraints. At an assumed constant **10,000 g**,
  L = v²/(2a) gives **50.99–815.77 km** of acceleration length for the speed
  range. This is geometry, not an achievable launcher specification. Core
  saturation, pulse timing, structural stress and heating remain unmodelled;
  neither route is demonstrated at the required speeds.

### Arrival beam and magnetic reflector (Concept F, issue #65)

**Which beam, where, and when?** An architecture to investigate is a **pulsed
laser carried by the probe, aimed upstream at the incoming pellet stream**.
It is separate from the distant laser that launches the sail chips. The
arrival beam heats the pellets, not the probe. Repeated or shaped pulses
would have to vaporise the core as well as the surface, then ionise the
vapour; merely charging the solid sphere does not make its atoms steerable.
An onboard ultraviolet conversion laser is also proposed in
[Kare's SailBeam NIAC report, pp. 21–25](https://www.niac.usra.edu/files/studies/final_report/597Kare.pdf).
That study concerns thin microsails, not these much heavier solid Al spheres;
it provides architectural context, not validation of this arrival budget.
An electron beam is an alternative local heater/ioniser, but its deposition
depth, space charge, return-current/charge balance and deflection by the
probe's own field also need design. Neither beam has demonstrated this
whole-pellet conversion. Putting the heater on an upstream station moves
its power hardware off the probe, but requires that station to track the
accelerating encounter region. Ionising at the distant launcher instead
would let the cloud spread throughout the long delivery flight. These are
architecture inferences, not specifications established by the sources.

`pellet_arrival_budget` in [`ideas_calc.py`](../../analysis/ideas_calc.py)
uses the same 10,000 aluminium pellets and an **assumed uniform arrival rate
over 30 days**: **0.003858 shots/s**, or **one every 259.2 s**. This is an
average-rate equivalent, not a solved launch schedule. We choose **10 μs**
of heating per shot to expose the pulse-power requirement; a longer pulse
reduces that power but lets the pellet travel farther while being heated.

| Al energy budget per 0.375 g pellet | Energy | Average over arrivals | Power during a 10 μs pulse |
|---|---:|---:|---:|
| Remove one electron from every atom, atomic floor | 8.027 kJ | 30.97 W | 0.803 GW |
| Remove all 13 electrons per atom, atomic floor | 8.8572 MJ | 34.17 kW | 0.886 TW |
| Single ionisation + illustrative atomisation and heat | 52.84 kJ | 203.85 W | 5.284 GW |
| Full stripping + illustrative atomisation and heat | 9.1434 MJ | 35.28 kW | 0.914 TW |

The floors use the [NIST Al ionisation thresholds](https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&format=1&level_out=on&seq_out=on&shells_out=on&spectra=Al&unc_out=on&units=1)
already tabulated above. For an illustrative extra heat allowance, take
**T_e = T_i = 10 eV**, with 1.5 N e (T_i + z T_e) of random kinetic energy:
**40.23 kJ** for z = 1, **281.61 kJ** for z = 13. Add a rough **4.582 kJ**
phase-change allowance using **329.70 kJ/mol** for Al(s) → Al(g) at 298 K
from [NIST-JANAF via the Chemistry WebBook](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7429905&Mask=1).
This combines an enthalpy scale and a thermal-energy estimate, not an exact
heating path. Full stripping is a comparison, **not needed for reflection**;
10 eV does not establish or maintain Al¹³⁺ in equilibrium. All powers in the
table are deposited-energy requirements (pulse averages, not measured peak
waveforms). Source power must be divided by deposition efficiency; electrical
input also includes laser/electron-source efficiency. Radiation, recombination,
expansion work and coatings add costs. The small duty factor **3.858×10⁻⁸**
does not make the pulse source, energy storage or heat rejection fit a 2 kg probe.

**Why every atom matters.** A neutral core or fragment is not turned by the
ion reflector. At **100 km/s**, ½w² is **5 GJ/kg = 5 MJ/g**, not the
5 MJ/kg = 5 kJ/g quoted in issue #65. A **1 g** fragment carries the energy
of about **1.19 kg of TNT** using 4.2 kJ/g TNT, and the reference **0.375 g**
pellet carries **1.875 MJ**. TNT equivalence compares energy only, not blast
or impact coupling. Convert the whole intercepted mass and keep it ionised;
any surviving neutral matter must safely miss the spacecraft. Fault detection
and diversion before impact remain unsolved, not an assumed safety system.

**Time to spread.** Pressure from hot electrons and ions makes the released
cloud expand. With singly charged Al and the assumed temperatures, an
isothermal-electron, adiabatic-ion fluid estimate is
c_s = √[e(z T_e + (5/3)T_i)/m_Al] = **9.765 km/s**. The
[NRL Plasma Formulary, pp. 26–29](https://homepage.physics.uiowa.edu/~ghowes/teach/phys4731/resources/NRL_Plasma_Formulary_2023.pdf)
gives the underlying sound, gyro and magnetic-pressure scales. Taking
R ≈ c_s t, a **10 m radius (20 m diameter)** cloud needs about **1.024 ms**.
At 100 km/s, finish the heating pulse about **102.4 m upstream of the intended
magnetic interaction region**; start it another **1 m** upstream for a 10 μs
pulse. This distance is to the interaction region, not the hull. Light-travel
and tracking delays must also enter a real firing solution. Holding temperature
constant makes this a characteristic size/timing estimate, not an ablation
simulation: cooling, initial plume velocity, nonuniformity, continued heating
and recombination change the result. A cloud has no sharp edge. Earlier
ionisation allows more spreading but demands a wider magnetic capture region.

**How the push reaches the probe.** The proposed reflector is a superconducting
current loop (a magsail), or several coils arranged as a magnetic mirror.
Its field applies q v × B to ions; the electron/ion plasma also develops
currents and electric fields. Those plasma fields exert the reaction force
on the coil's current: dF = I dℓ × B_plasma (or J_coil × B_plasma per volume).
The coil's supports transmit the load to the spacecraft. Its own field alone
does not provide a net thrust. These are the
[Lorentz-force relations, MIT §8.2–8.5](https://web.mit.edu/8.02t/www/802TEAL3D/visualizations/coursenotes/modules/guide08.pdf).
In the instantaneous probe frame, reversing the pellet's longitudinal
velocity from +w to −w changes its momentum by **2mw = 75 N s**, versus
**mw = 37.5 N s** for stopping/absorption. The reference 80% gives **60 N s**
per shot and a mean **0.2315 N**; spread over the **0.200 ms** cloud crossing,
the load scale is **300 kN**, not a steady gentle push. Actual pulse shape
requires a plasma calculation. A static field redirects particle motion;
the probe gains energy from the moving stream in the launcher frame.

`pellet_reflector_budget` computes **895.25 Pa** ram pressure ρw² for a
uniform 10 m radius cloud, versus **39.79 Pa** magnetic pressure at **10 mT**.
Matching these scales requires **47.434 mT locally**, not just at the winding.
This is only a pressure-balance scale: planar full reversal can require a
**2ρw²** stress scale, corresponding to **67.08 mT**, before geometry and
margin. At 47.434 mT, transverse Al⁺ has **r_L = 0.590 m** (Al¹³⁺: **0.0453 m**)
and a nominal half-orbit time **18.52 μs**. At 10 mT Al⁺ instead has a
**2.796 m** radius. Collisions and collective response discussed above still
apply. Axial motion parallel to the field is not bent by q v × B; a mirror
needs suitable pitch angles and slow field variation along a gyro orbit.
Neither pressure balance nor small gyroradius proves the assumed 80% reflection.

**Coil cost, with its assumptions exposed.** Consider one round loop of
**10 m radius**. The vacuum field on its axis is
B(z) = μ₀ I R²/[2(R² + z²)^(3/2)], so B(0) = μ₀ I/(2R), from
[the circular-loop Biot–Savart derivation](https://openstax.org/books/university-physics-volume-2/pages/12-4-magnetic-field-of-a-current-loop).
For scale only, choose **100 A/mm²** conductor current density and
**8960 kg/m³**, [copper's density](https://pdg.lbl.gov/2024/AtomicNuclearProperties/HTML/copper_Cu.html).
This is a copper-density mass proxy, not a superconducting cable rating or
a viable resistive-copper operating point. Area = I/J, conductor radius
a = √(area/π), and mass = 2πR × area × density. The thin-wire external
inductance estimate L ≈ μ₀R[ln(8R/a) − 2] and U = ½LI² use the
[round-loop model with negligible internal flux](https://pmc.ncbi.nlm.nih.gov/articles/PMC3216619/).

| Required field at the specified point | Single-turn current | Conductor mass proxy | Stored field energy |
|---|---:|---:|---:|
| 10 mT at loop centre | 159 kA | 896 kg | 0.983 MJ |
| 47.434 mT at loop centre | 755 kA | 4250 kg | 19.33 MJ |
| 47.434 mT on axis, 10 m upstream of centre | 2.135 MA | 12,021 kg | 139.74 MJ |

At one loop radius upstream, the field is only **0.354** of its centre value;
centre field cannot be promised throughout the cloud. The last row illustrates
that falloff, not a reflector geometry for axial ions. More turns reduce
current per turn while retaining the required ampere-turns; at fixed current
density and radius they do not remove the conductor mass scale. Real designs
need field mapping, structural restraint, insulation, cryogenics, charging
and quench protection. Stored energy is a startup/reservoir requirement,
not energy consumed afresh on every reflection. These costs are absent from
the illustrative **2 kg** probe budget: **the example does not establish a
mass-feasible reflector or pulse laser**. The original **300 km/s Δv** and
**317.7 km/s solar v∞** remain conditional momentum-budget results, not a
validated mission. Launching, aiming, creating and reflecting every plasma
pulse remains the TRL 2 showstopper.

## Seeded idea 1: antimatter
- 1 kg at 300 km/s carries 4.5×10¹⁰ J. A beamed-core engine (v_e ≈ 0.33c, η ≈ 0.1 to jet) needs ~**2.5 mg** of antiprotons, a tiny propellant fraction.
- Production: ~10 ng/yr worldwide (CERN AD/ELENA) → 2.5×10⁵ years. Storage: ~10³ trapped anti-H atoms or ~10⁵ p̄ for months in Penning traps.
- Thermal/solid-core: v_e ≈ 10 km/s means MR ≈ 10¹³ for a direct 300 km/s; no better than NTP inside the Oberth stack.
- Verdict: physically elegant, but production and storage are 10¹³× short. No-go.

## Seeded idea 2: lunar centrifuge, with lunar add-ons
**Rotor strength sets the tip speed.** For a uniform-stress tapered arm, v_tip = √(2(σ/SF)/ρ · ln(A_root/A_tip)), with SF 1.5:

| Material | constant section | taper 10 | taper 100 | v∞ vs. Earth (taper 10, prograde) |
|---|---|---|---|---|
| CFRP T1100 (3.5 GPa laminate) | 1.71 | 2.59 | 3.66 | 1.46 km/s |
| Zylon PBO (5.8 GPa) | 2.23 | 3.38 | 4.78 | 3.10 km/s |
| CNT yarn, near-term (10 GPa) | 3.20 | 4.86 | 6.87 | 5.06 km/s |
| CNT ideal bundle (40 GPa) | 6.41 | 9.72 | 13.75 | 10.34 km/s |
| Lunar anhydrous glass fiber (Antigravity, 7.5 GPa allowable, K=1.6) | 2.98 | | | |

**Lunar escape** is 2.376 km/s; v∞ relative to the Moon = √(v_tip² − 2.376²). After that come the Moon's orbital speed (1.02 km/s) and Earth escape from lunar distance (1.44 km/s).

**Probe g-load** is a = v²/R. For a hardened 1 kg probe (gun-hardened electronics: 10⁴–10⁵ g):

| g-limit | 2.5 km/s | 4 km/s | 7 km/s |
|---|---|---|---|
| 10,000 g | R ≥ 64 m | 163 m | 500 m |
| 20,000 g | 32 m | 82 m | 250 m |
| 100,000 g | 6 m | 16 m | 50 m |

**Add-ons the Moon offers, quantified where possible:**
- **No atmosphere:** no vacuum chamber, seals, or aerodynamic heating at release. The tip-speed ceiling becomes purely a strength limit (table above), compared with Earth SpinLaunch, which needs a chamber plus an aeroshell to leave the atmosphere.
- **1/6 g, 2.38 km/s escape:** escape costs 2.38 km/s, against 11.2 km/s from Earth plus about 1.5 km/s of drag and gravity losses. Gravity sag on the rotor and a 22 m anchor mirror is 6× smaller.
- **Lunar night (~14.8 d at ~100 K) and permanently shadowed craters (~40 K):** a 300 K rotor radiates ~459 W/m² to the night sky, which handles bearing, motor and windage heat in batches. REBCO HTS motors and magnetic bearings run at 20–77 K. Night at 100 K is not quite cold enough, so a small cryocooler is needed, or the system is sited in a permanently shadowed crater, where it runs passively.
- **Energy is trivial:** 2.2 kWh per kg at 4 km/s. Strength is the limit, not power. Polar peaks of near-continuous sunlight can charge storage (flywheel or superconducting magnetic) for night-time shots.
- **Regolith and bedrock:** regolith serves as counter-rotor ballast so a 1 kg release leaves no net imbalance. A bedrock-anchored hub absorbs the recoil (the photon catapult uses the same trick and saves ≥560 t).
- **ISRU anhydrous silicate fiber (Antigravity):** 2.98 km/s versus 2.60 km/s for imported CFRP (checked), with >95% of rotor mass made locally.
- **Quiet release platform (Antigravity):** the Moon is seismically very quiet and rotates slowly. The modelled release error is 0.45 mm/s, which saves ~50 g of trajectory-correction mass. Gain is small; latch timing dominates.
- **Staging:**
  - A centrifuge (~3 km/s) followed by an HTS mass-driver rail adds the two speeds; a 10 km rail at 10⁴ g gives ~14 km/s, but the g-load then sets the rail length.
  - Release timed for an Earth flyby, or for the retrograde perigee dive below.
  - A tether catch: a stack released at ~2.5 km/s and caught by a lunar-orbit rotovator. Tethers are covered in Concept A/C.
- **Retrograde Earth-perigee Oberth dive (Antigravity):** launch backwards against the Moon's motion, fall to a 300 km perigee at 10.89 km/s, then fire a 6 km/s kick stage → v∞ 12.88 km/s relative to Earth. The fair gain over a direct prograde kick is **+3.07 km/s** (agent said +3.93, but compared against v∞ relative to the Moon ⚠ +28%).
- **What survives to v∞:** with the stack's solar dive, any v∞ relative to Earth must first shed ~24 km/s to reach 4 R☉, so the centrifuge adds ~0 km/s directly to the final speed. Its value is replacing the chemical first stage, a ×1.6–3.1 mass-ratio saving, and launching the Oberth stack cheaply. It is an enabler, not the 300 km/s engine.

## Agent number checks (>20% flagged)
| Agent | Idea | Agent value | Checked | Flag |
|---|---|---|---|---|
| Claude | Cavity catapult | 307 km/s, 390 MW, 2.8×10¹¹ J | 306.9, 392, 2.80×10¹¹ | ok |
| Claude | Po-210 ion drive | Δv 317, v_e 323, 71 kV | 317, 323, 71 | ok |
| Codex | Pellet slipstream | 317.7 km/s, ~150 GJ | 317.7, 131 GJ | ok (−13%) |
| Codex | Solar-wind bank shot | 370.7 km/s, 4.4×10¹⁰ m² | 370.7, 4.37×10¹⁰ | ok |
| Antigravity | FFRE perihelion burn | 247.7 | 240.6 (bound inbound leg) | assumption ⚠ (−3%) |
| Antigravity | Coronal laser | 240.1 / 299.1 | 240.1 / 299.1 | missing showstopper ⚠ (7 km aperture) |
| Antigravity | MagLIF kicker | v_e 300→85 km/s, v∞ 312 | v_e 9.5 (4.2 alpha-only), v∞ 62–96 | **⚠ ×32 on v_e, ×3–5 on v∞** |
| Antigravity | Lunar glass rotor | 2.98 km/s | 2.98 | ok |
| Antigravity | Perigee dive gain | +3.93 km/s | +3.07 | ⚠ +28% |
| Antigravity | FFRE lunar riff, ablator riff, ³He riff | +39, +48, 448 km/s | not derivable from stated inputs | unverified |
