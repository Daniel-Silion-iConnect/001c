# Reference Scenarios: Concepts A, B, and C

This document establishes the sourced engineering parameters, analytical orbital-mechanics equations, material/thermal limits, and back-of-envelope asymptotic velocities ($v_\infty$ and fraction of $c$) for the three reference architectures defined in [`DESIGN.md`](../../DESIGN.md). It serves as the physics and literature baseline for future machine-readable scenario files (`scenarios/*.json`) and engine regression tests.

---

## 1. Constants & Analytical Framework

To ensure reproducibility across agents and future regression suites, all back-of-envelope calculations use the following standard astrodynamic constants (IAU 2015 nominal values):

| Constant | Symbol | Value | Units |
| :--- | :---: | :---: | :--- |
| Speed of light in vacuum | $c$ | $299,792.458$ | $\text{km/s}$ |
| Solar gravitational parameter | $\mu_\odot$ | $1.32712440018 \times 10^{11}$ | $\text{km}^3/\text{s}^2$ |
| Nominal solar photospheric radius | $R_\odot$ | $695,700$ | $\text{km}$ |
| Astronomical Unit | $\text{AU}$ | $149,597,870.7$ | $\text{km}$ ($\approx 215.032\,R_\odot$) |
| Solar escape speed at photosphere ($1\,R_\odot$) | $v_{\text{esc}}(1\,R_\odot)$ | $617.675$ | $\text{km/s}$ |
| Velocity-to-annual-distance conversion | $\text{AU/yr per km/s}$ | $0.210945$ | $\text{AU}\cdot\text{yr}^{-1}/(\text{km}\cdot\text{s}^{-1})$ |
| Solar luminosity | $L_\odot$ | $3.828 \times 10^{26}$ | $\text{W}$ |
| Critical solar sail areal density | $\sigma_{\text{crit}}$ | $1.53$ | $\text{g/m}^2$ (ideal reflector, $\eta = 1$) |

### 1.1 Governing Equations Used in Back-of-Envelope Calculations

1. **Local Solar Escape Velocity at Perihelion ($r_p$):**
   $$v_{\text{esc}}(r_p) = \sqrt{\frac{2\mu_\odot}{r_p}} = \frac{617.675\text{ km/s}}{\sqrt{r_p / R_\odot}}$$

2. **Pre-Burn Perihelion Velocity ($v_p^-$):**
   - *Elliptical transfer from Jupiter flyby* ($r_a = 5.204\text{ AU}$, semi-major axis $a_{\text{in}} = \frac{1}{2}(r_p + r_a)$):
     $$v_p^- = \sqrt{\mu_\odot \left(\frac{2}{r_p} - \frac{1}{a_{\text{in}}}\right)} = \sqrt{v_{\text{esc}}(r_p)^2 - \frac{\mu_\odot}{a_{\text{in}}}}$$
   - *Hyperbolic solar plunge* (pre-accelerated by an inbound tether chain to hyperbolic excess speed $v_{\infty,\text{in}}$):
     $$v_p^- = \sqrt{v_{\text{esc}}(r_p)^2 + v_{\infty,\text{in}}^2}$$

3. **Impulsive Solar Oberth Maneuver (SOM):**
   Applying a prograde impulsive burn $\Delta v_{\text{burn}} = g_0 I_{\text{sp}} \ln(m_0 / m_f)$ at perihelion $r_p$ gives post-burn speed $v_p^+ = v_p^- + \Delta v_{\text{burn}}$, yielding post-Oberth asymptotic escape velocity:
   $$v_{\infty,\text{SOM}} = \sqrt{(v_p^+)^2 - v_{\text{esc}}(r_p)^2} = \sqrt{(v_p^- + \Delta v_{\text{burn}})^2 - \frac{2\mu_\odot}{r_p}}$$

4. **Hybrid Solar Sail Sundiver (Burn at $r_p$ + Continuous Radial Radiation Pressure):**
   A sail with lightness number $\beta = \sigma_{\text{crit}} / \sigma_{\text{eff}}$ (where $\sigma_{\text{eff}} = m_{\text{sailcraft}} / (2\eta A)$) oriented normal to the Sun from perihelion $r_p$ to $\infty$ reduces effective solar gravity to $\mu_{\text{eff}} = \mu_\odot(1 - \beta)$. By conservation of specific mechanical energy from $r_p$ to $\infty$:
   $$v_{\infty,\text{hybrid}} = \sqrt{(v_p^+)^2 - (1 - \beta)v_{\text{esc}}(r_p)^2}$$
   *(For an unpowered parabolic sundiver where $v_p^+ = v_{\text{esc}}(r_p)$, this simplifies to the classical sundiver relation $v_\infty = \sqrt{\beta}\,v_{\text{esc}}(r_p)$ [8, 9].)*

5. **Momentum-Exchange Tether (Rotovator) Chain Contribution — Far-Field Linear vs. Near-Perihelion Oberth Regimes:**
   A single rotovator with tip speed $v_{\text{tip}}$ can impart up to $\Delta v_{\text{stage}} \le 2 v_{\text{tip}}$ (catch-and-release) or $\sim v_{\text{tip}}$ (single-pass grapple/toss), constrained by material characteristic velocity $v_c = \sqrt{2\sigma_{\text{tensile}} / \rho}$ [10, 11]. If an escaping probe with hyperbolic excess $v_\infty$ receives a prograde tether impulse $\Delta v_{\text{tether}}$ at heliocentric radius $r_k$ where local solar escape speed is $v_{\text{esc}}(r_k) = \sqrt{2\mu_\odot / r_k}$, its local speed increases from $v(r_k) = \sqrt{v_\infty^2 + v_{\text{esc}}(r_k)^2}$ to $v(r_k) + \Delta v_{\text{tether}}$, yielding a new asymptotic speed:
   $$v_{\infty,\text{new}} = \sqrt{\left(\sqrt{v_\infty^2 + v_{\text{esc}}(r_k)^2} + \Delta v_{\text{tether}}\right)^2 - v_{\text{esc}}(r_k)^2}$$
   Depending on where along the trajectory the tether chain acts, two limiting regimes arise:
   - **Regime 5a — Far-Field Linear Addition Assumption ($r_k \gg r_p$, where $v_{\text{esc}}(r_k) \ll v_{\infty,\text{SOM}}$):**
     **Explicit Assumption:** Tether $\Delta v_{\text{tether}}$ adds **linearly** to $v_\infty$ *if and only if* the tether encounters take place far out of the solar gravity well ($r_k \gtrsim 1\text{–}5\text{ AU}$, where $v_{\text{esc}}(r_k)^2 \ll v_{\infty,\text{SOM}}^2$ so $\sqrt{v_{\infty,\text{SOM}}^2 + v_{\text{esc}}(r_k)^2} \approx v_{\infty,\text{SOM}}$):
     $$v_{\infty,\text{linear}} \approx v_{\infty,\text{SOM}} + \sum_{k=1}^{N_{\text{tether}}} \Delta v_{\text{tether},k} + \Delta v_{\text{hitchhike}}$$
     We adopt this **Far-Field Linear** sum as our primary baseline metric because it provides a conservative, gravity-assist-decoupled accounting of tether $\Delta v$ and matches the linear event-accumulation structure in [`prototype/spacekit/engine.js`](../../prototype/spacekit/engine.js). However, as detailed in Section 5.3, bound heliocentric tethers at $r_k \ge 1\text{ AU}$ have orbital speeds $v_{\text{cm}} < 42.1\text{ km/s}$ and tip speeds $v_{\text{tip}} \sim 2\text{–}5\text{ km/s}$, making a far-field outbound catch at $\sim 100\text{ km/s}$ kinematically **speculative** unless the tethers themselves are on hyperbolic/grazing trajectories.
   - **Regime 5b — Near-Perihelion Oberth-Boosted Alternative ($r_k \approx r_p$):**
     Conversely, if the tether encounters occur deep in the solar gravity well near perihelion ($r_k \approx r_p$, where highly eccentric sungrazing tether stations have heliocentric speeds $v_{\text{cm}}(r_p) \approx v_{\text{esc}}(r_p) \sim 250\text{–}370\text{ km/s}$ that better match the probe's speed), the tether impulse $\Delta v_{\text{tether}}$ also benefits from the **Solar Oberth effect**:
     $$v_{\infty,\text{Oberth-tether}}(r_k \approx r_p) = \sqrt{\left(v_p^+ + \Delta v_{\text{tether}}\right)^2 - v_{\text{esc}}(r_p)^2} + \Delta v_{\text{hitchhike}}$$
     For an intermediate inner-system tether deployment (e.g., centered near $r_k = 0.1\text{ AU} \approx 21.5\,R_\odot$, where $v_{\text{esc}} = 133.17\text{ km/s}$), the asymptotic speed lies between the Far-Field Linear value and the Perihelion Oberth-Boosted limit. Both values are reported in Sections 2, 4, and 6.

---

## 2. Concept A: Chemical + Solar Oberth + Tether Chain *(Tether Chain Speculative)*

### 2.1 Architecture Overview
Refueled Starship-class chemical upper stage in LEO injects a multi-stage solid/cryogenic stack and thermal shield onto a high-$C_3$ trajectory to Jupiter. An unpowered retrograde Jupiter gravity assist (JGA) zeroes out perihelion angular momentum, dropping the stack to $r_p = 4\text{–}6\,R_\odot$. At perihelion, the probe executes a high-thrust chemical/solid Oberth burn and jettisons the charred thermal shield. Up to this point ($v_{\infty,\text{SOM}} = 76.42\text{–}98.90\text{ km/s}$), the architecture is grounded in near-term literature (JHU/APL Interstellar Probe [1, 2] and Project Lyra [4, 5]).

To push beyond $100\text{ km/s}$, [`DESIGN.md`](../../DESIGN.md) appends a **speculative** chain of 12–15 momentum-exchange rotovators. Staging 12–15 heliocentric rotovators along a single outbound escape trajectory at $\sim 100\text{ km/s}$ when Zylon tether tip speeds are only $v_{\text{tip}} \sim 2\text{–}3\text{ km/s}$ poses severe orbital-phasing and relative-velocity challenges (see Section 5.3) and is flagged accordingly below.

### 2.2 Parameter Table (Concept A)

| Parameter | Baseline Value | Aggressive Value | Status: Sourced vs. Assumed | Cited Source / Basis |
| :--- | :---: | :---: | :--- | :--- |
| **Launch / Earth Departure $C_3$** | $120\text{ km}^2/\text{s}^2$ | $150\text{ km}^2/\text{s}^2$ | **Sourced** (Starship/SLS capability) | JHU/APL ISP ($C_3 \sim 100\text{–}200\text{ km}^2/\text{s}^2$) [1, 2]; Lyra [4] |
| **Earth Departure $\Delta v_{\text{dep}}$** (from $400\text{ km}$ LEO) | $7.8\text{ km/s}$ | $8.9\text{ km/s}$ | **Sourced** (derived from $C_3$) | Vis-viva from $r_{\text{LEO}} = 6778\text{ km}$ |
| **Gravity Assist Body** | Jupiter ($5.204\text{ AU}$) | Jupiter ($5.204\text{ AU}$) | **Sourced** | Hein et al. (Project Lyra) [4, 5]; APL ISP [1] |
| **Perihelion Distance ($r_p$)** | $6.0\,R_\odot$ ($0.0279\text{ AU}$) | $4.0\,R_\odot$ ($0.0186\text{ AU}$) | **Sourced** (Lyra / APL ISP range) | Project Lyra ($6\,R_\odot$) [4, 5]; APL ISP ($3\text{–}6\,R_\odot$) [1, 2] |
| **Pre-Burn Perihelion Speed ($v_p^-$)** | $251.49\text{ km/s}$ | $308.29\text{ km/s}$ | **Derived** (exact vis-viva) | From $r_a = 5.204\text{ AU}$ to $r_p$ |
| **Oberth Propulsion Type & $I_{\text{sp}}$** | LH2/LOX + Solid ($450\text{ s}$) | Adv. LH2/LOX ($460\text{ s}$) | **Sourced** ($I_{\text{sp}}$) | [`SPECS.md`](../../SPECS.md); RL10 / Star 48BV heritage [1, 4] |
| **Perihelion Burn $\Delta v_{\text{burn}}$** | $12.0\text{ km/s}$ | $16.0\text{ km/s}$ | **Assumed** (2-stage micro-kick for $1\text{ kg}$ payload) | Mass ratio $MR \approx 15.1$ (Baseline) to $34.7$ (Aggr.) across 2 stages |
| **Post-Oberth Escape Speed ($v_{\infty,\text{SOM}}$)** | $76.42\text{ km/s}$ | $98.90\text{ km/s}$ | **Derived** (vis-viva + Oberth) | Comparable to Project Lyra ($55\text{–}75\text{ km/s}$ at lower $\Delta v$) [4, 5] |
| **Tether Chain Stations ($N_{\text{tether}}$)** | $12$ stations | $15$ stations | **Assumed / Speculative** (phased outbound highway) | [`DESIGN.md`](../../DESIGN.md); see Section 5.3 catch-speed critique |
| **$\Delta v$ per Tether Encounter ($\Delta v_{\text{stage}}$)** | $3.0\text{ km/s}$ | $4.0\text{ km/s}$ | **Sourced** (single-tether Zylon/PBO limit) | Hoyt & Forward ($v_{\text{tip}} \sim 1.5\text{–}2.5\text{ km/s}$) [10, 11] |
| **Cumulative Tether $\Delta v_{\text{tether}}$** | $+36.0\text{ km/s}$ | $+60.0\text{ km/s}$ | **Assumed / Speculative** (multi-tether chain sum) | [`TRAJECTORY_IDEAS.md`](../TRAJECTORY_IDEAS.md) ($+30\text{–}60\text{ km/s}$) |
| **Final $v_\infty$ (Far-Field Linear Tether)** | **$112.42\text{ km/s}$** | **$158.90\text{ km/s}$** | **Derived** (Regime 5a: $r_k \gg r_p$) | Assumes tethers act at $r_k \gg r_p$ ($v_{\text{esc}}(r_k) \ll v_\infty$) |
| **Fraction of $c$ (Far-Field Linear)** | **$3.75 \times 10^{-4}\,c$** | **$5.30 \times 10^{-4}\,c$** | **Derived** (Regime 5a) | $23.72\text{ AU/yr}$ (Baseline) / $33.52\text{ AU/yr}$ (Aggressive) |
| **Alt. $v_\infty$ (Perihelion Oberth-Boosted Tether)** | **$161.58\text{ km/s}$** | **$228.68\text{ km/s}$** | **Derived** (Regime 5b: $r_k \approx r_p$) | Upper bound if all tether $\Delta v_{\text{tether}}$ acts near $r_p$ ($0.539\text{–}0.763 \times 10^{-3}\,c$) |

### 2.3 Back-of-Envelope Calculation (Concept A)
- **Baseline ($r_p = 6.0\,R_\odot$, $\Delta v_{\text{burn}} = 12.0\text{ km/s}$, $\Delta v_{\text{tether}} = 36.0\text{ km/s}$):**
  $$v_{\text{esc}}(6\,R_\odot) = \frac{617.675}{\sqrt{6}} = 252.16\text{ km/s}, \quad v_p^- = \sqrt{252.16^2 - \frac{1.32712 \times 10^{11}}{2.616\text{ AU}}} = 251.49\text{ km/s}$$
  $$v_p^+ = 251.49 + 12.0 = 263.49\text{ km/s} \implies v_{\infty,\text{SOM}} = \sqrt{263.49^2 - 252.16^2} = 76.42\text{ km/s}$$
  - *Far-Field Linear Tether Regime ($r_k \gg r_p$):*
    $$v_{\infty,\text{linear}} = 76.42 + 12 \times 3.0 = \mathbf{112.42\text{ km/s}} \quad (\mathbf{0.375 \times 10^{-3}\,c},\; 23.72\text{ AU/yr})$$
  - *Oberth-Boosted Tether Alternative:* If tether encounters occur near perihelion ($r_k \approx 6\,R_\odot$), $v_p^{\text{tot}} = 263.49 + 36.0 = 299.49\text{ km/s}$, yielding:
    $$v_{\infty,\text{Oberth-tether}}(r_k \approx r_p) = \sqrt{299.49^2 - 252.16^2} = \mathbf{161.58\text{ km/s}} \quad (\mathbf{0.539 \times 10^{-3}\,c},\; 34.09\text{ AU/yr})$$
    *(If centered at an inner-system ring $r_k = 0.1\text{ AU}$ where $v_{\text{esc}} = 133.17\text{ km/s}$, $v_\infty = \sqrt{(\sqrt{76.42^2 + 133.17^2} + 36.0)^2 - 133.17^2} = \mathbf{134.88\text{ km/s}}$ / $0.450 \times 10^{-3}\,c$.)*
- **Aggressive ($r_p = 4.0\,R_\odot$, $\Delta v_{\text{burn}} = 16.0\text{ km/s}$, $\Delta v_{\text{tether}} = 60.0\text{ km/s}$):**
  $$v_{\text{esc}}(4\,R_\odot) = 308.84\text{ km/s}, \quad v_p^- = 308.29\text{ km/s}, \quad v_p^+ = 308.29 + 16.0 = 324.29\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{324.29^2 - 308.84^2} = 98.90\text{ km/s}$$
  - *Far-Field Linear Tether Regime ($r_k \gg r_p$):*
    $$v_{\infty,\text{linear}} = 98.90 + 60.0 = \mathbf{158.90\text{ km/s}} \quad (\mathbf{0.530 \times 10^{-3}\,c},\; 33.52\text{ AU/yr})$$
  - *Oberth-Boosted Tether Alternative:* If tether encounters occur near perihelion ($r_k \approx 4\,R_\odot$), $v_p^{\text{tot}} = 324.29 + 60.0 = 384.29\text{ km/s}$, yielding:
    $$v_{\infty,\text{Oberth-tether}}(r_k \approx r_p) = \sqrt{384.29^2 - 308.84^2} = \mathbf{228.68\text{ km/s}} \quad (\mathbf{0.763 \times 10^{-3}\,c},\; 48.24\text{ AU/yr})$$
    *(At $r_k = 0.1\text{ AU}$, $v_\infty = \mathbf{182.46\text{ km/s}}$ / $0.609 \times 10^{-3}\,c$.)*

---

## 3. Concept B: Sundiver Hybrid (Solar Sail + Chemical Oberth)

### 3.1 Architecture Overview
Eliminates external tether infrastructure in favor of a self-contained hybrid vehicle combining a compact solid/chemical kick stage at perihelion with an ultra-light refractory solar sail deployed immediately at/after perihelion ($r_p = 5\text{–}10\,R_\odot$). The chemical burn supplies an immediate impulse deep in the gravity well, while the high-lightness-number ($\beta = 0.25\text{–}0.50$) solar sail provides continuous radial acceleration from $r_p$ outward.

### 3.2 Parameter Table (Concept B)

| Parameter | Baseline Value | Aggressive Value | Status: Sourced vs. Assumed | Cited Source / Basis |
| :--- | :---: | :---: | :--- | :--- |
| **Launch / Earth Departure $C_3$** | $95\text{ km}^2/\text{s}^2$ | $125\text{ km}^2/\text{s}^2$ | **Sourced** | Falcon Heavy / Starship direct to Jupiter [4, 6] |
| **Gravity Assist Body** | Jupiter ($5.204\text{ AU}$) | Jupiter ($5.204\text{ AU}$) | **Sourced** | KISS Sundiver / Turyshev et al. [6, 7] |
| **Perihelion Distance ($r_p$)** | $10.0\,R_\odot$ ($0.0465\text{ AU}$) | $5.0\,R_\odot$ ($0.0233\text{ AU}$) | **Sourced** ($10\,R_\odot \approx$ PSP; $5\,R_\odot$ advanced sail) | Parker Solar Probe ($9.86\,R_\odot$) [3]; Davoyan/Turyshev ($5\text{–}20\,R_\odot$) [6, 8, 9] |
| **Effective Sail Areal Density ($\sigma_{\text{eff}}$)** | $6.12\text{ g/m}^2$ | $3.06\text{ g/m}^2$ | **Sourced** (graphene/aerogel/refractory films) | Turyshev et al. (2020/2023) [6, 7]; Davoyan et al. (2021) [9] |
| **Sail Lightness Number ($\beta$)** | $0.25$ | $0.50$ | **Sourced** ($\beta = 1.53\text{ g/m}^2 / \sigma_{\text{eff}}$) | KISS Sundiver studies ($\beta \sim 0.15\text{–}0.60$) [6, 7, 8] |
| **Sail Area ($A$) for $1.0\text{ kg}$ Probe** | $\sim 330\text{ m}^2$ ($R \approx 10.2\text{ m}$) | $\sim 650\text{ m}^2$ ($R \approx 14.4\text{ m}$) | **Derived** (includes sail mass fraction) | Assuming total sailcraft mass $m_{\text{tot}} \approx 2.0\text{ kg}$ ($1\text{ kg}$ payload + $1\text{ kg}$ sail) |
| **Perihelion Chemical Burn ($\Delta v_{\text{burn}}$)** | $6.0\text{ km/s}$ | $8.0\text{ km/s}$ | **Assumed** (hybrid kick stage) | Jettisoned solid/liquid micro-thruster prior to sail unfurling |
| **Pure Sail Escape Speed ($\Delta v_{\text{burn}} = 0$)** | $97.66\text{ km/s}$ | $195.33\text{ km/s}$ | **Derived** ($v_\infty = \sqrt{\beta}\,v_{\text{esc}}(r_p)$) | Matches Turyshev/Davoyan extreme sundiver ($20\text{–}40\text{ AU/yr}$) [6, 9] |
| **Final Hybrid Asymptotic Speed ($v_\infty$)** | **$107.56\text{ km/s}$** | **$205.64\text{ km/s}$** | **Derived** (Hybrid Equation 1.4) | Consistent with [`TRAJECTORY_IDEAS.md`](../TRAJECTORY_IDEAS.md) ($100\text{–}160+\text{ km/s}$) |
| **Fraction of $c$ ($v_\infty / c$)** | **$3.59 \times 10^{-4}\,c$** | **$6.86 \times 10^{-4}\,c$** | **Derived** | $22.69\text{ AU/yr}$ (Baseline) / $43.38\text{ AU/yr}$ (Aggressive) |

### 3.3 Back-of-Envelope Calculation (Concept B)
- **Baseline ($r_p = 10.0\,R_\odot$, $\beta = 0.25$, $\Delta v_{\text{burn}} = 6.0\text{ km/s}$):**
  $$v_{\text{esc}}(10\,R_\odot) = \frac{617.675}{\sqrt{10}} = 195.33\text{ km/s}, \quad v_p^- = 194.46\text{ km/s}, \quad v_p^+ = 194.46 + 6.0 = 200.46\text{ km/s}$$
  $$v_{\infty,\text{hybrid}} = \sqrt{(200.46)^2 - (1 - 0.25)(195.33)^2} = \sqrt{40184.2 - 28615.4} = \mathbf{107.56\text{ km/s}} \quad (\mathbf{0.359 \times 10^{-3}\,c},\; 22.69\text{ AU/yr})$$
- **Aggressive ($r_p = 5.0\,R_\odot$, $\beta = 0.50$, $\Delta v_{\text{burn}} = 8.0\text{ km/s}$):**
  $$v_{\text{esc}}(5\,R_\odot) = 276.23\text{ km/s}, \quad v_p^- = 275.62\text{ km/s}, \quad v_p^+ = 275.62 + 8.0 = 283.62\text{ km/s}$$
  $$v_{\infty,\text{hybrid}} = \sqrt{(283.62)^2 - (1 - 0.50)(276.23)^2} = \sqrt{80440.3 - 38151.5} = \mathbf{205.64\text{ km/s}} \quad (\mathbf{0.686 \times 10^{-3}\,c},\; 43.38\text{ AU/yr})$$

---

## 4. Concept C: Infrastructure-Heavy (Pre-Deployed Tether Chain + STP/NTP Oberth) *(Speculative / Aspirational Full Stack)*

### 4.1 Architecture Overview

The [C/1843 D1 hitchhike analysis](comet-hitchhike.md) checks whether a natural
sungrazer can replace this infrastructure. Its 566.6 km/s at 1.1885 R☉ is
bound orbital motion (ε = −6.902 km²/s², aphelion 128.53 AU), so riding it
alone supplies no escape. A 24 km/s prograde burn there yields 166.6 km/s v∞
versus this baseline's 136.4 km/s; reaching 300 km/s by the burn alone needs
74.5 km/s Δv and faces 44.6 MW/m², 8.67 times the flux at 3.5 R☉. Nucleus
shade, gas recoil and survival estimates do not make it a practical shortcut.

Concept C is the speculative/aspirational full-stack architecture formulated to reach the [`GOAL.md`](../../GOAL.md) target of **$0.001c$ ($\approx 300\text{ km/s}$)**. While its solar-thermal propulsion (STP) Oberth core is grounded in NASA/APL studies ($v_{\infty,\text{SOM}} \approx 136\text{–}182\text{ km/s}$), closing the remaining gap to $300\text{ km/s}$ under linear far-field addition requires $+110\text{ km/s}$ from an outbound CNT tether highway (or $+37\text{ km/s}$ if tethers act right at perihelion), making the full-stack $0.001c$ case explicitly **aspirational**. It combines:
1. **Inbound Tether Network + Jupiter Assist *(Speculative)*:** Pre-deployed inner/outer solar system rotovators plus a retrograde Jupiter assist inject the upper stage onto a hyperbolic solar plunge ($v_{\infty,\text{in}} = 45\text{–}70\text{ km/s}$).
2. **Transpiration-Cooled Solar-Thermal Propulsion (STP) Oberth Maneuver at $r_p = 2.8\text{–}3.5\,R_\odot$ *(Sourced Literature Concept)*:** Using liquid hydrogen ($H_2$) routed through a regenerative/transpiration-cooled refractory heat shield that doubles as a solar-thermal heat exchanger ($I_{\text{sp}} = 1000\text{–}1250\text{ s}$, per Lyman et al. [12] and Benkoski NIAC [13]), achieving $\Delta v_{\text{STP}} = 24\text{–}36\text{ km/s}$ at extreme perihelion.
3. **Outbound CNT Tether Highway + Optional ISO Hitchhike *(Speculative / Aspirational)*:** 15–22 high-tip-speed carbon-nanotube (CNT) rotovators ($\Delta v_{\text{tether}} = 60\text{–}110\text{ km/s}$), plus an optional $+8\text{ km/s}$ grapple/hitchhike off a fast asteroid or interstellar object (ISO) [14].

### 4.2 Parameter Table (Concept C)

| Parameter | Baseline Value | Aggressive Value | $0.001c$ Threshold Value *(Aspirational)* | Status: Sourced vs. Assumed | Cited Source / Basis |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Inbound Hyperbolic Excess ($v_{\infty,\text{in}}$)** | $45.0\text{ km/s}$ | $60.0\text{ km/s}$ | $70.0\text{ km/s}$ | **Assumed / Speculative** (inbound tether highway + JGA) | Pre-Oberth staging via 8–12 inner-system rotovators [10] |
| **Perihelion Distance ($r_p$)** | $3.5\,R_\odot$ ($0.0163\text{ AU}$) | $3.0\,R_\odot$ ($0.0140\text{ AU}$) | $2.8\,R_\odot$ ($0.0130\text{ AU}$) | **Sourced** (extreme SOM studies) | APL ISP ($3\,R_\odot$) [1, 2]; Lyman STP ($2.5\text{–}4\,R_\odot$) [12]; Benkoski [13] |
| **Local Escape Speed ($v_{\text{esc}}(r_p)$)** | $330.16\text{ km/s}$ | $356.61\text{ km/s}$ | $369.13\text{ km/s}$ | **Derived** | Equation 1.1 |
| **Pre-Burn Perihelion Speed ($v_p^-$)** | $333.21\text{ km/s}$ | $361.63\text{ km/s}$ | $375.71\text{ km/s}$ | **Derived** | $v_p^- = \sqrt{v_{\text{esc}}(r_p)^2 + v_{\infty,\text{in}}^2}$ |
| **Propulsion Type & $I_{\text{sp}}$** | $H_2$ STP ($1000\text{ s}$) | $H_2$ STP ($1150\text{ s}$) | Adv. $H_2$/Dissoc. STP ($1250\text{ s}$) | **Sourced** ($H_2$ STP at $>2800\text{ K}$) | Lyman et al. (2001) [12]; Benkoski et al. (2023) [13]; Duplay [15] |
| **Perihelion STP Burn ($\Delta v_{\text{STP}}$)** | $24.0\text{ km/s}$ | $32.0\text{ km/s}$ | $36.0\text{ km/s}$ | **Assumed** (2-stage STP, $MR \approx 11.5\text{–}19$) | Rocket equation with $v_e = 9.8\text{–}12.3\text{ km/s}$ |
| **Post-Oberth Escape Speed ($v_{\infty,\text{SOM}}$)** | $136.36\text{ km/s}$ | $166.64\text{ km/s}$ | $182.34\text{ km/s}$ | **Derived** (vis-viva + Oberth) | Equation 1.3 |
| **Outbound Tether Stations ($N_{\text{tether}}$)** | $15$ stations | $18$ stations | $22$ stations | **Assumed / Aspirational** (infrastructure-heavy) | [`DESIGN.md`](../../DESIGN.md) ("10–20+ momentum-exchange tethers") |
| **$\Delta v$ per CNT Tether ($\Delta v_{\text{stage}}$)** | $4.0\text{ km/s}$ | $5.0\text{ km/s}$ | $5.0\text{ km/s}$ | **Sourced** (CNT theoretical/lab fiber limit) | [`SPECS.md`](../../SPECS.md); Bogar et al. / Hoyt CNT tethers [10, 11] |
| **Cumulative Outbound Tether $\Delta v_{\text{tether}}$** | $+60.0\text{ km/s}$ | $+90.0\text{ km/s}$ | $+110.0\text{ km/s}$ | **Assumed / Aspirational** (phased chain sum) | [`DESIGN.md`](../../DESIGN.md); see Section 5.3 feasibility limits |
| **ISO / Asteroid Hitchhike ($\Delta v_{\text{hitch}}$)** | $0.0\text{ km/s}$ | $0.0\text{ km/s}$ | $+8.0\text{ km/s}$ | **Sourced** (NIAC Comet Hitchhiker) | Ono et al. (2015) [14]; [`SPECS.md`](../../SPECS.md) ($2\text{–}10\text{ km/s}$) |
| **Final $v_\infty$ (Far-Field Linear Tether)** | **$196.36\text{ km/s}$** | **$256.64\text{ km/s}$** | **$300.34\text{ km/s}$** | **Derived** (Regime 5a: $r_k \gg r_p$) | Achieves $\ge 299.8\text{ km/s}$ ($0.001c$) in Aspirational Threshold case |
| **Fraction of $c$ (Far-Field Linear)** | **$6.55 \times 10^{-4}\,c$** | **$8.56 \times 10^{-4}\,c$** | **$1.002 \times 10^{-3}\,c$** | **Derived** (Regime 5a) | $41.42$, $54.14$, and $63.36\text{ AU/yr}$ respectively |
| **Alt. $v_\infty$ (Perihelion Oberth-Boosted Tether)** | **$255.07\text{ km/s}$** | **$326.68\text{ km/s}$** | **$376.68\text{ km/s}$** | **Derived** (Regime 5b: $r_k \approx r_p$) | Upper bound if tether $\Delta v_{\text{tether}}$ acts near $r_p$ ($0.851\text{–}1.256 \times 10^{-3}\,c$) |

### 4.3 Back-of-Envelope Calculation (Concept C)
- **Baseline ($r_p = 3.5\,R_\odot$, $v_{\infty,\text{in}} = 45\text{ km/s}$, $\Delta v_{\text{STP}} = 24\text{ km/s}$, $\Delta v_{\text{tether}} = 60\text{ km/s}$):**
  $$v_{\text{esc}}(3.5\,R_\odot) = 330.16\text{ km/s}, \quad v_p^- = \sqrt{330.16^2 + 45.0^2} = 333.21\text{ km/s}, \quad v_p^+ = 333.21 + 24.0 = 357.21\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{357.21^2 - 330.16^2} = 136.36\text{ km/s}$$
  - *Far-Field Linear Tether Regime ($r_k \gg r_p$):* $v_{\infty,\text{linear}} = 136.36 + 60.0 = \mathbf{196.36\text{ km/s}}$ ($\mathbf{0.655 \times 10^{-3}\,c}$).
  - *Oberth-Boosted Tether Alternative ($r_k \approx 3.5\,R_\odot$):* $v_{\infty,\text{Oberth-tether}} = \sqrt{(357.21 + 60.0)^2 - 330.16^2} = \mathbf{255.07\text{ km/s}}$ ($\mathbf{0.851 \times 10^{-3}\,c}$; or $\mathbf{212.30\text{ km/s}}$ at $r_k = 0.1\text{ AU}$).
- **Aggressive ($r_p = 3.0\,R_\odot$, $v_{\infty,\text{in}} = 60\text{ km/s}$, $\Delta v_{\text{STP}} = 32\text{ km/s}$, $\Delta v_{\text{tether}} = 90\text{ km/s}$):**
  $$v_{\text{esc}}(3.0\,R_\odot) = 356.61\text{ km/s}, \quad v_p^- = \sqrt{356.61^2 + 60.0^2} = 361.63\text{ km/s}, \quad v_p^+ = 361.63 + 32.0 = 393.63\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{393.63^2 - 356.61^2} = 166.64\text{ km/s}$$
  - *Far-Field Linear Tether Regime ($r_k \gg r_p$):* $v_{\infty,\text{linear}} = 166.64 + 90.0 = \mathbf{256.64\text{ km/s}}$ ($\mathbf{0.856 \times 10^{-3}\,c}$).
  - *Oberth-Boosted Tether Alternative ($r_k \approx 3.0\,R_\odot$):* $v_{\infty,\text{Oberth-tether}} = \sqrt{(393.63 + 90.0)^2 - 356.61^2} = \mathbf{326.68\text{ km/s}}$ ($\mathbf{1.090 \times 10^{-3}\,c}$ — already exceeding $0.001c$; or $\mathbf{272.52\text{ km/s}}$ at $r_k = 0.1\text{ AU}$).
- **Aspirational $0.001c$ Threshold ($r_p = 2.8\,R_\odot$, $v_{\infty,\text{in}} = 70\text{ km/s}$, $\Delta v_{\text{STP}} = 36\text{ km/s}$, $\Delta v_{\text{tether}} = 110\text{ km/s}$, $\Delta v_{\text{hitch}} = 8\text{ km/s}$):**
  $$v_{\text{esc}}(2.8\,R_\odot) = 369.13\text{ km/s}, \quad v_p^- = \sqrt{369.13^2 + 70.0^2} = 375.71\text{ km/s}, \quad v_p^+ = 375.71 + 36.0 = 411.71\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{411.71^2 - 369.13^2} = 182.34\text{ km/s}$$
  - *Far-Field Linear Tether Regime ($r_k \gg r_p$):* $v_{\infty,\text{linear}} = 182.34 + 110.0 + 8.0 = \mathbf{300.34\text{ km/s}}$ ($\mathbf{1.002 \times 10^{-3}\,c}$).
  - *Oberth-Boosted Tether Alternative ($r_k \approx 2.8\,R_\odot$):* $v_{\infty,\text{Oberth-tether}} = \sqrt{(411.71 + 110.0)^2 - 369.13^2} + 8.0 = 368.68 + 8.0 = \mathbf{376.68\text{ km/s}}$ ($\mathbf{1.256 \times 10^{-3}\,c}$; or $\mathbf{316.26\text{ km/s}}$ at $r_k = 0.1\text{ AU}$).
  - *(Note: If tethers act near perihelion at $r_p = 2.8\,R_\odot$, only $\Delta v_{\text{tether}} = \sqrt{(291.80)^2 + 369.13^2} - 411.71 = \mathbf{58.8\text{ km/s}}$ — rather than $110\text{ km/s}$ — would be needed after the STP burn to reach $300\text{ km/s}$, though surviving and grappling at $2.8\,R_\odot$ is equally aspirational.)*

---

## 5. Material, Thermal, and Physical Limits

### 5.1 Solar Perihelion Thermal Limits
Solar irradiance scales as $F(r_p) = L_\odot / (4\pi r_p^2)$. The equilibrium temperature of a flat, 1-sided radiator is $T_{\text{eq}} = \left(\frac{\alpha_{\text{eff}} F(r_p)}{\varepsilon \sigma_{\text{SB}}}\right)^{1/4}$, where $\alpha_{\text{eff}} / \varepsilon$ incorporates optical selectivity or conical grazing-incidence geometry ($\eta_{\text{opt}} \approx 0.15$).

| Perihelion $r_p$ | Distance ($\text{AU}$) | Solar Flux ($\text{MW/m}^2$) | Suns ($1361\text{ W/m}^2$) | Normal Blackbody $T_{\text{bb}}$ ($\alpha/\varepsilon=1$) | Grazing/Coated Shield $T_{\text{eff}}$ ($\eta_{\text{opt}}=0.15$) | Viable TPS / Sail Material Regime |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **$9.86\,R_\odot$** | $0.0459$ | $0.65$ | $476\times$ | $1838\text{ K}$ ($1565\,^\circ\text{C}$) | $1144\text{ K}$ ($871\,^\circ\text{C}$) | **Flight-proven:** Parker Solar Probe carbon-carbon + $\text{Al}_2\text{O}_3$ coating (rated to $\sim 1650\text{ K}$) [3] |
| **$6.0\,R_\odot$** | $0.0279$ | $1.75$ | $1285\times$ | $2356\text{ K}$ ($2083\,^\circ\text{C}$) | $1466\text{ K}$ ($1193\,^\circ\text{C}$) | **Near-term:** Uncoated C-C / pyrolytic graphite wedge shield (APL ISP baseline) [1, 2] |
| **$5.0\,R_\odot$** | $0.0233$ | $2.52$ | $1850\times$ | $2581\text{ K}$ ($2308\,^\circ\text{C}$) | $1606\text{ K}$ ($1333\,^\circ\text{C}$) | **Advanced:** Refractory $\text{SiN}_x$/$\text{TiO}_2$ dielectric photonic sails [9] or C-C/TaC shield |
| **$4.0\,R_\odot$** | $0.0186$ | $3.93$ | $2890\times$ | $2886\text{ K}$ ($2613\,^\circ\text{C}$) | $1796\text{ K}$ ($1523\,^\circ\text{C}$) | **Passive TPS limit:** Conical tungsten/tantalum-hafnium carbide ($\text{Ta}_4\text{HfC}_5$, $T_m \approx 4200\text{ K}$) |
| **$3.0\text{–}2.8\,R_\odot$** | $0.014\text{–}0.013$ | $6.99\text{–}8.03$ | $5138\text{–}5899\times$ | $3332\text{–}3449\text{ K}$ | $2074\text{–}2147\text{ K}$ | **Active cooling required:** Transpiration-cooled $H_2$ STP heat shield [12, 13]; carbon sublimates above $\sim 3200\text{ K}$ in vacuum |

### 5.2 Momentum-Exchange Tether Material & G-Load Limits
- **Specific Strength & Tip Speed:** An untapered tether snaps near its characteristic velocity $v_c = \sqrt{2\sigma_{\text{tensile}} / \rho}$; exponentially tapered rotovators can operate up to $v_{\text{tip}} \approx 1.0\text{–}1.3\,v_c$ at reasonable tether-to-payload mass ratios ($10\text{–}50$) [10, 11].
  - **Zylon (PBO)** ($\sigma \approx 5.8\text{ GPa}$, $\rho = 1540\text{ kg/m}^3$): $v_c \approx 2.74\text{ km/s}$; practical single-encounter $\Delta v_{\text{stage}} \approx 2.5\text{–}3.5\text{ km/s}$ (used in **Concept A**).
  - **Carbon Nanotube (CNT) / Graphene Yarn** ($\sigma \approx 15\text{–}45\text{ GPa}$ macro-yarn, $\rho = 1300\text{ kg/m}^3$): $v_c \approx 4.8\text{–}8.3\text{ km/s}$; practical $\Delta v_{\text{stage}} \approx 4.0\text{–}6.0\text{ km/s}$ (required for **Concept C**).
- **Centripetal Acceleration at Grapple:** At $v_{\text{tip}} = 4\text{ km/s}$ and tether arm radius $L = 100\text{ km}$, the grapple tip acceleration is $a_c = v_{\text{tip}}^2 / L = 160\text{ m/s}^2 \approx 16.3\,g$, easily survivable by a solid-state $1\text{ kg}$ probe (`SPECS.md`), though requiring sub-millisecond autonomous rendezvous timing.

### 5.3 Speculative / Aspirational Nature of Outbound Heliocentric Tether Chains
While single-tether momentum exchange in planetary orbit (e.g., LEO-to-lunar MXER [10]) is well-modeled in astrodynamics literature, stringing **12–22 heliocentric rotovators along an outbound hyperbolic escape trajectory at $100\text{–}300\text{ km/s}$** (Concepts A and C) involves three severe physical barriers that render outbound tether chains **speculative / aspirational**:
1. **Encounter / Catch-Speed Mismatch vs. Bound Orbital Speeds:** A bound heliocentric tether station at radius $r_k$ must have center-of-mass speed $v_{\text{cm}}(r_k) < v_{\text{esc}}(r_k)$. Meanwhile, after the Solar Oberth burn, the escaping probe is on a hyperbolic trajectory with speed $v(r_k) = \sqrt{v_\infty^2 + v_{\text{esc}}(r_k)^2} > v_{\text{esc}}(r_k)$. For the tether to catch the probe at zero relative tip velocity (or impart a prograde impulse without tearing the tether), the tether's orbital velocity plus tip speed must match or exceed the probe's speed ($v_{\text{cm}}(r_k) + v_{\text{tip}} \ge v(r_k)$):
   - **Far from the Sun ($r_k \ge 1\text{ AU}$, $v_{\text{esc}} \le 42.1\text{ km/s}$):** A probe with $v_\infty \approx 100\text{ km/s}$ moves at $\sim 108\text{ km/s}$, whereas a bound tether at $1\text{ AU}$ moves at $< 42.1\text{ km/s}$ with $v_{\text{tip}} \sim 2\text{–}5\text{ km/s}$. The relative encounter speed ($\gtrsim 65\text{ km/s}$) exceeds the tether's tip speed by more than $20\times$, making a bound far-field catch impossible unless the tether stations themselves are pre-accelerated onto hyperbolic trajectories.
   - **Near Perihelion ($r_k \approx r_p = 3\text{–}6\,R_\odot$, $v_{\text{esc}} \approx 252\text{–}357\text{ km/s}$):** Highly eccentric sungrazing tether stations ($e \to 1$) have perihelion speeds $v_{\text{cm}}(r_p) \approx v_{\text{esc}}(r_p)$ within $10\text{–}25\text{ km/s}$ of the probe's speed, reducing the velocity gap and providing an **Oberth boost** to any tether $\Delta v$ imparted (Regime 5b). However, even at perihelion, once the probe's excess speed exceeds $v_p - v_{\text{esc}}(r_p) > 2 v_{\text{tip}}$ ($\sim 6\text{–}10\text{ km/s}$), a single bound tether can no longer match the probe's speed without multistage tether-to-tether handoffs *prior* to the final rocket burn.
2. **Pre-Oberth (Inbound) vs. Post-Oberth (Outbound) Staging:** Because of the bound-orbit speed ceiling, most physical tether stages in a realistic 2-body architecture would have to act **inbound** (accelerating the carrier stack onto a hyperbolic solar plunge *before* the perihelion rocket burn) rather than along the outbound asymptote.
3. **Multi-Orbit Synodic Phasing:** Aligning 12–22 independent eccentric heliocentric tether stations so that both their orbital positions and their rotating tether tips ($\omega = v_{\text{tip}} / L \sim 0.03\text{–}0.05\text{ rad/s}$) intersect a single straight-line hyperbolic escape asymptote within milliseconds is an extreme astrodynamic control problem.

---

## 6. Consolidated Regression Table

The table below provides:
1. **Physical $v_{\infty,\text{SOM}}$:** Post-Oberth asymptotic speed from the perihelion burn alone.
2. **Physical Final $v_\infty$ (Far-Field Linear Tether, Regime 5a):** Assumes tether $\Delta v$ acts at $r_k \gg r_p$ where $v_{\text{esc}}(r_k) \ll v_\infty$ (unboosted linear addition).
3. **Physical Final $v_\infty$ (Perihelion Oberth Tether, Regime 5b):** Upper bound assuming tether $\Delta v$ acts near perihelion $r_k \approx r_p$ and gains the Solar Oberth multiplier.
4. **Current `engine.js` Output:** Computed from `applyEvents` / `applyTrajectory` in the physical patched-conic engine ([`prototype/spacekit/engine.js`](../../prototype/spacekit/engine.js)), which integrates vis-viva state vectors across impulsive `oberthBurn` and `tetherRelease` events (`v∞ = sqrt((v_p + Δv)² − v_esc²)` at perihelion). Baseline scenarios (`prototype/spacekit/scenarios/scenario-{a,b,c}.json`, PR #20) place outbound tether chains at $10\text{–}30\text{ AU}$; `solarSail` ($\beta$) and `hitchhike` are not yet modelled in the engine.

| Scenario ID | Concept & Variant | $r_p$ ($R_\odot$ / $\text{AU}$) | Perihelion $\Delta v_{\text{burn}}$ ($\text{km/s}$) | Sail $\beta$ | Inbound / Outbound Tether + Hitch $\Delta v$ ($\text{km/s}$) | Physical $v_{\infty,\text{SOM}}$ ($\text{km/s}$) | Final $v_\infty$: Far-Field Linear ($\text{km/s}$ / $c$) | Final $v_\infty$: Near-$r_p$ Oberth Tether ($\text{km/s}$ / $c$) | Cruise Speed Linear ($\text{AU/yr}$) | Current `engine.js` $v_\infty$ ($\text{km/s}$)* |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`concept-a-baseline`** | **A:** Chem + SOM + Tether *(Baseline, Speculative Tether)* | $6.0\,R_\odot$ ($0.0279\text{ AU}$) | $12.0$ | $0.00$ | $0\text{ in} + 36.0\text{ out}$ | $76.42$ | **$112.42$** ($3.75 \times 10^{-4}\,c$) | **$161.58$** ($5.39 \times 10^{-4}\,c$) | $23.72$ | $112.65$ (`scenario-a.json`; $76.42$ SOM) |
| **`concept-a-aggressive`** | **A:** Chem + SOM + Tether *(Aggressive, Speculative Tether)* | $4.0\,R_\odot$ ($0.0186\text{ AU}$) | $16.0$ | $0.00$ | $0\text{ in} + 60.0\text{ out}$ | $98.90$ | **$158.90$** ($5.30 \times 10^{-4}\,c$) | **$228.68$** ($7.63 \times 10^{-4}\,c$) | $33.52$ | $159.11$ ($10\text{–}30\text{ AU}$ tethers; $98.90$ SOM) |
| **`concept-b-baseline`** | **B:** Sundiver Hybrid *(Baseline)* | $10.0\,R_\odot$ ($0.0465\text{ AU}$) | $6.0$ | $0.25$ | $0$ | $45.07$ | **$107.56$** ($3.59 \times 10^{-4}\,c$) | N/A (No tether) | $22.69$ | $45.07$ (`scenario-b.json`, burn-only; sail unmodelled) |
| **`concept-b-aggressive`** | **B:** Sundiver Hybrid *(Aggressive)* | $5.0\,R_\odot$ ($0.0233\text{ AU}$) | $8.0$ | $0.50$ | $0$ | $64.30$ | **$205.64$** ($6.86 \times 10^{-4}\,c$) | N/A (No tether) | $43.38$ | $64.30$ (burn-only; $\beta = 0.50$ sail unmodelled) |
| **`concept-c-baseline`** | **C:** Infra-Heavy STP + Tether *(Baseline, Speculative)* | $3.5\,R_\odot$ ($0.0163\text{ AU}$) | $24.0$ | $0.00$ | $45.0\text{ in} + 60.0\text{ out}$ | $136.36$ | **$196.36$** ($6.55 \times 10^{-4}\,c$) | **$255.07$** ($8.51 \times 10^{-4}\,c$) | $41.42$ | $196.48$ (`scenario-c.json`; $136.36$ SOM) |
| **`concept-c-aggressive`** | **C:** Infra-Heavy STP + Tether *(Aggressive, Speculative)* | $3.0\,R_\odot$ ($0.0140\text{ AU}$) | $32.0$ | $0.00$ | $60.0\text{ in} + 90.0\text{ out}$ | $166.64$ | **$256.64$** ($8.56 \times 10^{-4}\,c$) | **$326.68$** ($1.090 \times 10^{-3}\,c$) | $54.14$ | $256.75$ ($10\text{–}30\text{ AU}$ tethers; $166.64$ SOM) |
| **`concept-c-001c`** | **C:** Infra-Heavy Full Stack *($0.001c$ Target, Aspirational)* | $2.8\,R_\odot$ ($0.0130\text{ AU}$) | $36.0$ | $0.00$ | $70.0\text{ in} + 110.0\text{ out} + 8.0\text{ hitch}$ | $182.34$ | **$300.34$** ($1.002 \times 10^{-3}\,c$) | **$376.68$** ($1.256 \times 10^{-3}\,c$) | $63.36$ | $292.45$ ($10\text{–}30\text{ AU}$ tethers; `hitchhike` unmodelled) |

*\*Note on Current `engine.js` Column: [`prototype/spacekit/engine.js`](../../prototype/spacekit/engine.js) is a physical two-body conic / impulsive-$\Delta v$ engine that reproduces the exact analytical $v_{\infty,\text{SOM}}$ at perihelion ($76.42$, $98.90$, $45.07$, $64.30$, $136.36$, $166.64$, and $182.34\text{ km/s}$). With outbound `tetherRelease` stations placed between $10$ and $30\text{ AU}$ (as in `prototype/spacekit/scenarios/scenario-{a,c}.json` from PR #20), residual solar gravity gives a small Oberth boost of $+0.11\text{–}0.23\text{ km/s}$ above the $r_k \to \infty$ linear sum (or matching the near-$r_p$ column if placed at perihelion). Continuous solar sail acceleration ($\beta > 0$ in Concept B) and `hitchhike` (the $+8.0\text{ km/s}$ event in `concept-c-001c`, currently in `DEFERRED_TYPES`) are not yet modelled in `engine.js`.*

---

## 7. Cited Sources & References

Every reference below includes a web-verified, resolvable DOI and/or permanent archive URL:

1. **McNutt, R. L., Jr., et al. (2019).** "Near-Term Interstellar Probe: First Step." *Acta Astronautica*, 162, 284–299. DOI: [https://doi.org/10.1016/j.actaastro.2019.06.013](https://doi.org/10.1016/j.actaastro.2019.06.013) — *JHU/APL study detailing Jupiter gravity assist + Solar Oberth maneuvers at $3\text{–}6\,R_\odot$, heat-shield mass scaling, and launch $C_3$ requirements.*
2. **Brandt, P. C., et al. (2022).** "Interstellar Probe: Humanity's Exploration of the Galaxy Begins." *Acta Astronautica*, 199, 364–373. DOI: [https://doi.org/10.1016/j.actaastro.2022.07.011](https://doi.org/10.1016/j.actaastro.2022.07.011) (Full JHU/APL NASA Concept Study Report URL: [https://interstellarprobe.jhuapl.edu/](https://interstellarprobe.jhuapl.edu/)) — *Comprehensive engineering assessment of passive carbon-carbon vs. tungsten/refractory heat shields near the Sun and high-energy upper stages.*
3. **Fox, N. J., Velli, M. C., Bale, S. D., et al. (2016).** "The Solar Probe Plus Mission: Humanity's First Visit to Our Star." *Space Science Reviews*, 204(1–4), 7–48. DOI: [https://doi.org/10.1007/s11214-015-0211-6](https://doi.org/10.1007/s11214-015-0211-6) — *Parker Solar Probe baseline perihelion ($9.86\,R_\odot = 0.0459\text{ AU}$) and Thermal Protection System (TPS) operating limits ($1370\,^\circ\text{C} / 1643\text{ K}$).*
4. **Hein, A. M., Perakis, N., Eubanks, T. M., Hibberd, A., et al. (2019).** "Project Lyra: Sending a spacecraft to 1I/'Oumuamua (former A/2017 U1), the interstellar asteroid." *Acta Astronautica*, 161, 552–561. DOI: [https://doi.org/10.1016/j.actaastro.2018.12.042](https://doi.org/10.1016/j.actaastro.2018.12.042) (Preprint: [https://arxiv.org/abs/1711.03155](https://arxiv.org/abs/1711.03155)) — *Establishes the Jupiter retrograde assist + Solar Oberth burn at $3\text{–}6\,R_\odot$ yielding $v_\infty \approx 55\text{–}75\text{ km/s}$ with solid chemical kick stages.*
5. **Hibberd, A., Hein, A. M., & Eubanks, T. M. (2020).** "Project Lyra: Catching 1I/'Oumuamua – Mission opportunities after 2024." *Acta Astronautica*, 170, 136–144. DOI: [https://doi.org/10.1016/j.actaastro.2020.01.018](https://doi.org/10.1016/j.actaastro.2020.01.018) (Preprint: [https://arxiv.org/abs/1902.04935](https://arxiv.org/abs/1902.04935)) — *Refines thermal shield constraints at $6\,R_\odot$ vs. $10\,R_\odot$ and multi-stage chemical $\Delta v$ budgets.*
6. **Turyshev, S. G., Garber, D., Friedman, L. D., Hein, A. M., Helvajian, H., et al. (2023).** "Science opportunities with solar sailing smallsats." *Planetary and Space Science*, 235, 105744. DOI: [https://doi.org/10.1016/j.pss.2023.105744](https://doi.org/10.1016/j.pss.2023.105744) (Preprint: [https://arxiv.org/abs/2303.14917](https://arxiv.org/abs/2303.14917)) — *KISS/JPL "Sundiver" solar sail architecture using smallsat modular vanes and close solar perihelion passes to achieve high heliocentric excess velocities.*
7. **Turyshev, S. G., Shao, M., Toth, V. T., Friedman, L. D., Alkalai, L., et al. (2020).** "Direct Multipixel Imaging and Spectroscopy of an Exoplanet with a Solar Gravity Lens Mission." *NASA NIAC Phase II Final Report*, arXiv:2002.11871. DOI: [https://doi.org/10.48550/arXiv.2002.11871](https://doi.org/10.48550/arXiv.2002.11871) (URL: [https://arxiv.org/abs/2002.11871](https://arxiv.org/abs/2002.11871)) — *Details high-lightness-number ($\beta$) sundiver trajectories, areal density requirements, and smallsat sailcraft architecture.*
8. **McInnes, C. R. (1999).** *Solar Sailing: Technology, Dynamics and Mission Applications.* Springer-Praxis, London. DOI: [https://doi.org/10.1007/978-1-4471-3992-8](https://doi.org/10.1007/978-1-4471-3992-8) — *Derivation of exact radial sundiver energy equation $v_\infty = \sqrt{\beta}\,v_{\text{esc}}(r_p)$ and lightness number $\beta = 1.53\text{ g/m}^2 / \sigma$.*
9. **Davoyan, A. R., Munday, J. N., Tabiryan, N., Swartzlander, G. A., & Johnson, L. (2021).** "Photonic materials for interstellar solar sailing." *Optica*, 8(5), 722–734. DOI: [https://doi.org/10.1364/OPTICA.417007](https://doi.org/10.1364/OPTICA.417007) — *Analyzes extreme-perihelion ($\le 5\,R_\odot$) refractory dielectric/nitride solar sails reaching $v_\infty \approx 100\text{–}200\text{ km/s}$ ($20\text{–}40\text{ AU/yr}$).*
10. **Hoyt, R. P., & Forward, R. L. (2000).** "Cislunar Tether Transport System." *Journal of Spacecraft and Rockets*, 37(2), 177–186. DOI: [https://doi.org/10.2514/2.3564](https://doi.org/10.2514/2.3564) — *Foundational analysis of staged momentum-exchange rotovator networks, taper ratios, and characteristic velocities.*
11. **Bogar, T. J., Bangham, M. E., Forward, R. L., & Lewis, M. J. (1999).** "Hypersonic Airplane Space Tether Orbital Launch (HASTOL) System: Interim Study Results." *9th AIAA International Space Planes and Hypersonic Systems and Technologies Conference*, AIAA 1999-4802 (NASA/CR-2000-209844). DOI: [https://doi.org/10.2514/6.1999-4802](https://doi.org/10.2514/6.1999-4802) — *Material trade studies comparing Spectra, Zylon (PBO), and Carbon Nanotubes (CNT) for high-tip-speed rotovators.*
12. **Lyman, R. W., Ewing, M. E., Krishnan, R., Lester, D. M., & McNutt, R. L., Jr. (2001).** "Solar Thermal Propulsion for an Interstellar Probe." *37th AIAA/ASME/SAE/ASEE Joint Propulsion Conference*, AIAA 2001-3377. DOI: [https://doi.org/10.2514/6.2001-3377](https://doi.org/10.2514/6.2001-3377) — *Models $H_2$ solar-thermal Oberth burns at $2.5\text{–}4\,R_\odot$ with $I_{\text{sp}} \approx 1000\text{–}1200\text{ s}$.*
13. **Benkoski, J. J., Luedeman, W. L., De, N. N., Brupbacher, M. C., et al. (2023).** "Combined Heat Shield and Solar Thermal Propulsion System for an Oberth Maneuver." *Journal of Propulsion and Power*, 39(2), 284–293. DOI: [https://doi.org/10.2514/1.B38595](https://doi.org/10.2514/1.B38595) (OSTI Report DOI: [https://doi.org/10.2172/1960159](https://doi.org/10.2172/1960159)) — *Transpiration-cooled $H_2$ refractory heat shield/exchanger enabling deep perihelion ($\le 3\,R_\odot$) Solar Oberth propulsion.*
14. **Ono, M., Jewitt, D., Quadrelli, M. B., Lantoine, G., Backes, P., & Yen, C.-W. (2015).** "The Hitchhiker's Guide to the Solar System: A Tethered Orbit Insertion and Landing Concept for Small Body Exploration." *AIAA SPACE 2015 Conference and Exposition*, AIAA 2015-4567. DOI: [https://doi.org/10.2514/6.2015-4567](https://doi.org/10.2514/6.2015-4567) (NASA NTRS URL: [https://ntrs.nasa.gov/citations/20170008241](https://ntrs.nasa.gov/citations/20170008241)) — *Establishes kinetic energy harvesting ($\Delta v \approx 2\text{–}10\text{ km/s}$) via regenerative tether grapple onto small bodies/comets.*
15. **Duplay, E., Bao, Z., Rosero, S., Sinha, A., & Higgins, A. (2022).** "Design of a rapid transit to Mars mission using laser-thermal propulsion." *Acta Astronautica*, 192, 143–156. DOI: [https://doi.org/10.1016/j.actaastro.2021.11.032](https://doi.org/10.1016/j.actaastro.2021.11.032) (Preprint: [https://arxiv.org/abs/2112.13926](https://arxiv.org/abs/2112.13926)) — *High-temperature dissociated hydrogen thermal propulsion ($I_{\text{sp}} > 1000\text{ s}$) performance limits.*
