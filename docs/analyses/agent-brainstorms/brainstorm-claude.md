# 001c brainstorm: two new ideas and a lunar add-on

I read `DESIGN.md`, `docs/TRAJECTORY_IDEAS.md` and `docs/analyses/reference-scenarios.md`. Neither idea uses anything on the excluded list. I didn't edit or commit anything.

**Caveat:** I wasn't able to run the check script (the command needed approval), so every number below is worked by hand. The constants come from reference-scenarios §1 (v_esc at 1 AU = 42.12 km/s, Earth's orbital speed v⊕ = 29.78 km/s, c = 2.998×10⁸ m/s).

---

## Idea 1: Photon-recycling cavity catapult ("light ping-pong" launcher)

**Mechanism.** A fixed mirror (the "anchor") and a mirror on the probe form a laser cavity, and the laser light bounces between them N times. Every bounce pushes the probe again, so the thrust is multiplied by N. This is Bae's photonic laser thruster, which has been shown in the lab over cavities about 1 m long, stretched here to 10⁵ km. Unlike a single-pass laser sail (Starshot), the same photons are reused until Doppler redshift drains them. That cuts the energy needed by about 300× and launches the probe directly to more than 0.001c: no solar dive, no heat shield, no Oberth burn.

**First-order estimate.**

Assumptions:
- Moving mass is m = 2 kg: the 1 kg probe plus about 1 kg for the mirror and lines.
- The track is L = 10⁵ km and the laser wavelength is λ = 1.064 µm.
- The probe leaves at v_L = 280 km/s relative to the Earth–Moon system, aimed along Earth's orbital velocity.
- The effective bounce count is N_eff ≈ 300.

Launch kinematics:
- Acceleration: a = v_L²/2L = (2.8×10⁵)²/(2×10⁸) = **392 m/s² (40 g)**
- Burn time: t = v/a = **714 s**
- Force on the mirror: F = m·a = **784 N**

Power and energy:
- Circulating power in the cavity: P_circ = F·c/2 = 784 × 2.998×10⁸ / 2 = **118 GW**
- Three limits cap the bounce count:
  - Doppler limit: N ≤ c/(2v) = 535 at burnout.
  - Ring-up limit: N ≤ (t/2)·c/(2L) ≈ 535.
  - Mirror loss: N ≈ 1/(1−R).
  - With mirror reflectivity R ≈ 0.997, N_eff ≈ 300 is reasonable.
- Laser input: P_in = P_circ/N_eff = 118 GW / 300 ≈ **390 MW for 714 s**
- Energy per launch: E ≈ 2.8×10¹¹ J (**78 MWh**). A single-pass laser sail would need m·v·c/2 = 8.4×10¹³ J (23 GWh).

Mirror size and heating:
- Beam radius at 10⁵ km: w = √(λL/π) = **5.8 m**.
- Keeping clipping loss at or below 10⁻³ needs a mirror radius of √(ln(10³)/2)·w = 10.8 m. That is a **21.6 m diameter, 367 m²** mirror. To fit in about 1 kg it can weigh only about 2.7 g/m², which points to a photonic-crystal SiN membrane.
- At 1 ppm absorption, the mirror absorbs 118 kW, about 320 W/m², which it can radiate away.

Result:
- v_inf = √((v_L + v⊕)² − v_esc²) = √(309.78² − 42.12²) = **≈ 307 km/s (1.02×10⁻³ c)**. Escaping Earth from lunar distance (1.4 km/s) has negligible effect.

**TRL:** 2. The physics has been shown in the lab at µN–mN thrust and about 1 m scale. Nothing exists at long baselines.

**Key showstopper:** The cavity has to stay high-finesse (N ≳ 300) while one mirror is a 22 m membrane at 2.7 g/m², under 40 g, moving away at up to 280 km/s. That needs:
- tilt held to a few nanoradians (about w/(L·√N)),
- mirror shape held to about λ/10, actively adjusted as L grows from 0 to 10⁵ km,
- reflectivity of at least 0.997 with absorption of 10 ppm or less, in a film that light.

---

## Idea 2: Polonium-210 direct-charge ion drive ("alpha-voltaic" electrostatic drive, no power converter)

**Mechanism.** Thin Po-210 films emit 5.3 MeV alpha particles. Insulated collector plates catch them and charge up to tens of kilovolts. That is a Moseley direct-charge cell, which turns decay energy straight into high voltage with no heat engine. The roughly 70 kV this produces is exactly the beam voltage a xenon ion thruster at Isp of about 33,000 s needs, so the collectors drive the thruster grids directly with no power-processing unit. Po-210 gives off 144 W/g, about 250× more than Pu-238, and emits almost no gamma rays. That makes it the highest specific-power isotope drive that can still physically work for a 1 kg probe.

**First-order estimate.**

Assumptions:
- 0.4 kg of Po-210, giving 57.6 kW of heat at launch.
- 30% direct-charge conversion efficiency and 70% thruster efficiency.
- Dry mass m_d = 2.4 kg (1 kg probe, 0.4 kg Po, 0.45 kg film/collector arrays, 0.3 kg thruster, 0.25 kg structure).
- Propellant m_p = 4 kg of xenon.

Energy budget:
- Mean life: τ = t½/ln2 = 138.4 d / 0.693 = 1.725×10⁷ s.
- Jet power at launch: P_jet = 57.6 kW × 0.30 × 0.70 = 12.1 kW.
- Total jet energy: E_jet = P_jet·τ = 12.1×10³ × 1.725×10⁷ = **2.09×10¹¹ J**.

Thruster and Δv:
- Exhaust speed: v_e = √(2E/m_p) = √(2 × 2.09×10¹¹ / 4) = **323 km/s** (Isp ≈ 33,000 s).
- Xenon beam voltage: V = m_Xe·v_e²/2q ≈ **71 kV**, which matches the collector voltage.
- Δv = v_e·ln(m₀/m_f) = 323 × ln(6.4/2.4) = 323 × 0.981 = **317 km/s**.
- Thrust starts at F = 2P/v_e = 0.075 N, giving a₀ = 0.0117 m/s². That is about 2× solar gravity at 1 AU, so there is no spiral-out penalty.

Result:
- Most of the Δv is delivered beyond a few AU, so far-field linear addition applies, starting from a barely escaping launch: **v_inf ≈ 315–320 km/s**.
- If it were all delivered impulsively at 1 AU after a C3 = 100 km²/s² launch, the upper bound would be √((39.8 + 317)² − 42.1²) ≈ 354 km/s.

Practical side effects:
- The isotope has to sit in layers about 5 µm thick (less than the alpha range) so the alphas can escape. That means **8.7 m²** of film, which doubles as the radiator for about 45 kW of waste heat.
- Decay releases 7.6 g of helium, so the films have to be porous to vent it.

**TRL:** 3. Ion thrusters and radioisotope power are mature. Kilogram-scale Po-210 and 30%-efficient direct-charge conversion at 70 kV are TRL 2.

**Key showstopper:** Supply and efficiency.
- **Supply:** 0.4 kg of Po-210 is about 4× world annual production (order 0.1 kg/yr, made by irradiating Bi-209 in reactors). It decays at 0.5% per day, so it has to be made, built into the probe and launched within weeks.
- **Efficiency:** Direct-charge cells tested so far reach only a few percent efficiency, because of secondary electrons and leakage at high voltage. The 30% assumed here is not demonstrated.

---

## Lunar add-on: anchor the photon catapult in a cold, permanently shadowed lunar crater

Put Idea 1's anchor mirror and laser at a lunar south-pole permanently shadowed region (about 40 K, or about 100 K at lunar night). Hold it at 123 K and use a silicon mirror, the temperature chosen for the planned LIGO Voyager upgrade.

| Benefit | Quantified |
|---|---|
| **The Moon absorbs the recoil** | The anchor takes p = m·v = 2 × 2.8×10⁵ = 5.6×10⁵ N·s per shot. A free-flying anchor (for example at Earth–Moon L1) would need **at least 560 t** to keep recoil to 1 m/s or less. On the Moon it costs 0 t. |
| **Mirror heating distortion drops** | Silicon's thermal expansion is zero at about 123 K, and its thermal conductivity is about 4× higher than at 300 K. Distortion scales with expansion/conductivity, so it is **50–100× smaller**. 1 ppm of 118 GW is 118 kW, or 8.4×10⁷ J per shot. Shed over a day into the 3 K sky, that needs about **75 m² of radiator at 123 K** (σT⁴ ≈ 13 W/m²). |
| **Less sag from 1/6 g** | Gravity sag of the 21.6 m anchor mirror is **6× smaller** than on Earth. |
| **Vacuum** | No atmospheric beam spreading, and no thermal blooming at 118 GW circulating power. From Earth's surface the design is impossible. |
| **Energy** | 78 MWh per shot can come from a **5 MW** solar farm charging for about 16 h. With HTS magnetic energy storage held passively at 40 K in the crater, there is no cryocooler load. |

---

IDEA|Lunar-anchored photon-recycling cavity catapult|307|2
IDEA|Po-210 direct-charge 70 kV ion drive|320|3
