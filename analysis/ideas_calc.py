#!/usr/bin/env python3
"""First-order checks for docs/analyses/exotic-ideas.md (issue #35).
Run: python3 analysis/ideas_calc.py   (stdlib only, deterministic)."""
import math
c = 2.998e8; G0 = 9.80665
MU_SUN = 1.32712e20; AU = 1.496e11; R_SUN = 6.957e8
MU_MOON = 4.9049e12; R_MOON = 1.7374e6
MU_EARTH = 3.986e14; D_MOON = 3.844e8
V_TARGET = 3.0e5; M = 1.0
def kms(v): return v / 1e3

print("== Seeded 1: antimatter ==")
KE = 0.5 * M * V_TARGET**2
print(f"KE of 1 kg at 300 km/s = {KE:.3e} J")
for name, eta in [("beamed-core pion (eta~0.1 to jet KE)", 0.10),
                  ("solid-core thermal (eta~0.5 heat, but ve-limited)", 0.5)]:
    ma = KE / (eta * c**2)  # total annihilating mass (p + pbar); antimatter = half
    print(f"  {name}: antimatter needed ~{ma/2*1e6:.2f} mg")
ve_beam = 0.33 * c   # realistic beamed-core effective ve after nozzle losses (~1/3 c)
ve_therm = 10e3      # ~1000 s Isp solid-core (tungsten/graphite limit ~3000 K)
print(f"  beamed-core MR for 300 km/s: {math.exp(V_TARGET/ve_beam):.6f}")
print(f"  thermal MR for 300 km/s: e^{V_TARGET/ve_therm:.0f} = {math.exp(V_TARGET/ve_therm):.2e}  -> no-go")
prod_ng_yr = 10.0    # CERN AD/ELENA order-of-magnitude, all antiprotons, ng/yr
ma_mg = KE / (0.10 * c**2) / 2 * 1e6
print(f"  production at {prod_ng_yr} ng/yr: {ma_mg*1e6/prod_ng_yr:.2e} years")
print("  storage record: ~1e3 trapped anti-H atoms / ~1e5 pbar months (Penning) -> ~1e-19 kg. Gap ~1e13.")
cost_per_g = 6.25e13  # NASA-cited $62.5 T/g
print(f"  cost at $62.5T/g: ${ma_mg/1e3*cost_per_g:.2e}")

print("\n== Seeded 2: lunar centrifuge ==")
vesc_m = math.sqrt(2 * MU_MOON / R_MOON)
print(f"lunar surface escape = {kms(vesc_m):.3f} km/s")
SF = 1.5
mats = {"CFRP T1100 (6.6 GPa fiber, ~3.5 GPa laminate)": (3.5e9, 1600),
        "Zylon PBO (5.8 GPa)": (5.8e9, 1560),
        "CNT yarn, near-term (~10 GPa)": (10e9, 1300),
        "CNT ideal bundle (~40 GPa)": (40e9, 1300)}
def vtip(s, rho, taper):  # uniform-stress tapered arm: A0/At = exp(rho v^2/(2 s))
    return math.sqrt(2 * (s / SF) / rho * math.log(taper))
def vtip_const(s, rho): return math.sqrt(2 * (s / SF) / rho)  # constant section (incl. tip mass ~0)
v_e_moon_orbit = math.sqrt(2 * MU_EARTH / D_MOON); v_moon = math.sqrt(MU_EARTH / D_MOON)
rows = []
for n, (s, rho) in mats.items():
    for taper in (None, 10, 100):
        v = vtip_const(s, rho) if taper is None else vtip(s, rho, taper)
        vinf_m = math.sqrt(max(v**2 - vesc_m**2, 0))
        vrel_e = vinf_m + v_moon  # prograde release
        vinf_e = math.sqrt(max(vrel_e**2 - v_e_moon_orbit**2, 0))
        rows.append((n, taper, v, vinf_m, vinf_e))
        print(f"  {n:46s} taper={str(taper):>4s} v_tip={kms(v):5.2f}  v_inf(Moon)={kms(vinf_m):5.2f}  v_inf(Earth)={kms(vinf_e):5.2f} km/s")
print(f"  Earth escape from lunar distance {kms(v_e_moon_orbit):.2f}, Moon orbital {kms(v_moon):.2f} km/s")
for R in (0.05e3, 1e3, 10e3):
    for v in (2.5e3, 4e3, 8e3):
        print(f"  g-load R={R/1e3:5.2f} km v={kms(v):.1f} km/s: {v**2/R/G0:,.0f} g")
# value after a solar Oberth: centrifuge replaces part of the 1 AU -> perihelion dive dv
def oberth_vinf(rp_rsun, dv):
    rp = rp_rsun * R_SUN; ra = AU
    vp = math.sqrt(2 * MU_SUN * ra / (rp * (rp + ra)))
    return math.sqrt((vp + dv)**2 - 2 * MU_SUN / rp)
v_circ = math.sqrt(MU_SUN / AU)
va = math.sqrt(2 * MU_SUN * 4 * R_SUN / (AU * (AU + 4 * R_SUN)))
print(f"  dive from 1 AU to 4 Rsun requires shedding {kms(v_circ-va):.1f} km/s heliocentric")
for vinf_e in (2e3, 5e3):
    saved = math.exp(vinf_e / 4.4e3)
    print(f"  centrifuge giving v_inf(Earth)={kms(vinf_e):.0f} km/s saves chem MR x{saved:.2f} (Isp 450 s) on the dive leg;"
          f" the v_inf itself is erased by the dive -> leftover v_inf contribution ~0; Oberth 4 Rsun +5 km/s burn -> {kms(oberth_vinf(4,5e3)):.0f} km/s")
# HTS / lunar night
print("  lunar night ~14.8 d at ~100 K: radiative sink sigma*T^4 at 300 K rotor vs 100K sky: "
      f"{5.67e-8*(300**4-3**4):.0f} W/m^2; HTS REBCO operates at 20-77 K -> needs cryocooler or shadowed PSR (~40 K).")
E_spin = 0.5 * 1.0 * 4e3**2  # per kg payload
print(f"  energy per 1 kg at 4 km/s: {E_spin/3.6e6:.2f} kWh (power is trivial; strength is the limit)")

print("\n== Codex: Chirped Pellet Slipstream ==")
def chirped_pellet_stream(pellet_mass_kg, pellet_count, relative_velocity_km_s,
                         momentum_efficiency, probe_mass_kg):
    """Ideal reflection at fixed relative speed, with constant probe mass.

    Concept F's speed budget starts at escape speed at 5 AU and debits an
    upper bound on gravity loss over 30 days at that radius. Collapse this
    to an equivalent prograde impulse at 5 AU; no powered-leg propagation.
    Launch KE uses the original midpoint sum over probe speeds 0..delta-v,
    excluding initial heliocentric motion and launcher/ionisation losses.
    """
    mass = pellet_mass_kg * pellet_count
    w = relative_velocity_km_s * 1e3
    dv = 2 * momentum_efficiency * w * mass / probe_mass_kg
    r = 5 * AU
    vesc = math.sqrt(2 * MU_SUN / r)
    gravity_loss = MU_SUN * 30 * 86400 / r**2
    energy = sum(0.5 * pellet_mass_kg * (w + (i + 0.5) / pellet_count * dv)**2
                 for i in range(pellet_count))
    return {"deltaV_km_s": kms(dv), "totalPelletMass_kg": mass,
            "launchEnergy_J": energy, "escapeSpeed_km_s": kms(vesc),
            "gravityLoss_km_s": kms(gravity_loss),
            "initialSpeed_km_s": kms(vesc - gravity_loss),
            "vInf_km_s": kms(math.sqrt(max(0, (vesc + dv - gravity_loss)**2 - vesc**2)))}

pellets = chirped_pellet_stream(0.000375, 10000, 100, 0.8, 2)
dv = pellets['deltaV_km_s'] * 1e3
r5 = 5 * AU; vesc5 = pellets['escapeSpeed_km_s'] * 1e3
dg = pellets['gravityLoss_km_s'] * 1e3; vinf = pellets['vInf_km_s'] * 1e3
print(f"  dv={kms(dv):.1f}  vesc(5AU)={kms(vesc5):.2f}  gravity loss<={kms(dg):.3f}  v_inf={kms(vinf):.1f} km/s (agent 317.7)")
# pellet KE: each pellet launched at v_probe+w; integrate over probe speed 0..300 km/s
E = pellets['launchEnergy_J']
print(f"  pellet launch KE ~{E/1e9:.0f} GJ (agent ~150)")

print("\n== Codex: Solar-Wind Bank Shot ==")
U, vi, Lam, th = 400e3, 30e3, 10.0, math.pi / 3
wf = (U - vi) * math.exp(-th / Lam)
vf = math.sqrt(U**2 + wf**2 - 2 * U * wf * math.cos(th))
print(f"  w_f={kms(wf):.2f} v_f={kms(vf):.2f} v_inf={kms(math.sqrt(vf**2 - vesc5**2)):.1f} km/s (agent 370.7)")
A = 2 * 1 / (0.2e6 * 1.6726e-27 * (U - vi)**2)
print(f"  A_eff={A:.2e} m^2, radius {math.sqrt(A/math.pi)/1e3:.0f} km (agent 4.4e10, 118 km)")
print("  note: |v_f|>U is allowed (wind-frame speed is conserved minus drag, frame shift adds U); the hard part is L/D=10 over a ~1e10 m^2 plasma region")

def peri(rp_rsun, vp_minus, dv, beta=0.0):
    ve = math.sqrt(2 * MU_SUN / (rp_rsun * R_SUN))
    vp = vp_minus + dv
    return math.sqrt(vp**2 - (1 - beta) * ve**2), ve
print("\n== Antigravity: Jovian EDT + dusty-plasma FFRE perihelion burn ==")
dv = 3000e3 * math.log(2.05 / 2.0)
v_ag, ve3 = peri(3, math.sqrt((356.61e3)**2 + 50e3**2), dv)
v_fix, _ = peri(3, 356.13e3, dv)
print(f"  vesc(3Rsun)={kms(ve3):.2f}  dv={kms(dv):.2f}  agent case (v_inf_in=50) {kms(v_ag):.1f} (agent 247.7)")
print(f"  physical case: a Jupiter assist cannot give a hyperbolic INBOUND leg; bound v_p-=356.13 -> v_inf {kms(v_fix):.1f} km/s (-3%)")
print("\n== Antigravity: coronal solar-pumped laser + ablation kick ==")
dv = 49.05e3 * math.log(4.5)
v1, _ = peri(3, 356.13e3, dv); v2, _ = peri(3, 356.13e3, dv, beta=0.25)
print(f"  dv={kms(dv):.2f} v_inf={kms(v1):.1f} (agent 240.1); +beta 0.25 sail {kms(v2):.1f} (agent 299.1)")
print(f"  jet power {0.5*(3.5/120)*49.05e3**2/1e6:.1f} MW (agent 35.1)")
L, lam, d = 0.036 * AU, 1.064e-6, 2.0
print(f"  diffraction: transmitter aperture for 2 m spot at {L/1e9:.1f} Gm = 2.44*lam*L/d = {2.44*lam*L/d/1e3:.1f} km  <- unstated showstopper")
print("\n== Antigravity: MagLIF micro-pulse Orion-Oberth ==")
E_full = 2e-6 * 3.38e14  # 2 mg D-T at 17.6 MeV per 5 amu
E = 0.02 * E_full; E_alpha = 0.2 * E
print(f"  2% burn of 2 mg D-T = {E/1e6:.1f} MJ total, alpha share {E_alpha/1e6:.1f} MJ (agent used 13.5 MJ as charged)")
ve_agent_formula = math.sqrt(2 * 0.5 * 1.35e7 / 0.15)
ve_alpha = math.sqrt(2 * 0.5 * E_alpha / 0.15)
print(f"  agent's own formula gives v_e = {kms(ve_agent_formula):.1f} km/s, NOT 300 (x{300/kms(ve_agent_formula):.0f} error); alpha-only {kms(ve_alpha):.1f} km/s")
for ve in (85e3, ve_agent_formula, ve_alpha):
    dv = ve * math.log(4.0); v, _ = peri(3, 356.13e3, dv)
    print(f"   v_e={kms(ve):5.1f} -> dv={kms(dv):6.2f} v_inf={kms(v):6.1f} km/s")

print("\n== Claude: photon-recycling cavity catapult ==")
def laser_cavity_boost(power_MW, duration_s, recycling_factor, probe_mass_kg):
    """Ideal constant-power shot; SI internally, matching the Concept D engine.

    Uses this analysis's rounded c, AU and solar mu. Neglects movement during
    the shot, optical losses and Earth/Moon escape, as in the original check.
    """
    force = 2 * power_MW * 1e6 * recycling_factor / c
    acceleration = force / probe_mass_kg
    delta_v = acceleration * duration_s
    v_earth = math.sqrt(MU_SUN / AU)
    return {"deltaV_km_s": kms(delta_v),
            "acceleration_m_s2": acceleration,
            "inputEnergy_J": power_MW * 1e6 * duration_s,
            "vInf_km_s": kms(math.sqrt((delta_v + v_earth)**2 - 2 * MU_SUN / AU))}

m, L, vL, N = 2.0, 1e8, 2.8e5, 300
a = vL**2 / (2 * L); t = vL / a; F = m * a; Pc = F * c / 2; Pin = Pc / N
print(f"  a={a:.0f} m/s^2 ({a/G0:.0f} g) t={t:.0f} s F={F:.0f} N P_circ={Pc/1e9:.0f} GW P_in={Pin/1e6:.0f} MW E={Pin*t:.2e} J (agent 392,714,784,118 GW,390 MW,2.8e11)")
print(f"  Doppler cap N<=c/2v={c/(2*vL):.0f}; waist w={math.sqrt(1.064e-6*L/math.pi):.2f} m (agent 5.8)")
v_e1 = math.sqrt(2 * MU_SUN / AU); v_earth = math.sqrt(MU_SUN / AU)
cavity = laser_cavity_boost(Pin / 1e6, t, N, m)
print(f"  v_inf={cavity['vInf_km_s']:.1f} km/s (agent 307)")
print("\n== Claude: Po-210 direct-charge ion drive ==")
def po210_ion_drive(isp_s, power_W, half_life_days, conversion_efficiency,
                   thruster_efficiency, wet_mass_kg, dry_mass_kg):
    """All future exponential decay energy, at constant exhaust speed.

    Cap expelled propellant by both jet energy and available wet-minus-dry
    mass. For Concept E's vInf, apply the equivalent impulse radially outward
    from a circular 1 AU solar orbit (no finite-thrust propagation).
    """
    tau = half_life_days * 86400 / math.log(2)
    jet_power = power_W * conversion_efficiency * thruster_efficiency
    energy = jet_power * tau
    ve = isp_s * G0
    propellant = min(wet_mass_kg - dry_mass_kg, 2 * energy / ve**2)
    final_mass = max(dry_mass_kg, wet_mass_kg - propellant)
    dv = ve * math.log(wet_mass_kg / final_mass)
    return {"deltaV_km_s": kms(dv), "exhaustSpeed_km_s": kms(ve),
            "jetEnergy_J": energy, "initialJetPower_W": jet_power,
            "propellantUsed_kg": propellant, "finalMass_kg": final_mass,
            "initialAcceleration_m_s2": 2 * jet_power / ve / wet_mass_kg,
            "vInf_km_s": kms(math.sqrt(max(0, dv**2 - MU_SUN / AU)))}

P0 = 400 * 144; tau = 138.376 * 86400 / math.log(2); Pj = P0 * 0.3 * 0.7
isp = math.sqrt(2 * Pj * tau / 4) / G0
ion = po210_ion_drive(isp, P0, 138.376, 0.3, 0.7, 6.4, 2.4)
E = ion['jetEnergy_J']; ve = ion['exhaustSpeed_km_s'] * 1e3; dv = ion['deltaV_km_s'] * 1e3
V = 131.29 * 1.6605e-27 * ve**2 / (2 * 1.602e-19)
print(f"  P0={P0/1e3:.1f} kW E_jet={E:.2e} J v_e={kms(ve):.0f} dv={kms(dv):.0f} km/s V={V/1e3:.0f} kV a0={2*Pj/ve/6.4:.4f} (agent 57.6,2.09e11,323,317,71,0.0117)")
print(f"  Concept E radial equivalent impulse at 1 AU: v_inf={ion['vInf_km_s']:.3f} km/s; Isp={isp:.6f} s")
print("\n== Antigravity lunar riffs ==")
for nm, s, rho in [("anhydrous lunar glass", 7.5e9, 2700), ("S-2 glass", 3.0e9, 2490), ("T1000G", 3.8e9, 1800)]:
    print(f"  {nm}: v_tip={kms(math.sqrt(2*1.6*s/rho)):.2f} km/s")
vinfM = math.sqrt(3.2**2 - 2.376**2); vi = vinfM - 1.022
vp = math.sqrt(vi**2 + 2 * 398600 * (1/6678 - 1/384400)); vesc_p = math.sqrt(2 * 398600 / 6678)
vinf_dive = math.sqrt((vp + 6)**2 - vesc_p**2)
vinf_direct_M = math.sqrt(9.2**2 - 2.376**2); vinf_direct_E = math.sqrt((vinf_direct_M + 1.022)**2 - 1.44**2)
print(f"  perigee dive: v_p={vp:.2f} v_inf_E={vinf_dive:.2f}; fair direct baseline (prograde, incl. Moon motion, Earth escape) {vinf_direct_E:.2f} -> gain {vinf_dive-vinf_direct_E:.2f} km/s (agent +3.93 vs v_inf_M 8.89: +{(3.93/(vinf_dive-vinf_direct_E)-1)*100:.0f}% off)")
print("\n== Hardened 1 kg probe: minimum rotor radius for g-limit ==")
for glim in (1e4, 2e4, 1e5):
    print("  " + "  ".join(f"{glim:,.0f} g @ {v/1e3:.1f} km/s: R>={v**2/(glim*G0):.0f} m" for v in (2.5e3, 4e3, 7e3)))
