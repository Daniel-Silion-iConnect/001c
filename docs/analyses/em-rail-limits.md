# Electromagnetic launcher limits for the 1 kg probe

Issue [#66](https://github.com/Daniel-Silion-iConnect/001c/issues/66).
Calculations: [ideas_calc.py](../../analysis/ideas_calc.py), including
`EMRailTests`, also run by `npm test`. Sources checked 2026-10-25.
All tables below are our first-order calculations unless explicitly identified
as measurements or literature proposals.

## Verdict

**The best realistic development target is a lunar, contactless, staged
coilgun/mass driver delivering about 2.5–5 km/s to a hardened probe.** It could
replace an initial chemical stage, given a lunar industrial installation.
This is a proposed engineering target, not demonstrated lunar hardware.
Use **1,000 g as an initial sizing assumption**, with 10,000 g conditional on
qualification of the complete payload and launch carriage. At 1,000 g the
2.5–5 km/s range needs **0.319–1.275 km** of accelerating track and **3.125–12.5 MJ**
of payload kinetic energy. A carrier, its braking/recovery system, clearance,
power electronics, cooling and margins must be added.

**10 km/s is a stretch target; 50 km/s is a major extrapolation; 300 km/s is
not a plausible baseline for this project's solid 1 kg probe.** Electromagnetism
does not forbid 300 km/s, but the required package of guideway, switching,
field containment, payload survival and pulse power has no demonstrated
engineering basis. A ring changes geometry rather than removing these costs.
There is no universal ceiling on total current: the constraints are local
current density, material stress/temperature, voltage, stored energy and power.

No trajectory scenario is added. A useful first stage still needs a launch
site, direction, epoch, carrier mass and escape/transfer solution. Encoding
surface exit speed as a heliocentric impulse would overstate what is known.
The [orbital notation](../ORBITAL_NOTATION.md) distinguishes local impulses
from the final asymptotic escape speed, v∞.

## 1. What changes between a railgun and a coilgun?

A **railgun** closes a high-current circuit through two rails and a moving
armature. Sliding contacts, arcs, friction and concentrated Joule heating
damage both the armature and rails. McCorkle and Bahder's
[rail-melting analysis](https://arxiv.org/abs/0810.2985) models skin-effect
heating and finds increasing melt depth with speed in its studied regime.
It is evidence of an engineering failure mechanism, not a universal speed law.

The often quoted **6–8 km/s plasma-armature limit** describes a historical
performance barrier for solid-projectile railguns. The
[Sandia/LLNL experiments (1989)](https://doi.org/10.1016/0168-583X(89)90545-4)
identify restrike: a secondary plasma path behind the projectile shunts
current away from the driving armature. Ablation also adds armature mass and
contaminates the bore. A [1990 DoD SBIR project](https://www.sbir.gov/awards/55376)
specifically sought to overcome the roughly 6 km/s barrier with confinement.
Thus 6–8 km/s is neither an exact immutable cutoff nor a coilgun limit.
Fast plasma jets alone are not evidence of launching an intact kilogram probe.

A **coilgun** uses spatially sequenced magnetic fields and a conducting or
energized armature. A contactless architecture avoids sliding electrical
contacts; induction heating, field stresses, alignment and switching remain.
Maglev provides guidance and suspension; a linear motor must still supply
the work. It does not supply a separate free acceleration mechanism.
The [Mongeau et al. traveling-wave synchronous coilgun (1991)](https://ntrs.nasa.gov/citations/19910044696)
uses field-energy transfer along the traveling wave, while explicitly requiring
elaborate switching. A ferromagnetic pull-only slug is not the assumed armature
for operation in tens of teslas: saturation makes that extrapolation unsuitable.

For an ideal rail circuit, an independently derived lumped model is

```text
L(x) = L0 + L' x
F = (1/2) L' I²
V = R I + L dI/dt + L' I v
```

For an **assumed** L′ = 0.5 µH/m, 1 kg at 10,000 g requires approximately
**626 kA**. Increasing conductor cross section can reduce current density,
but cannot eliminate I²R loss, magnetic forces or the moving-armature voltage.
At constant current, the motional electrical power is **2 Fv** in this simple
rail model: Fv goes into motion and the other Fv into the increasing magnetic
field energy. Recovery matters. These equations do not model plasma restrike.

## 2. Fields, conductor strength and critical current

For a vacuum magnetic field, the magnetic pressure/energy-density scale is
**pB = B²/(2µ₀)**, with µ₀ = 1.25663706212×10⁻⁶ H/m. The Maxwell stress is
directional; pB times area is only a favourable force scale, not a calculated
coilgun coupling efficiency.

| B (T) | pB (MPa) | Field energy per m³ (MJ) | Thin support stress pB r/t, r/t = 10 (GPa) |
|---:|---:|---:|---:|
| 10 | 39.79 | 39.79 | 0.398 |
| 20 | 159.15 | 159.15 | 1.592 |
| 30 | 358.10 | 358.10 | 3.581 |
| 45 | 805.72 | 805.72 | 8.057 |

The last column is a **thin cylindrical support analogy**, not a detailed
winding stress result or a material rating. It shows why comparing pB directly
with tensile strength can badly understate the required structure. An assumed
1 GPa allowable stress and r/t = 10 imply about 15.9 T in this analogy.
Changing geometry, reinforcement and safety factor changes that result.

Treat **10–20 T for normal-metal launcher coils** as a demanding design range,
not a fundamental material limit. The National MagLab
[demonstrated a 41.4 T resistive magnet in 2017](https://nationalmaglab.org/news-events/news/strongest-resistive-magnet/),
using copper/copper-silver, a **32 MW** supply and a **32 mm bore**. This
demonstrates what specialized support and cooling can buy; it does not establish
the practicality of thousands of pulsed launcher stages.

Similarly, **30–45 T describes a high-field superconducting research range,
not an interchangeable coil rating or a critical-field ceiling**. MagLab
[reached 32 T with an all-superconducting instrument in 2017](https://nationalmaglab.org/news-events/news/new-world-record-magnet-fulfills-superconducting-promise/).
The often cited **45.5 T result** used a **14.4 T REBCO insert inside a 31.1 T
resistive background field**; it was not a standalone 45.5 T all-superconducting
launcher. [Hahn's 2019 technical account](https://indico.cern.ch/event/763185/contributions/3415511/)
also reports mechanical damage. Neither value is a universal maximum.

Superconductors have a **critical current density Jc(B, T, field angle, strain)**,
not unlimited current. Distinguish the superconducting film's Jc, full-wire
engineering density Je, and the lower winding-pack density after insulation,
coolant and support. [Senatore et al. (2016)](https://arxiv.org/abs/1512.01930)
measure the dependence on field, temperature, orientation and manufacturer.
[Molodyk et al. (2021)](https://www.nature.com/articles/s41598-021-81559-z)
report **Je > 1,000 A/mm² at 20 K, 20 T** in their YBCO wire. This particular
DC material result must not be assigned to every coil or to 45 T operation.

For illustration, 10 kA at Je = 1,000 A/mm² takes at least **10 mm²** of full
wire cross section, or **20 mm²** at an assumed 50% current margin, before
winding-pack overhead. More parallel wire increases total permissible current,
while increasing mass and cost. Time-varying fields, joint resistance, AC loss,
cooling and quench protection require separate design. A superconducting coil
still obeys Faraday's law and experiences magnetic stress.

## 3. Payload acceleration and the nine launch cases

The 1 kg probe has **no demonstrated system-level g rating**. Treat 10³, 10⁴ and
10⁵ g as sizing cases, not survivability claims. The force must pass through
the carriage, joints, electronics, optics and power source. Short pulses,
shock/jerk and resonances also matter. A compact supported solid may survive
loads that would destroy an assembled instrument.

An illustrative end-supported, uniform 0.1 m slab of density 3,000 kg/m³ has
base compressive stress **σ = ρ a ℓ**. Magnetic coupling area here is an
independently assumed **10 cm²**; it need not equal the probe's frontal area.

| Acceleration (Earth g₀) | Force on 1 kg (kN) | Slab base stress (MPa) | Ideal B if pB A = ma (T) |
|---:|---:|---:|---:|
| 1,000 | 9.807 | 2.942 | 4.965 |
| 10,000 | 98.07 | 29.42 | 15.70 |
| 100,000 | 980.7 | 294.2 | 49.65 |

These are our stress and force scales, not qualifications or magnetic designs.
For that area, 20 T corresponds to only about **16,229 g** even with the
favourable pB A force assumption. Shrinking the coupling area makes this worse;
adding a heavy armature increases the accelerated mass.

From rest at constant acceleration, with **g₀ = 9.80665 m/s²**:

```text
a = g_load g₀;   F = ma;   L = v²/(2a);   t = v/a
Ekin = mv²/2;    Pmech(t) = F v(t)
Pmech,average = Ekin/t = mav/2;    Pmech,peak = mav
Ein = Ekin/η;   Pelec = Pmech/η
```

Speeds are **launcher-relative exit speeds**, not solar v∞. The table assumes
**1 kg total accelerated mass**, zero injection speed, no drag or gravity work,
and constant **η = 0.5 electrical-to-kinetic efficiency**. This is an assumed
accounting example, not measured efficiency. Carrier mass and launcher support
power are absent. Electrical losses are Ein − Ekin; they equal Ekin at η = 0.5.

| v (km/s) | g₀ load | L (km) | t (s) | Ekin / Ein (GJ) | Mechanical average / peak (GW) | Electrical average / peak (GW), η = 0.5 |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 10³ | 5.0986 | 1.01972 | 0.050 / 0.100 | 0.0490 / 0.0981 | 0.0981 / 0.1961 |
| 10 | 10⁴ | 0.5099 | 0.10197 | 0.050 / 0.100 | 0.4903 / 0.9807 | 0.9807 / 1.9613 |
| 10 | 10⁵ | 0.0510 | 0.01020 | 0.050 / 0.100 | 4.9033 / 9.8067 | 9.8067 / 19.6133 |
| 50 | 10³ | 127.4645 | 5.09858 | 1.250 / 2.500 | 0.2452 / 0.4903 | 0.4903 / 0.9807 |
| 50 | 10⁴ | 12.7465 | 0.50986 | 1.250 / 2.500 | 2.4517 / 4.9033 | 4.9033 / 9.8067 |
| 50 | 10⁵ | 1.2746 | 0.05099 | 1.250 / 2.500 | 24.5166 / 49.0333 | 49.0333 / 98.0665 |
| 300 | 10³ | 4,588.7230 | 30.59149 | 45 / 90 | 1.4710 / 2.9420 | 2.9420 / 5.8840 |
| 300 | 10⁴ | 458.8723 | 3.05915 | 45 / 90 | 14.7100 / 29.4200 | 29.4200 / 58.8399 |
| 300 | 10⁵ | 45.8872 | 0.30591 | 45 / 90 | 147.0998 / 294.1995 | 294.1995 / 588.3990 |

Increasing g shortens track and duration but **does not reduce kinetic energy**;
it raises force and peak power. Doubling accelerated mass doubles force,
energy and power at the same g and speed. Relativistic corrections at
300 km/s are below one part per million; these engineering uncertainties dominate.

An initial speed must be handled through **L = (vf² − vi²)/(2a)** and
**t = (vf − vi)/a**. A 3 km/s injection followed by a track which gives
4 km/s from rest exits at **5 km/s**, not 7 km/s. Fixed track/force stages add
v²; speed increments add only when the actual acceleration time is specified.

## 4. Switching, back-EMF, voltage and stored power

For an illustrative driven phase with constant self-inductance and position
dependent external/mutual flux linkage λext(x), Faraday's law gives

```text
V = RI + L dI/dt + v dλext/dx
stage transit = pitch/v;    stage passage rate = v/pitch
```

The signs and flux linkages depend on topology and phase. For coupled coils,
the full model also includes mutual terms from changing armature current.
A current pulse left on too late may decelerate the projectile.

**Assume** 0.1 m pitch, 10 µH per driven phase, 10 kA current, 1 mΩ resistance,
current rise over one quarter of a stage transit, and a prescribed
**dλext/dx = 1 Wb/m**. These values illustrate electrical scales, not a
self-consistent coil design or a universal voltage limit.

| Speed (km/s) | Transit (µs) | Stage passage rate | Rise time (µs) | L dI/dt (kV) | Motional EMF (kV) | Sum with RI = 10 V (kV) |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 10 | 100 kHz | 2.5 | 40 | 10 | 50.01 |
| 50 | 2 | 500 kHz | 0.5 | 200 | 50 | 250.01 |
| 300 | 0.333 | 3 MHz | 0.0833 | 1,200 | 300 | 1,500.01 |

The stage passage rate is **not** necessarily the repetition rate of each
individual switch: different stages fire along the track. Each still needs
adequate timing, current rise/fall, insulation and energy handling. Increasing
pitch to 1 m lowers the example's 300 km/s inductive term to 120 kV, while
the prescribed motional term remains 300 kV. Different winding turns can trade
voltage against current; they do not remove work Fv or field stress.

This example phase stores **½LI² = 500 J** and dissipates **I²R = 100 kW while
at full current**. A superconducting version reduces DC resistance but cannot
eliminate inductive or motional voltage. Distributed storage, resonant transfer
and recovery can help; an actual waveform and circuit are needed to quantify it.

For the 300 km/s shot, η = 0.5 means **90 GJ = 25 MWh** input per kilogram.
Charging storage over one day would average **1.04 MW**, before storage and
auxiliary losses. This does not supply the shot's tens-to-hundreds of GW
directly: banks, feeders and switches must discharge that energy on the stated
time scale. There are also **45 GJ** outside the payload kinetic energy to
recover or dissipate in this assumed accounting. Low repetition rate helps
thermal management but cannot shrink peak currents, forces and voltage to zero.

## 5. Earth atmosphere versus lunar vacuum

Earth launch through an evacuated tube still needs an exit through the
atmosphere. At 10 km/s there is already a severe shock/heating problem;
50–300 km/s makes direct low-altitude exit untenable for this probe concept.
[NASA's entry-heating discussion](https://ntrs.nasa.gov/api/citations/20250006125/downloads/NASA_TPS_Perspectives_ReusableRocketsWorkshop_RevB.pdf)
includes ionization, nonequilibrium chemistry and radiation. A simple
low-speed heat-transfer law extrapolated to 300 km/s would not be defensible.

Instead, our diagnostic scales use **q = ½ρv²** and incident gas kinetic power
**½ρAv³**, with standard sea-level **ρ = 1.225 kg/m³**, p = 101,325 Pa from
[NASA SP-367](https://appel.nasa.gov/wp-content/uploads/2018/08/NASA-SP-367-Intro-to-Aero-of-Flight.pdf).
Choose **A = 1 cm²** only as an illustration; an actual 1 kg probe may be larger.

| Speed (km/s) | Sea-level q (MPa) | Incident kinetic power across 1 cm² (GW) |
|---:|---:|---:|
| 10 | 61.25 | 0.06125 |
| 50 | 1,531.25 | 7.65625 |
| 300 | 55,125 | 1,653.75 |

These are **not absorbed heat fluxes or stagnation-pressure predictions**.
The vertical hydrostatic column above that area has mass **pA/g₀ = 1.033 kg**.
At an artificially maintained 10 km/s, its incident relative energy is
**51.7 MJ**; at 300 km/s it is **46.5 GJ**. A real projectile slows, deflects
and heats the gas; this is a severity scale rather than an energy deposition
calculation. A horizontal low-altitude path can encounter still more gas.

The Moon's [tenuous exosphere](https://science.nasa.gov/moon/lunar-atmosphere/)
removes this Earth-like atmospheric column. It does not remove lunar dust,
micrometeoroids, armature heating, field losses, cryogenic requirements or
radiator sizing. Vacuum makes the Moon a much better launcher site.

## 6. Lunar track lengths and a ring

Use the [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)
mean radius **R = 1,737.4 km** and the repository's rounded lunar
μ = 4.9049×10¹² m³/s². Our ideal great-circle ring has circumference
**2πR = 10,916.4 km**, without topography, rotation or construction clearance.

The straight-track distances in §3 apply locally on the Moon too; g values
are multiples of **Earth** g₀, not lunar gravity. At 300 km/s and 1,000 g,
the **4,589 km** acceleration length exceeds the Moon's **3,475 km diameter**.
A straight tangent installation of that scale needs extensive elevated/free
space structure; a ground-following route bends. Even the 459 km option at
10,000 g is far from a flat local civil-engineering project.

A ring permits repeated passes and trades tangential acceleration for laps.
At constant 1,000 g tangential drive, 10, 50 and 300 km/s respectively take
**0.000467, 0.01168 and 0.42035 laps** from rest. The last is less than one
lap, but **not** a feasible 1,000 g total-load shot:

```text
curvature acceleration = v²/R
signed inward guide force / m = v²/R − μMoon/R²
supported payload load = hypot(a_tangential, v²/R − μMoon/R²)
```

| Speed (km/s) | Curvature acceleration (g₀) | Total supported g₀ at 1,000 g tangential drive |
|---:|---:|---:|
| 10 | 5.869 | 1,000.02 |
| 50 | 146.73 | 1,010.68 |
| 300 | 5,282.29 | 5,375.95 |

At 300 km/s the track must provide about **51.8 kN inward force per kg**,
after subtracting lunar gravity. With 10,000 g tangential drive, the payload
experiences **11,309 g** supported load, not 10,000 g. A true 1,000 g
coasting support limit on this ring caps speed at about **130.54 km/s** even
with tangential drive turned off. At 300 km/s that load limit instead requires
a curvature radius of roughly **9,177 km** if gravity is neglected, much
larger than the Moon. Acceleration and radial guidance compete for the same
payload load allowance. More laps cannot cure an excessive final radial load.

Releasing from a ring requires a clear tangent departure and safe armature
separation. Moon-relative v∞ is **sqrt(v_exit² − v_escape,Moon²)** for an
escaping two-body trajectory, with v_escape,Moon ≈ **2.376 km/s** using the
constants above. Thus 2.5 and 5 km/s exits give only **0.777 and 4.399 km/s**
Moon-relative v∞. These are not Earth-relative or solar asymptotic speeds;
those require vector addition of orbital motion and further gravity accounting.

## 7. What the mass-driver literature establishes

[Snow and O'Neill (1979), AIAA 79-2095](https://ntrs.nasa.gov/citations/19800026231)
describe construction/testing of a **2.5 m mass driver**, with equal
acceleration/deceleration sections containing **59 drive coils each**,
**13.1 cm caliber**, and capacitor energy storage. This is relevant experimental
heritage for sequential electromagnetic acceleration, not evidence for a
300 km/s launcher.

[Snow and Kolm, “Electromagnetic Launch of Lunar Material,” NASA SP-509 vol. 2
(1992)](https://www.nss.org/settlement/nasa/spaceresvol2/electromag.html)
describe O'Neill's lunar mass-driver studies, resonant capacitor transfer,
and a later superconducting quenchgun proposal for **one-ton oxygen payloads
every two hours**. Their architecture separates the payload from a recoverable
carriage and includes a braking section. They report a **1985 normal-conductor
proof of concept**, not an operating lunar superconducting launcher. The
[NASA source record](https://ntrs.nasa.gov/citations/19930007725) identifies the
chapter. The proposed low lunar orbit also needs a circularization burn.

Those studies support investigating **lunar launch at a few km/s** and energy
recovery. Their optimistic quenchgun and efficiency projections are not adopted
as measured performance here. In particular, a cold lunar site is not itself
a superconducting refrigerator: conductor temperature, thermal isolation,
AC losses and critical-surface margin still need analysis.

## 8. Proposed first-stage reference and decision boundary

Size an initial study around **5 km/s, 1 kg, 1,000 g, lunar vacuum**:

- Accelerating track **1.275 km**, shot **0.510 s**, force **9.807 kN**.
- Payload kinetic energy **12.5 MJ**; assumed η = 0.5 input **25 MJ**.
- Mechanical average/peak **24.52/49.03 MW**; electrical average/peak
  **49.03/98.07 MW** under that efficiency assumption.
- A 10 cm² effective coupling area needs about **4.965 T** in the favourable
  pressure-area estimate, before actual coupling and structural margins.
- The 10,000 g version shortens the accelerating track to **127.5 m**, but
  raises the example electrical peak to **980.7 MW** and the ideal field
  scale to **15.70 T**. It should not be selected solely to shorten the track.

This reference is a candidate for a full electromagnetic, structural and
payload qualification study. A more conservative 2.5 km/s version has
**319 m** accelerating length and **49.03 MW** example electrical peak at
1,000 g. Carrier acceleration, release and braking lengths/energy must be
budgeted before either is a mission design. Both can make a useful first stage;
neither supplies the mission's 300 km/s solar v∞.

**Decision: pursue a few-km/s lunar coilgun as a first-stage study, retain
10 km/s as a conditional stretch goal, and reject 300 km/s as the realistic
rail baseline.** The deciding limits are the combined material, payload,
voltage, thermal and power requirements, rather than a single maximum current.
