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
