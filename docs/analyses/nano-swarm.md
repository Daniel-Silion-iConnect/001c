# Nano-swarm: divide the vehicle, not the physical obligations

Issue #74. **Verdict:** a swarm is useful for independent flyby measurements and
redundancy. Dividing a kilogram into chips does **not** automatically increase
speed, deliver a kilogram intact, brake at the destination, or create a factory.
Concept H is a conditional **300 km/s sundiver flyby swarm**, with one chip shown
in the viewer. The best fast architecture is a laser-launched flyby swarm; a
captured, self-assembling seed remains a research proposal without a closed design.

This is an agent-brainstorm-style analysis: propose architectures, state their
favorable assumptions, challenge them with budgets, then rank what survives.
It is one Codex analysis, not a claim of independent agent consensus. ISRU,
replication and destination beam infrastructure are evaluated as later stages.

## Reproduce and interpret

```sh
npm ci && npm test
python3 analysis/ideas_calc.py
```

The stdlib functions `nano_solar_chip`, `nano_laser_speed`, `nano_laser_shot`,
`nano_swarm_launch`, `nano_kinetic_energy`, `nano_dust_column`, `nano_redundancy`,
`nano_arrival`, `nano_seed_chips`, `nano_optical_link`, `nano_claims_budget`,
and `nano_magsail_brake` live in
[`analysis/ideas_calc.py`](../../analysis/ideas_calc.py). `NanoSwarmTests` checks
energy/momentum conservation, moving-mirror time against independent quadrature,
scaling, heat, dust columns, probability, arrival errors and aperture scaling.
`tests/nano-swarm.test.mjs` puts those tests on CI and checks Concept H's meaning.

Here a **chip mass is its entire non-sail vehicle allocation**: science,
power, receiver, controls, shielding and any propulsion. A kilogram of such
chips excludes sail mass; it is not a kilogram of scientific instruments alone.
Delivery stages must separate or join the accelerated mass budget. Laser examples
use their own explicitly stated sail mass; solar examples use Concept G's mirror.
The solar calculator retains the existing rounded solar constants; interstellar
and relativistic calculations use exact c = 299,792,458 m/s, Julian years and
1 ly = c × 365.25 days. Times are in the Earth/target rest frame, neglecting
stellar motion and acceleration/braking unless stated. No target intercept is
solved by the viewer's illustrative ecliptic escape trajectory.
The solar bounds use a point-source Sun and constant radial optics, without
finite-disc corrections, coronal plasma forces or changing material properties.
Reported numerical precision is for reproducibility, not engineering accuracy.

## Proposal 1: smaller vehicles, the same sundiver

For normal illumination and constant optical fractions, let σ include **all**
accelerated mass per sail area, and Cᵣ = 2R + α. Then

β = Cᵣ S₁ AU² / (c μ☉ σ).

Thus radiation acceleration scales as 1/σ. For an inbound ellipse with
perihelion q and aphelion Q, deploy a radial sail at perihelion and retain it:

v∞² = −2μ☉/(Q+q) + 2βμ☉/q.

For a parabolic arrival the first term is zero. Consequently v∞ approximately
scales as σ⁻¹ᐟ², **not** σ⁻¹. Splitting both mass and area by N preserves σ,
β and v∞. Geometrically similar solid objects have A/m ∝ N¹ᐟ³; an attached
thin sail instead has a nonzero surface-mass floor. Neither argument yields
speed proportional to N. These are derived energy/momentum results; the
[Concept G analysis](orion-and-sundiver-hybrid.md) documents the approach-energy,
optical and thermal assumptions and links its underlying sail studies.

Use q = **3 R☉**, Q = **5.204 AU**, R = 0.9, α = 0.1, distributed sail/support
mass **0.5 g/m²**, and ε = 0.8 per face. At **2.04762 g/m² total**, β ≈ 0.710368,
v∞ ≈ **300 km/s**. The following solar rows are energy bounds at fixed q;
β > 1 rows exceed the current engine's attractive-conic solver.

| Total σ (g/m²) | Solar β | Solar v∞ (km/s) | Ideal laser speed (km/s) |
|---:|---:|---:|---:|
| 0.75 | 1.93942 | 496.29 | 5,243.41 |
| 1 | 1.45456 | 429.70 | 3,949.92 |
| 2.04762 | 0.710368 | 300.00 | 1,942.16 |
| 5 | 0.290913 | 191.46 | 798.42 |
| 10 | 0.145456 | 134.75 | 399.74 |

The laser column assumes a separate **perfect mirror**, full capture of a
constant **1 GW/m²** source-frame beam over **600 s of sail acceleration**,
using the relativistic moving-mirror equations below. These are departure
speeds from rest, approximately interstellar cruise speeds at these values;
they exclude solar escape and are not full trajectory v∞ calculations.
The solar optics would absorb too much laser power: at α = 0.1 and the same
emissivity, 1 GW/m² gives roughly **5,762 K**. A laser-specific α = 10⁻⁵,
ε = 0.5 per face instead gives **648 K** at rest. Keeping such properties
across Doppler shift is an additional material assumption.

At Concept G's fixed total σ, the solar speed/temperature are independent of
chip size. These mass/area allocations are **requirements**, not demonstrated
sails or autonomous chips:

| Chip allocation | N for 1 kg | Sail area per chip | Square side | Total sailcraft per chip |
|---:|---:|---:|---:|---:|
| 1 mg | 1,000,000 | 0.00064615 m² | 2.54 cm | 1.32308 mg |
| 10 mg | 100,000 | 0.0064615 m² | 8.04 cm | 13.2308 mg |
| 100 mg | 10,000 | 0.064615 m² | 25.42 cm | 132.308 mg |
| 1 g | 1,000 | 0.64615 m² | 80.38 cm | 1.32308 g |

All four give **300 km/s and 1,666 K**, with **646.15 m² total sail** and
**1.32308 kg total fleet mass**. Ordinary electronics cannot be assumed to
operate at the sail temperature. Thermal isolation, shading, heat leakage,
actuators and deployment must fit the chip budget. The radiative balance is
α S(q) = (εf+εb) σSB T⁴: small size alone does not cool an illuminated sheet.
A **900 K** assumed limit with the same optics moves q to **10.28 R☉**;
recompute departure energy there rather than retaining the 3-R☉ speed.
Coronal exposure, sublimation and hot strength remain outside this balance.

## Proposal 2: Starshot-like laser shots, with no free energy

[Breakthrough's concept](https://breakthroughinitiatives.org/concept/3) describes
gram-scale probes, meter-scale sails, a roughly 100 GW beamer and acceleration
within minutes. For a quantitative design, [Parkin (2018), Tables 1–2](https://arxiv.org/html/1805.01306v3)
uses **1 g instrumentation**, **3.6 g total sailcraft**, **4.1 m diameter**,
**0.2c**, **200 GW maximum transmitted power**, **480 s emission**, **550 s
acceleration**, and **63 GWh stored electricity per shot**. Therefore the
issue's “1 g, 100 GW, 10 min, 4 m” is reasonable shorthand, but mixes payload
and total mass and is not a consistent single design point. These are proposed
system performance numbers, not flight records.

For our explicitly ideal, perfectly reflecting one-dimensional mirror, define
b = v/c, γ = (1−b²)⁻¹ᐟ², u = γ(1+b). With constant emitted power P,

Eopt = mc²(u−1)/2; KE = (γ−1)mc²;

temit = Eopt/P; taccel = mc²[(u³−1)/3 + (u−1)]/(4P);

x = c(taccel−temit).

Reflected photons carry Eopt−KE away; their outgoing momentum plus the
vehicle momentum closes conservation. The force is
F = (2P/c)(1−b)/(1+b), not constant 2P/c at relativistic speed.
At 0.2c, **one gram total** needs **2.80543 GWh optical**, **100.995 s
emission** and **113.195 s acceleration** at 100 GW. This lower bound is
less than the published system because it omits finite reflection, incomplete
capture, thermal throttling, atmospheric/optical losses and support mass.

### Split the same kilogram: specify what the array holds constant

For this table only, sail mass equals chip allocation: **1 kg chips + 1 kg
sails = 2 kg**, target **0.2c**, one shot per chip, **100 GW perfectly captured**,
50% assumed wall-to-optical conversion, continuous operation. Costs assume
**$0.10/kWh** electricity and exclude the array, spacecraft and delivery.

| Chip mass | Shots N | Ideal emission / acceleration per chip | Array emission total | With 60 s turnaround per shot |
|---:|---:|---:|---:|---:|
| 1 mg | 1,000,000 | 0.202 / 0.226 s | 2.338 days | 696.78 days |
| 10 mg | 100,000 | 2.020 / 2.264 s | 2.338 days | 71.78 days |
| 100 mg | 10,000 | 20.199 / 22.639 s | 2.338 days | 9.28 days |
| 1 g | 1,000 | 201.991 / 226.389 s | 2.338 days | 3.03 days |

Each fleet has **3.70660×10¹⁵ J KE**, **5,610.85 GWh optical**,
**11,221.70 GWh electrical**, costing **$1.122 billion** at that tariff.
Splitting does not reduce those totals. A true **1 kg total sailcraft** fleet
halves them but then cannot contain 1 kg of non-sail chips. Duty cycle d divides
calendar throughput by d; recharge power and weather also limit the cadence.
Photons already en route need not keep a steerable source occupied, hence the
array-time column uses emission time, not acceleration time.

**Challenge:** full 100 GW on ever-smaller sails is not thermally or optically
scale invariant. If dimensions shrink as √mass at fixed σ and allowed irradiance,
power must shrink with mass, so acceleration time stays constant. For the same
ideal 1:1 fleet, scaling **202 s** emission per chip gives **2.338 days** for
1,000 gram chips but **2,337.85 days (6.40 yr)** for a million milligram chips,
at identical total energy; unused array power needs parallel beams to improve
throughput. Diffraction and pointing do not disappear with parallelization.
At λ = 1 μm and range 10¹⁰ m, putting the first Airy null inside a 2 m sail
radius requires D ≳ 1.22 λ L/r ≈ **6.1 km**; a 1,000-fold smaller mass at
fixed σ reduces radius by √1000 and would require **193 km** at that range.
Actual acceleration distance changes with power and mass, so these are a
fixed-range comparison, not a designed array specification.

Alternatively keep a 4.1 m sail with **0.2 g/m² sail mass** and 100 GW for
600 s. It weighs **2.641 g before any chip**. Our perfect-mirror speeds for
1 mg, 10 mg, 100 mg and 1 g chips are **0.33065c, 0.32992c, 0.32282c and
0.26560c**: the sail mass floor saturates the gain. This is not a revision of
Parkin's 70%-reflective, temperature-limited design.
For a fixed 1 kg chip allocation these correspond to N = 1,000,000, 100,000,
10,000 and 1,000, respectively, but accelerated fleet mass is now
1 kg + N × 2.641 g: about **2,642 kg** at the milligram end versus **3.641 kg**
at the gram end. Keeping a large sail on every smaller chip changes the fleet
mass and energy budget; it is not a comparison of equal launched total masses.

For **1,000 published Parkin shots**, use **63,000 GWh stored electricity**,
**133.3 hours source emission** (152.8 h cumulative acceleration), about
**$6.3 billion** in electricity and **3.6 kg fleet mass** carrying 1 kg of
instrumentation. Perfectly homologous milligram scaling preserves the energy
but multiplies sequential launch time by 1,000, to **15.2 yr emission**;
that extrapolation is not a demonstrated system. The simplified calculator
and the published point design are separate budgets.

## Adversarial review: interstellar attrition

A **1 μg grain is 10⁻⁹ kg**, not 10⁻⁶ kg. Relativistic KE gives:

| Relative speed | Energy per 1 μg grain | KE per incoming proton |
|---:|---:|---:|
| 0.2c | **1.85330 MJ** | **19.35 MeV** |
| 0.001c | **44.9378 J** | **469 eV** |

The high-speed grain releases about 41,241 times as much energy. Coupling,
penetration and ejecta determine damage; these are incident energies.
Slowing to 0.001c does not make every grain harmless.

[Hoang et al. (2017), §§V–VII](https://arxiv.org/html/1608.05284v2) use a
standard gas/dust mass ratio near **100** and discuss both grain-size and
large-grain-tail uncertainty. Their 0.2c model predicts about **0.5 mm erosion**
at NH ≈ **3×10¹⁷ cm⁻²**, with material dependence; heavy gas ions also create
damage tracks. This is not a measured chip survival probability. Do not extend
the erosion depth to 0.001c simply by dividing by v²: stopping, sputtering,
melting and crater physics change with speed.

Our explicit reference environment is nH = **0.1 cm⁻³**, gas mass per H nucleus
**1.4 mp** including helium, and dust/gas mass ratio **0.01**. Over **4.24 ly**:

ρdust = **2.342×10⁻²⁴ kg/m³**; Σdust = **9.393×10⁻⁸ kg/m²**;
NH = **4.011×10¹⁷ cm⁻²**.

For **1 mm² forward area**, if all dust mass were in ρgrain = 3000 kg/m³
spheres, expected hits Σdust A/mgrain would be **7,475 at radius 0.1 μm**,
**7.475 at 1 μm**, or **9.39×10⁻⁵ if all grains weighed 1 μg**. These are
**alternative monodisperse sensitivities**, not simultaneous populations or
predicted counts of lethal hits. For a 1 μg tail containing fraction f of dust
mass, its hit expectation is **9.39×10⁻⁵ f**; density alone cannot determine f.
At fixed path length counts do not depend on speed; collision rate per second
does. A deployed **0.646 m²** sail sweeps **646,000 times** the reference area.
It can tolerate some holes, but an intact sail for later braking is a different
requirement from a protected chip coasting edge-on.

For an **illustrative** lethal class with radius 1 μm and dust mass fraction
f = 0.01, λlethal = 0.07475 and dust-only Poisson survival exp(−λ) = **0.9280**.
Calling those grains lethal is an assumption. Folding/jettisoning sails,
minimizing frontal area, and adding sacrificial shields trade mass against
risk. A 0.5 mm, 2200 kg/m³ layer over 1 mm² alone weighs **1.1 mg**; over
0.646 m² it weighs **0.711 kg per chip**. Redundancy does not repair a shared
lack of shielding.

Radiation review also includes galactic cosmic rays, stellar flares near the
Sun/Proxima, displacement damage, total dose, memory errors, charging and
single-event upsets. Redundant memory/ECC and shielding require hardware mass
and power. A 4,237-year cruise accumulates exposure and aging far longer than a
21.2-year cruise. No sourced all-cause survival fraction exists for these
specified hypothetical chips; assigning one as an established number would
be misleading. The per-proton table is a particle-energy scale, not an absorbed
dose or reliability model.

If independent all-cause survival **s** is assumed, N launch yields Ns expected
survivors; delivering a given **expected** mass needs launch redundancy **1/s**:

| Assumed s | Expected mass multiplier | Launches for ≥1 survivor at 99% | Copies of each of 1,000 unique roles for 99% whole-kit success |
|---:|---:|---:|---:|
| 0.9 | 1.111 | 2 | 5 |
| 0.5 | 2 | 7 | 17 |
| 0.1 | 10 | 44 | 110 |

For one survivor, k = ceil[ln(0.01)/ln(1−s)]. For K unique required roles,
whole-kit success is [1−(1−s)ʳ]ᴷ with r copies per role. Expected Ns is not a
high-confidence mass guarantee. Common beam errors, unsuitable materials and
a shared faulty design violate independence; no finite copies fix s = 0.
A 1 kg launch with s < 1 cannot promise 1 kg for assembly.

## Proposal 3: brake first, gather second, build third

| Cruise speed | 4.24 ly ballistic time | Can the chips stop? |
|---:|---:|---|
| **300 km/s** (0.00100069c) | **4,237.07 yr** | Potentially with a separately engineered very light sail or plasma brake; none demonstrated in this chip budget. Concept H remains a flyby. |
| **0.046c** (13,790 km/s) | **92.17 yr** | Conditional photogravitational capture via Alpha Cen A/B with extraordinarily low σ; not a generic direct-Proxima brake. |
| **0.2c** (59,958 km/s) | **21.2 yr** | Flyby with the studied light sails; no demonstrated chip-sized onboard brake. |

Exactly **0.001c** takes **4,240 yr**; the difference from 300 km/s is rounding.
For 0.2c the first encounter report reaches Earth no earlier than **25.44 yr**
after launch, before turnaround or data transmission time.

[Heller & Hippke (2017)](https://arxiv.org/abs/1701.08803) obtain the famous
**0.046c** capture result using Alpha Cen A/B followed by Proxima, with nominal
sail σ ≈ **7.6×10⁻⁴ g/m²**, roughly **95 yr to A/B plus 46 yr transfer**,
and about **100,000 m²** for a **10 g payload**. These are extremely favorable
sail assumptions. Their [author FAQ](https://www2.mps.mpg.de/homes/heller/content/main_pga_FAQ.html)
puts direct-Proxima braking at only about **1,280 km/s for that nominal sail**.
A 300 km/s arrival is below that nominal threshold, but that does not transfer
the result to Concept H's much heavier **2.0476 g/m²** sailcraft. Geometry,
thermal survival, capture orbit and mass loading still need a trajectory.
**0.046c is a result for that study, not a universal physical speed limit.**

A magsail reflects ionized ambient gas using a current-carrying loop; an e-sail
uses charged tethers. [Gros (2017)](https://arxiv.org/abs/1707.02801) shows the
large area/mass burden in dilute plasma and gives high-speed examples with
roughly **10³-ton** mass requirements, not a bound applicable to every design.
[Perakis & Hein (2016)](https://arxiv.org/abs/1603.03015) find a combined
magnetic/electric brake can decelerate from **0.05c** in about **29 yr** for an
**8,250 kg** spacecraft. Neither paper demonstrates a gram-scale capture device.

As our own optimistic scale, take fully reflecting protons at density
**0.1 cm⁻³**, constant effective area, and reduce speed by a factor 10 over
**1 ly**. Integrating m v dv/dx = −2ρAv² gives

A/m = ln(10)/(2 mp n L) ≈ **7.28×10⁵ m²/kg**.

Even a 1 g vehicle needs **728 m² effective magnetic interaction area**,
equivalent to a 15.2 m disc radius, with no coil or power mass yet. Real area
and ionization fraction change with speed. This is a momentum-column scale,
not a device specification. For electrostatic reflection, a proton needs
qV ≳ KE: **19.35 MV at 0.2c**, **0.994 MV at 0.046c**, but **470 V at
300 km/s**. Lower voltage helps slow missions; tethers, electron collection,
neutral gas, power, charging and deployment still prevent assuming a chip brake.
A laser at Earth shining from behind pushes outward; destination braking by a
beam requires another momentum geometry or pre-existing target infrastructure.

### Rendezvous audit

For ballistic distance L, speed v, launch-time spread Δt₀, fractional speed
error f and angular error θ, useful first-order scales are

Δtarrival ≈ (L/v) f; Δx∥ ≈ Lf; Δx⊥ ≈ Lθ;

Δv∥ ≈ vf; launch-train length ≈ vΔt₀.

Treat these as separate characteristic error contributions, not identical
statistical distributions. With **f = 10⁻⁶**, **θ = 1 nrad**, L = 4.24 ly:

| Speed | Arrival-time error | Relative speed error |
|---:|---:|---:|
| 300 km/s | **1.548 days** | **0.300 m/s** |
| 0.046c | **48.48 min** | **13.79 m/s** |
| 0.2c | **11.15 min** | **59.96 m/s** |

All have transverse spread **40,113 km** and longitudinal spread
**40.113 million km = 0.268 AU**. Those errors require autonomous navigation
and early corrections; Earth round-trip commands take **8.48 yr**. A full
orbital solution must add ephemeris, differential gravity and actual error
covariances. “Self-assembly” does not correct the launch errors by itself.

Two burns to cross 40,113 km in one year cost a kinematic scale
**2d/T = 2.542 m/s**. Crossing the full 0.268 AU longitudinal spread in one
year instead costs **2.542 km/s**, and matching the velocity errors adds
another requirement. Early correction can be much cheaper than gathering
late. At 0.2c a **3.03-day** sequential launch span gives a train about
**105 AU long**; unbraked identical-speed chips retain their time offsets.
They cannot wait by a stationary asteroid. Capture first allows later chips
to arrive into storage or a common orbit, subject to chip lifetime and control.

A moving flyby formation could rendezvous in its shared moving frame if it
has corrections, navigation and time, but assembling there does not stop it.
Slow final approach needs ranging, power, relative attitude control and
contact damping. Electrostatic alignment, mechanical latches or cured bonding
are candidate interfaces; each needs compatible docking surfaces and
contamination/temperature control. A 1 mg part arriving at 1 m/s has 0.5 μJ
relative KE, but at 1 km/s has 0.5 J. Mechanical contact at cruise-relative
speed is destructive. Distributed sensors exchanging data can avoid physical
assembly and its common rendezvous point entirely.

### What is the minimum viable von Neumann seed?

**Unknown.** There is no demonstrated autonomous factory that closes mining,
refining, power production, precision machinery, semiconductor manufacture,
metrology, spares and replication from arbitrary local rock. A gram chip
running software is not such a factory. Larger chip counts do not solve missing
chemical feedstocks, catalysts or production capabilities.

[NASA's historical automation study](https://ntrs.nasa.gov/api/citations/19830007077/downloads/19830007077.pdf)
considered a **100-ton lunar factory**; that was a conceptual architecture,
not a minimum mass or demonstrated design. Use mass only as a sensitivity:

| Assumed complete seed mass | 1 g chips needed intact | 1 mg chips needed intact |
|---:|---:|---:|
| 1 kg (unsupported target) | 1,000 | 1,000,000 |
| 100 kg (unsupported intermediate) | 100,000 | 100,000,000 |
| 100,000 kg (historical study scale) | 100,000,000 | 100,000,000,000 |

These counts exclude sails and attrition, not factory requirements. A specialized
instrument, receiver or simple chemical experiment may be far smaller than a
universal constructor. A credible seed-first project should specify feedstock,
product, power, purity, imported critical parts and replication closure before
selecting seed mass. Landing also requires capture and surface delivery, not
just reaching the stellar vicinity.

## Sanity review of the user's information-beaming notes

**Light-to-hardware:** a lone photon cannot create a massive pair in empty
vacuum while conserving four-momentum. Two photons can: for head-on collisions
E₁E₂ ≥ (mec²)², so equal photon energies must exceed **511 keV**. Two ordinary
1 μm photons (**1.24 eV each**) have **zero linear Breit–Wheeler pair-production
rate**, irrespective of the encoded file. Co-propagating photons have no useful
centre-of-momentum energy. An intense-field multiphoton experiment is a
different regime, not a radio/optical information link.

For a rate scale, take a hypothetical opposing pair of **1 MeV, 1 GW gamma
beams**, each area **1 m²**, overlap length **1 m**, and cross section of order
**10⁻²⁹ m²**. The overlap estimate 2σ(P/Eγ)²ℓ/(Ac) gives only
**2.6×10⁶ pairs/s**, or about **4.7×10⁻²⁴ kg/s rest mass**, even granting
those extraordinary gamma sources and target-side alignment. The
[experimental GSI proposal](https://indico.gsi.de/event/8925/contributions/38755/)
gives the cross-section order and head-on threshold; this rate is our
illustrative estimate, not an observed yield. A single outbound beam lacks
the opposing beam infrastructure.

[STAR's result](https://www.energy.gov/science/np/articles/making-matter-collisions-light)
provides evidence of photon-induced electron/positron production in heavy-ion
encounters, not remote chip manufacture. Pair production creates leptons,
not silicon nuclei. Pair members need not immediately annihilate if separated;
creating baryon–antibaryon pairs at higher energies is not categorically
forbidden by net baryon-number conservation. Sorting, synthesizing nuclei,
cooling and assembly remain vastly beyond an information beam. Saying
“photons can never make matter” or “baryons from photons always violate
conservation” would overstate the physics.

**Quantum teleportation:** [Bennett et al. (1993)](https://research.ibm.com/publications/teleporting-an-unknown-quantum-state-via-dual-classical-and-einstein-podolsky-rosen-channels)
transfer an unknown quantum state using shared entanglement and classical
communication. The receiver already has a physical system; two classical bits
per qubit complete the standard protocol. It transports neither a factory nor
its feedstock and cannot outrun the **4.24 yr** one-way classical latency.
The receiver need not be an identical literal carbon atom for every state
encoding; the essential resources are a suitable receiving quantum system,
entanglement, controls and the classical channel.

**Seed first, beam later:** viable in principle only after a **physical receiver,
power source and manufacturing capability** have arrived and worked. At λ =
**1 μm**, Pt = **1 kW**, Dt = **10 m**, Dr = **10 m**, d = **4.24 ly**, an
on-axis diffraction-limited circular aperture link gives

Pr/Pt ≈ [π Dt Dr/(4λd)]².

With an assumed **20% combined optical/pointing/detection efficiency** and
**1 bit per detected photon**, our illustrative rate is **3.86 kbit/s**.
A **1 m receiver** instead gets **38.6 bit/s**. This ignores background,
scintillation, outages and coding overhead; it is not a Shannon limit.
The 10 m receiver is factory infrastructure, not equipment we have fit on a
1 mg seed. A 10 m transmitter's first-null footprint radius is about
**4.89 million km** at the destination; precision pointing is still necessary.

| Assumed compressed design/software package | Transmission at 3.86 kbit/s | Last bit arrives after transmission begins on Earth |
|---:|---:|---:|
| 1 GB (10⁹ bytes) | **24.0 days** | **4.306 yr** |
| 1 TB (10¹² bytes) | **65.68 yr** | **69.92 yr** |

Those are illustrative file sizes, not known sizes of a complete factory design.
Sending software can upgrade an established factory, but physical tolerances,
process recipes, local assays and missing tools are not supplied by bandwidth.
For comparison, [Parkin (2020)](https://arxiv.org/abs/2005.08940) analyzes a
**100 W** sailcraft downlink with a **4.1 m** transmitting sail and **30 m**
Earth receiver, finding **260 bit/s–1.5 kbit/s**, with explicit photon/noise
and coding assumptions. An uplink with a local factory's large receiver is a
different link. “Beam infinite designs forever” means continued service,
energy and maintenance, not infinite bandwidth or guaranteed autonomy.

**Environmental hacking:** sunlight can drive chemistry, but no known mechanism
turns a targeted interstellar message into arbitrary autonomous hardware in
unprepared rock or a hypothetical alien soup. There is no established decoder,
chemical compiler, feedstock pathway or error correction. Calling speculative
biosphere photochemistry the *only viable* alternative to an industrial receiver
is unsupported; neither its existence at Proxima nor this capability is known.
Information has a physical carrier: a beam carries energy and momentum even
though individual photons have zero rest mass. “Information has no mass” does
not erase the need for receiver and manufacturing hardware.

## Claims check

The issue addendum combines several design points. The following checks keep
its proposed numbers separate from the published designs. The first two rows
use `nano_claims_budget` and
`NanoSwarmTests.test_claimed_starshot_geometry_acceleration_and_heat`; the loop
row uses `nano_magsail_brake` and
`test_magsail_integrals_density_and_hardware_scaling`. The stagger/attrition row
uses `nano_arrival`, `nano_dust_column`, `nano_redundancy`, and
`test_weekly_launches_and_90_percent_loss_are_not_a_compact_kit`.

| Claim | Computed / sourced check | Verdict |
|---|---|---|
| **1 km² array; 100 GW at 1.06 μm; 4 m, 1 g sail plus 1–2 g chip; 60,000 g for 600 s; focus to 2 million km; 0.2c in 20–22 yr** | A filled circular 1 km² aperture has equivalent D = **1.128 km**. At 2 million km its Airy first-null radius is **2.292 m**, larger than the 2 m sail radius; full first-lobe containment ends at **1.745 million km**. Perfect-mirror initial acceleration is **34,014 g** for 2 g total, **22,676 g** for 3 g, falling during recession. Reaching 0.2c in 600 s requires **10,190 g average**, not 60,000 g constant. Perfect 100 GW capture needs **226.4–339.6 s acceleration** over **7.315–10.972 million km** for those masses. Flight time **21.2 yr** is correct. [Parkin's source](https://arxiv.org/html/1805.01306v3), Tables 1–2, specifies a different mass/array/power point. | **Mixed assumptions.** 20–22 yr cruise is sound; 60,000 g, 600 s, short focus range and the stated masses do not form one consistent acceleration history. A 1 km² collecting area is not automatically the same thing as a 1 km baseline for a sparse phased array. |
| **99.999% reflectivity, equivalent to absorptance ≤10⁻⁵** | At 100 GW across a 4 m disc, I = **7.958 GW/m²**. Required α ≤ **(εf+εb)σSB Tlim⁴/I**, giving **1.087×10⁻⁸** at 625 K and emissivity sum 0.01; see the thermal table below. R + α + transmission = 1: low α does not require equally high R for a transmitting sail. [Parkin's model](https://arxiv.org/html/1805.01306v3) separately specifies reflection, absorption and thermal emission. | **False equivalence and no universal α limit.** A cold weak emitter needs much less than 10⁻⁵ absorption; a hotter efficient emitter can tolerate more. |
| **Photogravitational braking takes 95–140 yr** | [Heller & Hippke](https://arxiv.org/abs/1701.08803) give about **95 yr crossing to A/B + 46 yr onward to Proxima = 141 yr** under their sail assumptions. Our 4.24 ly / 0.046c comparison is **92.17 yr ballistic**, not capture time. | **Plausible total itinerary shorthand**, not 95–140 yr spent braking, and not a 0.2c direct-Proxima capture result. |
| **An HTS magnetic scoop brakes in 50–70 yr** | Our explicit dilute-plasma loop model below gives **41.04 yr / 1.162 ly** from 0.2c to 100 km/s with **842.7 kA, 1,000 km radius and 1,906 metric tons total**. From 0.046c: **23.55 yr / 0.2644 ly**, **193.8 kA**, **438.4 tons**. Choosing other radii can produce 60 yr braking, with huge mass. The [Gros reference model](https://arxiv.org/html/1707.02801v3) supplies the area/current and conductor-mass relations. | **Possible as a tuned optimistic massive mission**, unsupported as a generic chip brake. State endpoint, density, current, radius, mass and whether 50–70 yr means braking or the whole mission. |
| **Thousands of chips, weeks apart, 90% lost to dust** | For **1,000 chips 2 weeks apart**, first-to-last departure is **38.29 yr**, so 0.2c flybys span arrival years **21.2–59.49** after first launch. The moving train extends **7.66 ly** at a common late epoch. The reference dust-only lethal example above gives **7.2% loss**, not 90%. To get 90% loss requires λlethal = **ln 10 = 2.303**; in the hypothetical 1 μm population, that needs **30.8% of all dust mass lethal at that size** for 1 mm² forward area. [Hoang et al.](https://arxiv.org/html/1608.05284v2) do not establish a universal 90% chip loss rate. | **Cadence is a design choice; 90% is an assumption.** At s = 0.1 only **100 g** of an initial 1 kg is expected intact. Staggering helps independent science and temporal coverage but worsens assembling one contemporaneous kit. |
| **Payload means catalysts and directed assembly, not nanobots** | This is a **design choice**, not a measured performance claim. Mass/role counts can be checked with `nano_seed_chips` and `nano_redundancy`; catalytic efficacy or factory closure cannot be inferred from them. The [NASA automation study](https://ntrs.nasa.gov/api/citations/19830007077/downloads/19830007077.pdf) is a systems-scale comparison, not evidence for gram-scale assemblers. | **Adopt this framing for a future seed architecture**, while requiring an actual feedstock/process and capture design. The current H allocation does not claim a functioning factory. |

### Absorption must be computed from temperature and emission

All entries use the initial rest-frame irradiance of **7.958 GW/m²** and
uniform two-face emission. During 0.2c recession, comoving incident irradiance
falls by (1−b)/(1+b) = 2/3 if source-plane P/A is fixed; using the initial
irradiance is conservative for fixed properties. Hot optical changes,
nonuniform beam peaks and Doppler detuning may remove that benefit.

| Assumed temperature limit | εf+εb | Maximum absorptance α | If opaque, minimum R = 1−α |
|---:|---:|---:|---:|
| 625 K | 0.01 | **1.0873×10⁻⁸** | **99.99999891%** |
| 1,000 K | 0.1 | **7.1256×10⁻⁷** | **99.99992874%** |
| 1,500 K | 1 | **3.6073×10⁻⁵** | **99.99639266%** |

These conditional limits do not certify a material. Transmission can keep
absorption small while reducing thrust, so high reflection and low absorption
must be specified separately. The hot efficient-emitter example is a different
thermal design from the cold low-emittance example.

### A loop brake with its mass left in the calculation

Use the reference model's natural-log fit and conductor mass estimate:

A(v) = 0.081 πR² [ln(I/(b Ic))]³, Ic = 1.55 MA;

F(v) = 2 mp np v² A(v); mloop = 2πR × 0.18 kg/m × (I/1 MA).

We choose I = e b₀ Ic (distance optimum for loop-dominated mass), **np =
0.1 ionized protons/cm³**, and **mtotal = 2 mloop**, the paper's favorable
hardware/payload allowance. This is not the total hydrogen density unless
fully ionized. The assumed HTS mass per current is a favorable paper estimate,
not a measured flight cable at the required field, temperature and lifetime.
Current is fixed during a shot; area increases as the craft slows.

With y = ln(v₀/v) and a = ln(I/(b₀ Ic)), the integrated distance and time are

x = m/[4 mp np (0.081πR²)] × [a⁻² − (a+y)⁻²];

t = m/[2 mp np (0.081πR²) v₀] × ∫₀ʸ exp(z)/(a+z)³ dz.

The calculator integrates time with Simpson quadrature and checks distance
against separate quadrature. The published ~58 yr, 0.1c, ~1,600 km-radius
reference is recovered within rounding. At 0.2c the model is Newtonian;
relativistic rigidity and momentum corrections are a few percent before other
uncertainties. The fit was calibrated over about two orders of magnitude;
extrapolating to the 100 km/s endpoint (speed ratios 600 and 138) is optimistic.
Thermal plasma motion and neutral gas further limit the low-speed extension.

| Initial speed | Loop radius | Current | Wire / total mass | Initial drag | Time to 100 km/s | Distance used |
|---:|---:|---:|---:|---:|---:|---:|
| 0.2c | 1 km | 842.7 kA | **953 / 1,906 kg** | **0.306 N** | **41,035 yr** | **1,162 ly** |
| 0.2c | 1,000 km | 842.7 kA | **953 / 1,906 tons** | **306.0 kN** | **41.04 yr** | **1.162 ly** |
| 0.046c | 1 km | 193.8 kA | **219 / 438 kg** | **0.01619 N** | **23,546 yr** | **264.4 ly** |
| 0.046c | 1,000 km | 193.8 kA | **219 / 438 tons** | **16.19 kN** | **23.55 yr** | **0.2644 ly** |

For the 1,000 km loops, cruise over the remaining part of 4.24 ly followed by
these braking legs takes **56.43 yr from 0.2c** or **109.97 yr from 0.046c**,
ending at **100 km/s**, not at rest or in orbit. Tuning radius for **60 yr
braking** requires **683.9 km / 1,304 tons total** at 0.2c (1.699 ly used), or
**392.4 km / 172.0 tons** at 0.046c (0.6738 ly); corresponding cruise-plus-brake
times are **72.71 yr** and **137.53 yr**. Thus “50–70 years” may describe a
particular massive mission, but it is not an HTS technology constant.

Exact zero speed takes **infinite time** in this law, despite a finite asymptotic
distance. A final stellar-wind/photon/propulsive stage is still required.
Cooling, tensile support, deployment, stored magnetic energy, quench protection,
dust survival and controls do not disappear in the nominal factor-two mass
allowance. A magnetic scoop's field transfers momentum to its attached loop;
it is not a massless collecting aperture that can be assigned to every chip.

### Catalysts and directed assembly: a narrower seed design

Treat the proposed payload as selected **catalysts, process-control electronics,
metrology and directed assembly instructions**, rather than an unspecified
population of autonomous nanobots. Catalysts enable particular reactions;
they do not supply energy, create absent elements, refine all feedstock or
replace actuators and precision tooling. A useful seed specification must name
the local substrate, chemical pathway, imported catalyst inventory, selectivity,
poisoning/lifetime, energy supply and an assembly mechanism. Immobilized
catalysts or a prepatterned substrate could direct a limited product if those
conditions are supplied; this is a proposed design path, not demonstrated
interstellar manufacturing. It still must brake, arrive intact and encounter
usable material. Concept H remains the flyby comparator until such a captured
seed has a defensible mass and process budget.

## Ranked architecture verdict

| Architecture | Quantitative case | Braking / assembly | Verdict and showstopper |
|---|---|---|---|
| **Laser flyby swarm** | 1,000 × 1 g non-sail chips, illustrative 1 g sails; 0.2c, **21.2 yr**; ideal **5,611 GWh optical / 11,222 GWh electrical**; **3.03 days** array time including 60 s turnaround under full capture | Independent flyby sensing; no landing or factory assumed | **Best fast science candidate, conditional.** Full 100 GW capture is a bound; real sail, array, shielding, power and return link remain major engineering barriers. Published point design implies **63,000 GWh** for 1,000 heavier craft. |
| **Sundiver flyby swarm (Concept H)** | 1,000 × 1 g chip allocations; **0.646 m² / 0.323 g sail per chip**, **1.323 kg fleet**, **300 km/s**, **4,237 yr** | Representative escape only; no capture or assembly claimed | **Meaningful exotic solar swarm comparator.** Same speed as G, not a mass-splitting bonus; **1,666 K** sail plus autonomous millennia-long survival and unmodeled delivery are showstoppers. |
| **Photogravitational captured seed swarm** | Nominal **0.046c**, about **95+46 yr** via A/B; paper's **10 g / 100,000 m²** sail scale, not the gram laser/sundiver sail | Capture conditionally studied; gathering and a complete factory unclosed | **Research path for seed-first, not an established 1 kg mission.** Ultra-low mass loading, intact sails, navigation, assembly and a defensible seed mass are missing. |

Concept H's `scenario-h.json` intentionally reuses G's inbound orbit and β: the
engine is mass independent when β is held fixed. `index.json` labels it exotic,
with feasibility/showstopper text, and `narratives.json` states the mass split
and limits. No fictitious impulse creates braking or self-assembly. All future
factory or target-beamer promises depend on those separate systems succeeding.
