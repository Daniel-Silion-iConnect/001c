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

5. **Momentum-Exchange Tether (Rotovator) Chain Contribution:**
   A single rotovator with tip speed $v_{\text{tip}}$ can impart up to $\Delta v_{\text{stage}} \le 2 v_{\text{tip}}$ (catch-and-release) or $\sim v_{\text{tip}}$ (single-pass grapple/toss), constrained by material characteristic velocity $v_c = \sqrt{2\sigma_{\text{tensile}} / \rho}$ [10, 11]. In the staged architecture model ([`DESIGN.md`](../../DESIGN.md)), $N_{\text{tether}}$ phased inner-system/outbound high-eccentricity tether stations provide cumulative velocity addition:
   $$v_{\infty,\text{total}} \approx v_{\infty,\text{SOM}} + \sum_{k=1}^{N_{\text{tether}}} \Delta v_{\text{tether},k} + \Delta v_{\text{hitchhike}}$$
   *(Note: Physical feasibility requires each outbound tether's heliocentric velocity plus tip vector at intercept radius $r_k$ to exceed the probe's local speed $v(r_k)$; see Section 5.3 for staging constraints.)*

---

## 2. Concept A: Chemical + Solar Oberth + Tether Chain

### 2.1 Architecture Overview
Refueled Starship-class chemical upper stage in LEO injects a multi-stage solid/cryogenic stack and thermal shield onto a high-$C_3$ trajectory to Jupiter. An unpowered retrograde Jupiter gravity assist (JGA) zeroes out perihelion angular momentum, dropping the stack to $r_p = 4\text{–}6\,R_\odot$. At perihelion, the probe executes a high-thrust chemical/solid Oberth burn, jettisons the charred thermal shield, and intercepts an outbound chain of 12–15 momentum-exchange rotovators.

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
| **Tether Chain Stations ($N_{\text{tether}}$)** | $12$ stations | $15$ stations | **Assumed** (001c architecture) | [`DESIGN.md`](../../DESIGN.md); Hoyt & Forward MXER [10] |
| **$\Delta v$ per Tether Encounter ($\Delta v_{\text{stage}}$)** | $3.0\text{ km/s}$ | $4.0\text{ km/s}$ | **Sourced** (Zylon/PBO vs. high-strength fiber limit) | Hoyt & Forward ($v_{\text{tip}} \sim 1.5\text{–}2.5\text{ km/s}$) [10, 11] |
| **Cumulative Tether $\Delta v_{\text{tether}}$** | $+36.0\text{ km/s}$ | $+60.0\text{ km/s}$ | **Assumed** (phased chain total) | [`TRAJECTORY_IDEAS.md`](../TRAJECTORY_IDEAS.md) ($+30\text{–}60\text{ km/s}$) |
| **Final Asymptotic Speed ($v_\infty$)** | **$112.42\text{ km/s}$** | **$158.90\text{ km/s}$** | **Derived** | Matches [`DESIGN.md`](../../DESIGN.md) $100\text{–}200\text{ km/s}$ ceiling |
| **Fraction of $c$ ($v_\infty / c$)** | **$3.75 \times 10^{-4}\,c$** | **$5.30 \times 10^{-4}\,c$** | **Derived** | $23.72\text{ AU/yr}$ (Baseline) / $33.52\text{ AU/yr}$ (Aggressive) |

### 2.3 Back-of-Envelope Calculation (Concept A)
- **Baseline ($r_p = 6.0\,R_\odot$, $\Delta v_{\text{burn}} = 12.0\text{ km/s}$, $\Delta v_{\text{tether}} = 36.0\text{ km/s}$):**
  $$v_{\text{esc}}(6\,R_\odot) = \frac{617.675}{\sqrt{6}} = 252.16\text{ km/s}, \quad v_p^- = \sqrt{252.16^2 - \frac{1.32712 \times 10^{11}}{2.616\text{ AU}}} = 251.49\text{ km/s}$$
  $$v_p^+ = 251.49 + 12.0 = 263.49\text{ km/s} \implies v_{\infty,\text{SOM}} = \sqrt{263.49^2 - 252.16^2} = 76.42\text{ km/s}$$
  $$v_{\infty,\text{total}} = 76.42 + 12 \times 3.0 = \mathbf{112.42\text{ km/s}} \quad (\mathbf{0.375 \times 10^{-3}\,c},\; 23.72\text{ AU/yr})$$
- **Aggressive ($r_p = 4.0\,R_\odot$, $\Delta v_{\text{burn}} = 16.0\text{ km/s}$, $\Delta v_{\text{tether}} = 60.0\text{ km/s}$):**
  $$v_{\text{esc}}(4\,R_\odot) = 308.84\text{ km/s}, \quad v_p^- = 308.29\text{ km/s}, \quad v_p^+ = 308.29 + 16.0 = 324.29\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{324.29^2 - 308.84^2} = 98.90\text{ km/s} \implies v_{\infty,\text{total}} = 98.90 + 60.0 = \mathbf{158.90\text{ km/s}} \quad (\mathbf{0.530 \times 10^{-3}\,c},\; 33.52\text{ AU/yr})$$

---

## 3. Concept B: Sundiver Hybrid (Solar Sail + Chemical Oberth)

### 3.1 Architecture Overview
Eliminates external tether infrastructure in favor of a hybrid vehicle combining a compact solid/chemical kick stage at perihelion with an ultra-light refractory solar sail deployed immediately at/after perihelion ($r_p = 5\text{–}10\,R_\odot$). The chemical burn supplies an immediate impulse deep in the gravity well, while the high-lightness-number ($\beta = 0.25\text{–}0.50$) solar sail provides continuous radial acceleration from $r_p$ outward.

### 3.2 Parameter Table (Concept B)

| Parameter | Baseline Value | Aggressive Value | Status: Sourced vs. Assumed | Cited Source / Basis |
| :--- | :---: | :---: | :--- | :--- |
| **Launch / Earth Departure $C_3$** | $95\text{ km}^2/\text{s}^2$ | $125\text{ km}^2/\text{s}^2$ | **Sourced** | Falcon Heavy / Starship direct to Jupiter [4, 7] |
| **Gravity Assist Body** | Jupiter ($5.204\text{ AU}$) | Jupiter ($5.204\text{ AU}$) | **Sourced** | KISS Sundiver / Turyshev et al. [6, 7] |
| **Perihelion Distance ($r_p$)** | $10.0\,R_\odot$ ($0.0465\text{ AU}$) | $5.0\,R_\odot$ ($0.0233\text{ AU}$) | **Sourced** ($10\,R_\odot \approx$ PSP; $5\,R_\odot$ advanced sail) | Parker Solar Probe ($9.86\,R_\odot$) [3]; Davoyan/Turyshev ($5\text{–}20\,R_\odot$) [6, 8, 9] |
| **Effective Sail Areal Density ($\sigma_{\text{eff}}$)** | $6.12\text{ g/m}^2$ | $3.06\text{ g/m}^2$ | **Sourced** (graphene/aerogel/refractory films) | Turyshev et al. (2020/2023) [6, 7]; Davoyan et al. (2021) [9] |
| **Sail Lightness Number ($\beta$)** | $0.25$ | $0.50$ | **Sourced** ($\beta = 1.53\text{ g/m}^2 / \sigma_{\text{eff}}$) | KISS Sundiver studies ($\beta \sim 0.15\text{–}0.60$) [6, 7, 8] |
| **Sail Area ($A$) for $1.0\text{ kg}$ Probe** | $\sim 330\text{ m}^2$ ($R \approx 10.2\text{ m}$) | $\sim 650\text{ m}^2$ ($R \approx 14.4\text{ m}$) | **Derived** (includes sail mass fraction) | Assuming total sailcraft mass $m_{\text{tot}} \approx 2.0\text{ kg}$ ($1\text{ kg}$ payload + $1\text{ kg}$ sail) |
| **Perihelion Chemical Burn ($\Delta v_{\text{burn}}$)** | $6.0\text{ km/s}$ | $8.0\text{ km/s}$ | **Assumed** (hybrid kick stage) | Jettisoned solid/liquid micro-thruster prior to sail unfurling |
| **Pure Sail Escape Speed ($\Delta v_{\text{burn}} = 0$)** | $97.66\text{ km/s}$ | $195.33\text{ km/s}$ | **Derived** ($v_\infty = \sqrt{\beta}\,v_{\text{esc}}(r_p)$) | Matches Turyshev/Davoyan extreme sundiver ($20\text{–}40\text{ AU/yr}$) [7, 9] |
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

## 4. Concept C: Infrastructure-Heavy (Pre-Deployed Tether Chain + STP/NTP Oberth)

### 4.1 Architecture Overview
Concept C is the full-stack architecture designed to reach the [`GOAL.md`](../../GOAL.md) target of **$0.001c$ ($\approx 300\text{ km/s}$)**. It combines:
1. **Inbound Tether Network + Jupiter Assist:** Pre-deployed inner/outer solar system rotovators plus a retrograde Jupiter assist inject the upper stage onto a hyperbolic solar plunge ($v_{\infty,\text{in}} = 45\text{–}70\text{ km/s}$).
2. **Transpiration-Cooled Solar-Thermal Propulsion (STP) Oberth Maneuver at $r_p = 2.8\text{–}3.5\,R_\odot$:** Using liquid hydrogen ($H_2$) routed through a regenerative/transpiration-cooled refractory heat shield that doubles as a solar-thermal heat exchanger ($I_{\text{sp}} = 1000\text{–}1200\text{ s}$, per Lyman et al. [12] and Benkoski NIAC [13]), achieving $\Delta v_{\text{STP}} = 24\text{–}36\text{ km/s}$ at extreme perihelion.
3. **Outbound CNT Tether Highway + Optional ISO Hitchhike:** 15–22 high-tip-speed carbon-nanotube (CNT) rotovators stationed on high-energy elliptical orbits, plus an optional $+8\text{ km/s}$ grapple/hitchhike off a fast asteroid or interstellar object (ISO) [14].

### 4.2 Parameter Table (Concept C)

| Parameter | Baseline Value | Aggressive Value | $0.001c$ Threshold Value | Status: Sourced vs. Assumed | Cited Source / Basis |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Inbound Hyperbolic Excess ($v_{\infty,\text{in}}$)** | $45.0\text{ km/s}$ | $60.0\text{ km/s}$ | $70.0\text{ km/s}$ | **Assumed** (inbound tether highway + JGA) | Pre-Oberth staging via 8–12 inner-system rotovators [10] |
| **Perihelion Distance ($r_p$)** | $3.5\,R_\odot$ ($0.0163\text{ AU}$) | $3.0\,R_\odot$ ($0.0140\text{ AU}$) | $2.8\,R_\odot$ ($0.0130\text{ AU}$) | **Sourced** (extreme SOM studies) | APL ISP ($3\,R_\odot$) [1, 2]; Lyman STP ($2.5\text{–}4\,R_\odot$) [12]; Benkoski [13] |
| **Local Escape Speed ($v_{\text{esc}}(r_p)$)** | $330.16\text{ km/s}$ | $356.61\text{ km/s}$ | $369.13\text{ km/s}$ | **Derived** | Equation 1.1 |
| **Pre-Burn Perihelion Speed ($v_p^-$)** | $333.21\text{ km/s}$ | $361.63\text{ km/s}$ | $375.71\text{ km/s}$ | **Derived** | $v_p^- = \sqrt{v_{\text{esc}}(r_p)^2 + v_{\infty,\text{in}}^2}$ |
| **Propulsion Type & $I_{\text{sp}}$** | $H_2$ STP ($1000\text{ s}$) | $H_2$ STP ($1150\text{ s}$) | Adv. $H_2$/Dissoc. STP ($1250\text{ s}$) | **Sourced** ($H_2$ STP at $>2800\text{ K}$) | Lyman et al. (2001) [12]; Benkoski (2019) [13]; Duplay [15] |
| **Perihelion STP Burn ($\Delta v_{\text{STP}}$)** | $24.0\text{ km/s}$ | $32.0\text{ km/s}$ | $36.0\text{ km/s}$ | **Assumed** (2-stage STP, $MR \approx 11.5\text{–}19$) | Rocket equation with $v_e = 9.8\text{–}12.3\text{ km/s}$ |
| **Post-Oberth Escape Speed ($v_{\infty,\text{SOM}}$)** | $136.36\text{ km/s}$ | $166.64\text{ km/s}$ | $182.34\text{ km/s}$ | **Derived** (vis-viva + Oberth) | Equation 1.3 |
| **Outbound Tether Stations ($N_{\text{tether}}$)** | $15$ stations | $18$ stations | $22$ stations | **Assumed** (infrastructure-heavy) | [`DESIGN.md`](../../DESIGN.md) ("10–20+ momentum-exchange tethers") |
| **$\Delta v$ per CNT Tether ($\Delta v_{\text{stage}}$)** | $4.0\text{ km/s}$ | $5.0\text{ km/s}$ | $5.0\text{ km/s}$ | **Sourced** (CNT theoretical/lab capability) | [`SPECS.md`](../../SPECS.md); Bogar et al. / Hoyt CNT tethers [10, 11] |
| **Cumulative Outbound Tether $\Delta v_{\text{tether}}$** | $+60.0\text{ km/s}$ | $+90.0\text{ km/s}$ | $+110.0\text{ km/s}$ | **Assumed** (additive model) | [`DESIGN.md`](../../DESIGN.md) |
| **ISO / Asteroid Hitchhike ($\Delta v_{\text{hitch}}$)** | $0.0\text{ km/s}$ | $0.0\text{ km/s}$ | $+8.0\text{ km/s}$ | **Sourced** (NIAC Comet Hitchhiker) | Ono et al. (2016) [14]; [`SPECS.md`](../../SPECS.md) ($2\text{–}10\text{ km/s}$) |
| **Final Asymptotic Speed ($v_\infty$)** | **$196.36\text{ km/s}$** | **$256.64\text{ km/s}$** | **$300.34\text{ km/s}$** | **Derived** | Achieves $\ge 299.8\text{ km/s}$ ($0.001c$) in Threshold case |
| **Fraction of $c$ ($v_\infty / c$)** | **$6.55 \times 10^{-4}\,c$** | **$8.56 \times 10^{-4}\,c$** | **$1.002 \times 10^{-3}\,c$** | **Derived** | $41.42$, $54.14$, and $63.36\text{ AU/yr}$ respectively |

### 4.3 Back-of-Envelope Calculation (Concept C)
- **Baseline ($r_p = 3.5\,R_\odot$, $v_{\infty,\text{in}} = 45\text{ km/s}$, $\Delta v_{\text{STP}} = 24\text{ km/s}$, $\Delta v_{\text{tether}} = 60\text{ km/s}$):**
  $$v_{\text{esc}}(3.5\,R_\odot) = 330.16\text{ km/s}, \quad v_p^- = \sqrt{330.16^2 + 45.0^2} = 333.21\text{ km/s}, \quad v_p^+ = 333.21 + 24.0 = 357.21\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{357.21^2 - 330.16^2} = 136.36\text{ km/s} \implies v_{\infty,\text{total}} = 136.36 + 60.0 = \mathbf{196.36\text{ km/s}} \quad (\mathbf{0.655 \times 10^{-3}\,c})$$
- **Aggressive ($r_p = 3.0\,R_\odot$, $v_{\infty,\text{in}} = 60\text{ km/s}$, $\Delta v_{\text{STP}} = 32\text{ km/s}$, $\Delta v_{\text{tether}} = 90\text{ km/s}$):**
  $$v_{\text{esc}}(3.0\,R_\odot) = 356.61\text{ km/s}, \quad v_p^- = \sqrt{356.61^2 + 60.0^2} = 361.63\text{ km/s}, \quad v_p^+ = 361.63 + 32.0 = 393.63\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{393.63^2 - 356.61^2} = 166.64\text{ km/s} \implies v_{\infty,\text{total}} = 166.64 + 90.0 = \mathbf{256.64\text{ km/s}} \quad (\mathbf{0.856 \times 10^{-3}\,c})$$
- **$0.001c$ Threshold ($r_p = 2.8\,R_\odot$, $v_{\infty,\text{in}} = 70\text{ km/s}$, $\Delta v_{\text{STP}} = 36\text{ km/s}$, $\Delta v_{\text{tether}} = 110\text{ km/s}$, $\Delta v_{\text{hitch}} = 8\text{ km/s}$):**
  $$v_{\text{esc}}(2.8\,R_\odot) = 369.13\text{ km/s}, \quad v_p^- = \sqrt{369.13^2 + 70.0^2} = 375.71\text{ km/s}, \quad v_p^+ = 375.71 + 36.0 = 411.71\text{ km/s}$$
  $$v_{\infty,\text{SOM}} = \sqrt{411.71^2 - 369.13^2} = 182.34\text{ km/s} \implies v_{\infty,\text{total}} = 182.34 + 110.0 + 8.0 = \mathbf{300.34\text{ km/s}} \quad (\mathbf{1.002 \times 10^{-3}\,c})$$

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

### 5.3 Heliocentric Tether Staging Constraint (Important Engine Modeling Note)
A bound heliocentric tether station at radius $r$ has center-of-mass speed $v_{\text{cm}}(r) < v_{\text{esc}}(r)$. Once the escaping probe exceeds local solar escape velocity ($v(r) > v_{\text{esc}}(r)$), a bound tether at radius $r$ can only add forward momentum if $v_{\text{cm}}(r) + v_{\text{tip}} > v(r)$. Consequently, in full 2-body/patched-conic simulations:
1. Most tether stages must either act **inbound** (accelerating the upper stage prior to perihelion to increase $v_{\infty,\text{in}}$) or be placed at **deep inner-system perihelia** ($r \sim 0.03\text{–}0.15\text{ AU}$ where $v_{\text{esc}}(r) \approx 110\text{–}245\text{ km/s}$).
2. The linear additive formula ($v_{\infty,\text{total}} = v_{\infty,\text{SOM}} + \Delta v_{\text{tether}}$) represents an **upper-bound kinematic benchmark** corresponding to the current event-accumulation model in [`prototype/spacekit/engine.js`](../../prototype/spacekit/engine.js).

---

## 6. Consolidated Regression Table

The table below provides both the **Physical Vis-Viva / Oberth Benchmark** (for the upcoming physics engine upgrade) and the **Current `engine.js` Placeholder Output** (using `mult = max(1, 2 / sqrt(perihelion_AU))` on `oberthBurn` plus linear addition of `burn`, `tetherRelease`, and `hitchhike` events) so regression tests can verify both implementations.

| Scenario ID | Concept & Variant | $r_p$ ($R_\odot$ / $\text{AU}$) | Perihelion $\Delta v_{\text{burn}}$ ($\text{km/s}$) | Sail $\beta$ | Inbound / Outbound Tether + Hitch $\Delta v$ ($\text{km/s}$) | Physical $v_{\infty,\text{SOM}}$ ($\text{km/s}$) | Physical Final $v_\infty$ ($\text{km/s}$) | Physical Fraction of $c$ ($v_\infty / c$) | Cruise Speed ($\text{AU/yr}$) | Current `engine.js` Placeholder $v_\infty$ ($\text{km/s}$)* |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`concept-a-baseline`** | **A:** Chem + SOM + Tether (Baseline) | $6.0\,R_\odot$ ($0.0279\text{ AU}$) | $12.0$ | $0.00$ | $0\text{ in} + 36.0\text{ out}$ | $76.42$ | **$112.42$** | **$3.75 \times 10^{-4}\,c$** | $23.72$ | $179.68$ |
| **`concept-a-aggressive`** | **A:** Chem + SOM + Tether (Aggressive) | $4.0\,R_\odot$ ($0.0186\text{ AU}$) | $16.0$ | $0.00$ | $0\text{ in} + 60.0\text{ out}$ | $98.90$ | **$158.90$** | **$5.30 \times 10^{-4}\,c$** | $33.52$ | $294.62$ |
| **`concept-b-baseline`** | **B:** Sundiver Hybrid (Baseline) | $10.0\,R_\odot$ ($0.0465\text{ AU}$) | $6.0$ | $0.25$ | $0$ | $48.20$ | **$107.56$** | **$3.59 \times 10^{-4}\,c$** | $22.69$ | $55.65$ |
| **`concept-b-aggressive`** | **B:** Sundiver Hybrid (Aggressive) | $5.0\,R_\odot$ ($0.0233\text{ AU}$) | $8.0$ | $0.50$ | $0$ | $65.49$ | **$205.64$** | **$6.86 \times 10^{-4}\,c$** | $43.38$ | $104.93$ |
| **`concept-c-baseline`** | **C:** Infra-Heavy STP + Tether (Baseline) | $3.5\,R_\odot$ ($0.0163\text{ AU}$) | $24.0$ | $0.00$ | $45.0\text{ in} + 60.0\text{ out}$ | $136.36$ | **$196.36$** | **$6.55 \times 10^{-4}\,c$** | $41.42$ | $481.23$ |
| **`concept-c-aggressive`** | **C:** Infra-Heavy STP + Tether (Aggressive) | $3.0\,R_\odot$ ($0.0140\text{ AU}$) | $32.0$ | $0.00$ | $60.0\text{ in} + 90.0\text{ out}$ | $166.64$ | **$256.64$** | **$8.56 \times 10^{-4}\,c$** | $54.14$ | $691.84$ |
| **`concept-c-001c`** | **C:** Infra-Heavy Full Stack ($0.001c$ Target) | $2.8\,R_\odot$ ($0.0130\text{ AU}$) | $36.0$ | $0.00$ | $70.0\text{ in} + 110.0\text{ out} + 8.0\text{ hitch}$ | $182.34$ | **$300.34$** | **$1.002 \times 10^{-3}\,c$** | $63.36$ | $818.96$ |

*\*Note on Current `engine.js` Placeholder Column: Computed directly from `applyEvents` in [`prototype/spacekit/engine.js`](../../prototype/spacekit/engine.js) using exact `perihelion_AU = r_p_Rsun * (695700 / 149597870.7)`, where `oberthBurn` multiplies `deltaV_km_s` by `2 / sqrt(perihelion_AU)` and adds all non-Oberth `deltaV_km_s` events linearly (ignoring solar sails).*

---

## 7. Cited Sources & References

1. **McNutt, R. L., Jr., et al. (2019).** "Near-Term Interstellar Probe: First Step." *Acta Astronautica*, 162, 284–299. [https://doi.org/10.1016/j.actaastro.2019.06.013](https://doi.org/10.1016/j.actaastro.2019.06.013) — *JHU/APL study detailing Jupiter gravity assist + Solar Oberth maneuvers at $3\text{–}6\,R_\odot$, heat-shield mass scaling, and launch $C_3$ requirements.*
2. **Brandt, P. C., et al. (2022).** "The Future of Interstellar Exploration: Interstellar Probe." *Johns Hopkins University Applied Physics Laboratory Concept Study Report for NASA*, 498 pp. [https://interstellarprobe.jhuapl.edu/](https://interstellarprobe.jhuapl.edu/) — *Comprehensive engineering assessment of passive carbon-carbon vs. tungsten/refractory heat shields near the Sun and high-energy upper stages.*
3. **Fox, N. J., Velli, M. C., Bale, S. D., et al. (2016).** "The Solar Probe Plus Mission: Humanity's First Visit to Our Star." *Space Science Reviews*, 204(1–4), 7–48. [https://doi.org/10.1007/s11214-015-0211-6](https://doi.org/10.1007/s11214-015-0211-6) — *Parker Solar Probe baseline perihelion ($9.86\,R_\odot = 0.0459\text{ AU}$) and Thermal Protection System (TPS) operating limits ($1370\,^\circ\text{C} / 1643\text{ K}$).*
4. **Hein, A. M., Perakis, N., Eubanks, T. M., Hibberd, A., et al. (2019).** "Project Lyra: Sending a Spacecraft to 1I/'Oumuamua (former A/2017 U1) in 10 to 25 Years." *Acta Astronautica*, 161, 552–561. [https://arxiv.org/abs/1711.03155](https://arxiv.org/abs/1711.03155) — *Establishes the Jupiter retrograde assist + Solar Oberth burn at $3\text{–}6\,R_\odot$ yielding $v_\infty \approx 55\text{–}75\text{ km/s}$ with solid chemical kick stages.*
5. **Hibberd, A., Hein, A. M., & Eubanks, T. M. (2020).** "Project Lyra: Catching 1I/'Oumuamua – Mission Opportunities After 2024." *Acta Astronautica*, 170, 136–144. [https://arxiv.org/abs/1902.04935](https://arxiv.org/abs/1902.04935) — *Refines thermal shield constraints at $6\,R_\odot$ vs. $10\,R_\odot$ and multi-stage chemical $\Delta v$ budgets.*
6. **Turyshev, S. G., Helvajian, H., Friedman, L. D., Garber, D., et al. (2020).** "Explore the Solar System and Beyond with a Sundiver Sailcraft." *arXiv preprint / NASA JPL & Aerospace Corp.* [https://arxiv.org/abs/2009.11457](https://arxiv.org/abs/2009.11457) — *KISS/JPL "Sundiver" solar sail architecture using smallsat modular vanes, perihelion $0.05\text{–}0.2\text{ AU}$, achieving $5\text{–}25+\text{ AU/yr}$.*
7. **Turyshev, S. G., Garber, D., Friedman, L. D., Hein, A. M., et al. (2023).** "Science and Technology of the Solar Gravitational Lens Mission." *Acta Astronautica*, 203, 356–369. [https://arxiv.org/abs/2204.04866](https://arxiv.org/abs/2204.04866) — *Details high-lightness-number ($\beta$) sundiver trajectories and smallsat architecture.*
8. **McInnes, C. R. (1999).** *Solar Sailing: Technology, Dynamics and Mission Applications.* Springer-Praxis. — *Derivation of exact radial sundiver energy equation $v_\infty = \sqrt{\beta}\,v_{\text{esc}}(r_p)$ and lightness number $\beta = 1.53\text{ g/m}^2 / \sigma$.*
9. **Davoyan, A. R., Munday, J. N., Tabiryan, N., Swartzlander, G. A., & Johnson, L. (2021).** "Photonic Materials for Interstellar Solar Sailing." *Optica*, 8(5), 722–734. [https://doi.org/10.1364/OPTICA.417007](https://doi.org/10.1364/OPTICA.417007) — *Analyzes extreme-perihelion ($\le 5\,R_\odot$) refractory dielectric/nitride solar sails reaching $v_\infty \approx 100\text{–}200\text{ km/s}$ ($20\text{–}40\text{ AU/yr}$).*
10. **Hoyt, R. P., & Forward, R. L. (2001).** "Cislunar Tether Transport System." *Journal of Spacecraft and Rockets*, 37(2), 177–186. [https://doi.org/10.2514/2.3564](https://doi.org/10.2514/2.3564) — *Foundational analysis of staged momentum-exchange rotovator networks, taper ratios, and characteristic velocities.*
11. **Bogar, T. J., Bangham, M. E., Forward, R. L., & Lewis, M. J. (1999).** *Hypersonic Airplane Space Tether Orbital Launch (HASTOL) System: Interim Study Results.* NASA/CR-2000-209844 — *Material trade studies comparing Spectra, Zylon (PBO), and Carbon Nanotubes (CNT) for high-tip-speed rotovators.*
12. **Lyman, R. W., Ewing, M. E., Krishnan, R., Lester, D. M., & McNutt, R. L., Jr. (2001).** "Solar Thermal Propulsion for an Interstellar Probe." *37th AIAA/ASME/SAE/ASEE Joint Propulsion Conference*, AIAA 2001-3377. [https://doi.org/10.2514/6.2001-3377](https://doi.org/10.2514/6.2001-3377) — *Models $H_2$ solar-thermal Oberth burns at $2.5\text{–}4\,R_\odot$ with $I_{\text{sp}} \approx 1000\text{–}1200\text{ s}$.*
13. **Benkoski, J. J. (2019).** *Combined Heat Shield and Solar Thermal Propulsion System for an Oberth Maneuver.* NASA Innovative Advanced Concepts (NIAC) Phase I Final Report, JHU/APL. [https://www.nasa.gov/general/combined-heat-shield-and-solar-thermal-propulsion-system-for-an-oberth-maneuver/](https://www.nasa.gov/general/combined-heat-shield-and-solar-thermal-propulsion-system-for-an-oberth-maneuver/) — *Transpiration-cooled $H_2$ refractory heat shield enabling deep perihelion ($\le 3\,R_\odot$) Oberth propulsion.*
14. **Ono, M., Quadrelli, M. B., Lantoine, G., et al. (2016).** "The Hitchhiker's Guide to the Solar System: A Tethered Orbit Insertion and Kinetic Energy Exchange Concept." *IEEE Aerospace Conference / NASA NIAC*. — *Establishes kinetic energy harvesting ($\Delta v \approx 2\text{–}10\text{ km/s}$) via regenerative tether grapple onto small bodies/comets.*
15. **Duplay, E., Bao, Z., Rosero, S., Sinha, A., & Higgins, A. (2022).** "Design of a Rapid Transit to Mars Mission Using Laser-Thermal Propulsion." *Acta Astronautica*, 192, 143–156. [https://arxiv.org/abs/2112.13926](https://arxiv.org/abs/2112.13926) — *High-temperature dissociated hydrogen thermal propulsion ($I_{\text{sp}} > 1000\text{ s}$) performance limits.*
