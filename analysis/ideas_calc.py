#!/usr/bin/env python3
"""First-order checks for the propulsion studies in docs/analyses/.
Run: python3 analysis/ideas_calc.py   (stdlib only, deterministic)."""
import math
import sys
import unittest
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

# Material inputs: NIST ASD 5.12 successive ground-state ionisation energies
# (eV), PDG atomic masses/densities, and NBS solid-H2 density. Source links,
# phase conventions and the deliberately assumed geometries are in the docs.
ELEMENTS = {
    "H": {"A": 1.00794, "rho": 0.08659, "ie": (13.5984346,)},
    "D": {"A": 2.014101778, "ie": (13.5984346,)},  # H IE approximation
    "Li": {"A": 6.94, "rho": 0.534, "ie": (5.391714996, 75.6400970, 122.45435913)},
    "C": {"A": 12.0107, "ie": (11.2602880, 24.383143, 47.88778,
                                       64.49352, 392.09056, 489.99320779)},
    "Ne": {"A": 20.1797, "rho": 1.444, "ie": (21.564541, 40.96297, 63.4233,
        97.1900, 126.247, 157.934, 207.271, 239.0970, 1195.8082, 1362.199256)},
    "Al": {"A": 26.9815385, "rho": 2.699, "ie": (5.985769, 18.82855, 28.447642,
        119.9924, 153.8252, 190.49, 241.76, 284.64, 330.21, 398.65, 442.005,
        2085.97693, 2304.140359)},
    "Fe": {"A": 55.845, "rho": 7.874, "ie": (7.9024681, 16.19921, 30.651,
        54.91, 75.00, 98.985, 124.9671, 151.060, 233.6, 262.10, 290.9, 330.8,
        361.0, 392.2, 456.2, 489.312, 1262.7, 1357.8, 1460, 1575.6, 1687.0,
        1798.4, 1950.4, 2045.759, 8828.1864, 9277.6886)},
}
E_CHARGE = 1.602176634e-19  # exact J/eV and C
N_AVOGADRO = 6.02214076e23  # exact mol^-1
PROTON_MASS_KG = 1.67262192595e-27  # CODATA 2022, NRL mu = ion/proton mass
ATOMIC_MASS_KG = 1e-3 / N_AVOGADRO  # sufficient at tabulated precision
SIGMA_SB = 5.670374419e-8
MU0 = 1.25663706212e-6
SOLAR_FLUX_W_M2 = 1361.0


def pellet_material_comparison(mass_kg=0.000375, relative_velocity_km_s=100,
                               field_T=0.01, cloud_radius_m=10,
                               temperature_eV=10, coulomb_log=10):
    """Atomic energy floors and illustrative plasma scales, not efficiencies.

    Single = one electron removed from EVERY separated atom (not one charge
    on a solid pellet or polymer repeat). Full = sum of all successive IEs.
    Neither includes atomisation, heating, radiation or coupling losses.
    Mixture collision rates are same-species Maxwellian estimates only;
    cross-species scattering, recombination and collective dynamics are absent.
    Cloud temperature is random thermal motion, not the directed 100 km/s.
    """
    for value in (mass_kg, relative_velocity_km_s, field_T, cloud_radius_m,
                  temperature_eV, coulomb_log):
        if not math.isfinite(value) or value <= 0:
            raise ValueError("material comparison inputs must be finite and positive")
    # PE density is the PDG reference grade; CD2 assumes unchanged repeat volume.
    ch2_mass = ELEMENTS['C']['A'] + 2 * ELEMENTS['H']['A']
    cd2_mass = ELEMENTS['C']['A'] + 2 * ELEMENTS['D']['A']
    materials = {
        'lithium': (ELEMENTS['Li']['rho'], {'Li': 1.0}),
        'aluminium': (ELEMENTS['Al']['rho'], {'Al': 1.0}),
        'polyethylene CH2': (0.890, {'C': ELEMENTS['C']['A'] / ch2_mass,
                                    'H': 2 * ELEMENTS['H']['A'] / ch2_mass}),
        'deuterated polyethylene CD2': (0.890 * cd2_mass / ch2_mass,
            {'C': ELEMENTS['C']['A'] / cd2_mass, 'D': 2 * ELEMENTS['D']['A'] / cd2_mass}),
        'coated iron': (1 / (0.95 / ELEMENTS['Fe']['rho'] + 0.05 / ELEMENTS['Al']['rho']),
                        {'Fe': 0.95, 'Al': 0.05}),
        'frozen hydrogen H2': (ELEMENTS['H']['rho'], {'H': 1.0}),
        'frozen neon': (ELEMENTS['Ne']['rho'], {'Ne': 1.0}),
    }
    w = relative_velocity_km_s * 1e3
    volume = 4 * math.pi * cloud_radius_m**3 / 3
    rows = {}
    for name, (density, fractions) in materials.items():
        diameter = (6 * mass_kg / (math.pi * density * 1000))**(1 / 3)
        components = {}
        single = full = 0.0
        for symbol, fraction in fractions.items():
            atom = ELEMENTS[symbol]
            ion_mass = atom['A'] * ATOMIC_MASS_KG
            count = mass_kg * fraction / ion_mass
            single += count * atom['ie'][0] * E_CHARGE
            full += count * sum(atom['ie']) * E_CHARGE
            density_cm3 = count / volume / 1e6
            # NRL formulary ion-ion thermal rate, Z=1, T_i in eV, n_i in cm^-3.
            rate = 4.80e-8 * density_cm3 * coulomb_log / (
                math.sqrt(ion_mass / PROTON_MASS_KG) * temperature_eV**1.5)
            thermal_speed = math.sqrt(2 * temperature_eV * E_CHARGE / ion_mass)
            components[symbol] = {
                'massFraction': fraction, 'atomCount': count,
                'singleIonisation_eV': atom['ie'][0], 'fullIonisation_eV': sum(atom['ie']),
                'massToChargeSingle_u_e': atom['A'],
                'massToChargeFull_u_e': atom['A'] / len(atom['ie']),
                'gyroradiusSingle_m': ion_mass * w / (E_CHARGE * field_T),
                'gyroradiusFull_m': ion_mass * w / (len(atom['ie']) * E_CHARGE * field_T),
                'directedEnergy_eV': 0.5 * ion_mass * w**2 / E_CHARGE,
                'ionDensity_cm3': density_cm3, 'selfCollisionRate_s1': rate,
                'thermalMeanFreePath_m': thermal_speed / rate,
            }
        row = {'density_g_cm3': density, 'diameter_mm': diameter * 1000,
               'singleIonisation_J': single, 'fullIonisation_J': full,
               'components': components}
        if name == 'coated iron':
            core_diameter = (6 * mass_kg * 0.95 / (math.pi * ELEMENTS['Fe']['rho'] * 1000))**(1 / 3)
            row['coatingThickness_um'] = (diameter - core_diameter) * 0.5e6
        rows[name] = row
    return rows


def pellet_launch_and_environment(mass_kg=0.000375, pellet_count=10000,
                                 relative_velocity_km_s=100,
                                 momentum_efficiency=0.8, probe_mass_kg=2):
    """Concept F's ideal frame plus explicitly chosen thermal/launcher examples.

    Photon energy assumes single-pass perfect reflection, m*c*v/2, to first
    order in v/c. It is not the pellet kinetic energy. Coilgun length assumes
    constant 10,000 g; no engineering performance is implied.
    """
    ref = chirped_pellet_stream(mass_kg, pellet_count, relative_velocity_km_s,
                               momentum_efficiency, probe_mass_kg)
    w = relative_velocity_km_s * 1e3
    dv = ref['deltaV_km_s'] * 1e3
    mass = ref['totalPelletMass_kg']
    # A sphere radiates over four times its projected absorbing area.
    temperatures = {str(r): (SOLAR_FLUX_W_M2 / (4 * SIGMA_SB * r**2))**0.25
                    for r in (1, 5)}
    # Illustrative dielectric launch sail: per-face emissivity 0.5,
    # absorptivity 1e-5 and incident intensity 1 GW/m^2, two radiating faces.
    sail_temperature = (1e-5 * 1e9 / (2 * 0.5 * SIGMA_SB))**0.25
    return {
        **ref, 'relativeKEPerPellet_J': 0.5 * mass_kg * w**2,
        'relativeKEStream_J': 0.5 * mass * w**2,
        'impulsePerPellet_N_s': 2 * momentum_efficiency * mass_kg * w,
        'launchSpeedRange_km_s': [kms(w), kms(w + dv)],
        'launchKEEndpoint_J': [0.5 * mass_kg * v**2 for v in (w, w + dv)],
        'singlePassPhotonEnergy_J': mass * c * (w + dv / 2) / 2,
        'singlePassPhotonEnergyPerPelletEndpoints_J': [mass_kg * c * v / 2 for v in (w, w + dv)],
        'coilgunLengthEndpoints_km': [v**2 / (2 * 1e4 * G0) / 1000 for v in (w, w + dv)],
        'greySphereTemperature_K': temperatures,
        'fiveAUFlux_W_m2': SOLAR_FLUX_W_M2 / 5**2,
        'illustrativeSailTemperature_K': sail_temperature,
        'tenMetreCloudRamPressure_Pa': mass_kg / (4 * math.pi * 10**3 / 3) * w**2,
        'tenMilliTeslaPressure_Pa': 0.01**2 / (2 * MU0),
        'tenMetreCloudCrossing_s': 2 * 10 / w,
        'phaseTemperatures_K': {'Li_melt': 453.6, 'Al_melt': 933.5,
            'Fe_melt': 1811, 'Fe_Curie': 1043, 'PE_equilibrium_melt': 414.6,
            'H2_triple': 13.8033, 'Ne_triple': 24.56},
    }


def pellet_arrival_budget(boost_days=30, pulse_s=10e-6,
                          electron_temperature_eV=10, ion_temperature_eV=10,
                          cloud_radius_m=10):
    """Issue #65: Al atomic floors, illustrative heat and expansion scales.

    Fixed Concept F pellet/stream inputs. Temperatures are independently
    assumed, not an ionisation-equilibrium or laser-ablation calculation.
    Thermal energy = 3/2 N e (Ti + z Te); atomisation uses NIST-JANAF
    Al(g) formation enthalpy at 298 K, 329.7 kJ/mol, as a rough phase cost.
    Sound speed uses isothermal electrons and 3-D adiabatic ions (gamma=5/3).
    R/cs assumes constant temperature; cooling/recombination are not evolved.
    Full stripping at 10 eV is NOT asserted to be a sustainable charge state.
    Source links and all engineering assumptions are in exotic-ideas.md.
    """
    for value in (boost_days, pulse_s, electron_temperature_eV,
                  ion_temperature_eV, cloud_radius_m):
        if not math.isfinite(value) or value <= 0:
            raise ValueError("arrival inputs must be finite and positive")
    mass = 0.000375
    count = 10000
    w = 100e3
    duration = boost_days * 86400
    interval = duration / count  # uniform-rate equivalent; no firing schedule
    if pulse_s >= interval:
        raise ValueError("arrival pulse must be shorter than the shot interval")
    al = pellet_material_comparison()['aluminium']
    atoms = al['components']['Al']['atomCount']
    ion_mass = ELEMENTS['Al']['A'] * ATOMIC_MASS_KG
    atomisation = mass / (ELEMENTS['Al']['A'] * 1e-3) * 329700
    sound = math.sqrt(E_CHARGE * (electron_temperature_eV +
                                 5 / 3 * ion_temperature_eV) / ion_mass)
    routes = {}
    for name, charge, threshold in (
            ('single', 1, al['singleIonisation_J']),
            ('full', 13, al['fullIonisation_J'])):
        thermal = 1.5 * atoms * E_CHARGE * (
            ion_temperature_eV + charge * electron_temperature_eV)
        deposited = threshold + atomisation + thermal
        routes[name] = {
            'atomicFloor_J': threshold, 'thermal_J': thermal,
            'illustrativeDeposited_J': deposited,
            'floorAverage_W': threshold / interval,
            'floorPulse_W': threshold / pulse_s,
            'depositedAverage_W': deposited / interval,
            'depositedPulse_W': deposited / pulse_s,
        }
    return {
        'duration_s': duration, 'arrivalRate_s1': count / duration,
        'shotInterval_s': interval, 'pulse_s': pulse_s,
        'dutyFactor': pulse_s / interval, 'atomisation_J': atomisation,
        'soundSpeed_m_s': sound,
        'expansionTime_s': cloud_radius_m / sound,
        # Distance to the intended interaction region at pulse END, not the hull.
        'pulseEndStandoff_m': w * cloud_radius_m / sound,
        'pulseTravel_m': w * pulse_s, 'cloudDiameter_m': 2 * cloud_radius_m,
        'specificImpactEnergy_J_kg': 0.5 * w**2,
        'oneGramImpact_J': 0.5 * 1e-3 * w**2,
        'oneGramTNTEquivalent_g': 0.5 * 1e-3 * w**2 / 4200,
        'pelletImpact_J': 0.5 * mass * w**2, 'routes': routes,
    }


def pellet_reflector_budget(cloud_radius_m=10, coil_radius_m=10,
                            current_density_A_m2=1e8):
    """Pressure/orbit scales and a single-turn coil cost example, not a design.

    J=100 A/mm^2 and copper density=8960 kg/m^3 are a mass proxy, NOT a
    sustainable normal-conductor operating point or superconductor rating.
    Inductance uses the thin round-wire *external* expression
    L=mu0 R[ln(8R/a)-2], excluding internal flux. Supports, cooling, power,
    insulation and plasma modification of the vacuum field are unmodelled.
    On-axis field calculations do not imply on-axis ions are reflected.
    """
    for value in (cloud_radius_m, coil_radius_m, current_density_A_m2):
        if not math.isfinite(value) or value <= 0:
            raise ValueError("reflector inputs must be finite and positive")
    mass = 0.000375
    w = 100e3
    volume = 4 * math.pi * cloud_radius_m**3 / 3
    ram = mass / volume * w**2
    field = math.sqrt(2 * MU0 * ram)
    ion_mass = ELEMENTS['Al']['A'] * ATOMIC_MASS_KG

    def coil(local_field, axial_distance):
        # Biot-Savart on-axis vacuum field of a circular loop.
        current = (2 * local_field * (coil_radius_m**2 + axial_distance**2)**1.5
                   / (MU0 * coil_radius_m**2))
        area = current / current_density_A_m2
        wire_radius = math.sqrt(area / math.pi)
        if wire_radius >= coil_radius_m / 10:
            raise ValueError("coil example requires thin wire (a/R < 0.1)")
        inductance = MU0 * coil_radius_m * (math.log(8 * coil_radius_m / wire_radius) - 2)
        return {'localField_T': local_field, 'axialDistance_m': axial_distance,
                'current_A': current, 'wireRadius_m': wire_radius,
                'conductorArea_m2': area,
                'conductorMass_kg': 2 * math.pi * coil_radius_m * area * 8960,
                'inductance_H': inductance, 'storedEnergy_J': 0.5 * inductance * current**2}

    return {
        'ramPressure_Pa': ram, 'tenMilliTeslaPressure_Pa': 0.01**2 / (2 * MU0),
        'pressureBalanceField_T': field,
        # 2*rho*w^2 is a conservative planar full-reversal stress scale.
        'fullReversalFieldScale_T': math.sqrt(2) * field,
        'gyroradiusAtBalance_m': ion_mass * w / (E_CHARGE * field),
        'fullStripGyroradiusAtBalance_m': ion_mass * w / (13 * E_CHARGE * field),
        'halfGyroTimeAtBalance_s': math.pi * ion_mass / (E_CHARGE * field),
        'cloudCrossing_s': 2 * cloud_radius_m / w,
        'absorptionImpulse_N_s': mass * w,
        'idealReflectionImpulse_N_s': 2 * mass * w,
        'referenceImpulse_N_s': 0.8 * 2 * mass * w,
        'referenceMeanForce_N': 0.8 * 2 * mass * w / (30 * 86400 / 10000),
        'referencePulseForceScale_N': 0.8 * 2 * mass * w / (2 * cloud_radius_m / w),
        'coilRadius_m': coil_radius_m, 'currentDensity_A_m2': current_density_A_m2,
        'tenMilliTeslaCentre': coil(0.01, 0),
        'balanceCentre': coil(field, 0),
        'balanceOneRadiusUpstream': coil(field, coil_radius_m),
    }


print("\n== Concept F: pellet arrival and reflector (issue #65) ==")
for label, budget in (('arrival', pellet_arrival_budget()),
                      ('reflector', pellet_reflector_budget())):
    for key, value in budget.items():
        print(f"  {label}.{key}: {value}")


print("\n== Concept F: pellet materials (issue #60) ==")
for name, row in pellet_material_comparison().items():
    print(f"  {name}: rho={row['density_g_cm3']:.5f} g/cm^3, d={row['diameter_mm']:.3f} mm, "
          f"single={row['singleIonisation_J']/1000:.3f} kJ, full={row['fullIonisation_J']/1e6:.4f} MJ")
    for symbol, component in row['components'].items():
        print(f"    {symbol}: A/q={component['massToChargeSingle_u_e']:.4f} -> "
              f"{component['massToChargeFull_u_e']:.4f} u/e; r_L(10 mT,100 km/s)="
              f"{component['gyroradiusSingle_m']:.3f} -> {component['gyroradiusFull_m']:.3f} m; "
              f"n_i={component['ionDensity_cm3']:.3e} cm^-3, nu_ii={component['selfCollisionRate_s1']:.3e} /s, "
              f"thermal mfp={component['thermalMeanFreePath_m']:.3f} m (R=10 m,T_i=10 eV,Z=1)")
    if 'coatingThickness_um' in row:
        print(f"    Al shell thickness={row['coatingThickness_um']:.2f} um (5% of total mass)")
launch_material = pellet_launch_and_environment()
for key, value in launch_material.items():
    print(f"  {key}: {value}")
al_dilute = pellet_material_comparison(cloud_radius_m=100)['aluminium']['components']['Al']
print(f"  Al cloud R=100 m: n={al_dilute['ionDensity_cm3']:.3e} cm^-3, "
      f"nu_ii={al_dilute['selfCollisionRate_s1']:.3f} /s, thermal mfp={al_dilute['thermalMeanFreePath_m']:.1f} m")

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


def _em_positive(**values):
    for name, value in values.items():
        if not math.isfinite(value) or value <= 0:
            raise ValueError(f"{name} must be finite and positive")


def em_launch_budget(final_speed_km_s, acceleration_g, mass_kg=1,
                     efficiency=0.5, initial_speed_km_s=0):
    """Constant tangential acceleration; speeds relative to the launcher.

    No drag, gravity work, carriage mass or field-energy inventory. Efficiency
    is an ASSUMED constant electrical-to-payload-KE fraction, not measured.
    Peak power is at exit; recharge power is NOT the shot's average power.
    See em-rail-limits.md for derivations, source evidence and limitations.
    """
    _em_positive(final_speed_km_s=final_speed_km_s, acceleration_g=acceleration_g,
                 mass_kg=mass_kg, efficiency=efficiency)
    if (efficiency > 1 or not math.isfinite(initial_speed_km_s)
            or initial_speed_km_s < 0 or initial_speed_km_s >= final_speed_km_s):
        raise ValueError("require 0 < efficiency <= 1 and 0 <= initial < final speed")
    vi = initial_speed_km_s * 1000
    vf = final_speed_km_s * 1000
    a = acceleration_g * G0
    duration = (vf - vi) / a
    energy = 0.5 * mass_kg * (vf - vi) * (vf + vi)
    return {
        'finalSpeed_km_s': final_speed_km_s, 'acceleration_g': acceleration_g,
        'mass_kg': mass_kg, 'efficiency': efficiency,
        'length_km': (vf - vi) * (vf + vi) / (2 * a) / 1000,
        'duration_s': duration, 'force_N': mass_kg * a,
        'kineticEnergyGain_J': energy, 'inputEnergy_J': energy / efficiency,
        'lossEnergy_J': energy * (1 / efficiency - 1),
        'averageMechanicalPower_W': energy / duration,
        'peakMechanicalPower_W': mass_kg * a * vf,
        'averageElectricalPower_W': energy / duration / efficiency,
        'peakElectricalPower_W': mass_kg * a * vf / efficiency,
    }


def em_field_budget(field_T=20, coupling_area_m2=0.001, mass_kg=1,
                    support_radius_m=0.1, support_thickness_m=0.01):
    """Vacuum Maxwell pressure/energy density and ideal pressure-area force.

    p*A is a favourable force SCALE, not a coilgun coupling prediction.
    Hoop stress p*r/t is a thin cylindrical support analogy, not a winding
    stress solution. The field says nothing about critical current by itself.
    """
    _em_positive(field_T=field_T, coupling_area_m2=coupling_area_m2,
                 mass_kg=mass_kg, support_radius_m=support_radius_m,
                 support_thickness_m=support_thickness_m)
    if support_thickness_m > support_radius_m / 10:
        raise ValueError("thin-support estimate requires thickness/radius <= 0.1")
    pressure = field_T**2 / (2 * MU0)
    return {
        'pressure_Pa': pressure, 'energyDensity_J_m3': pressure,
        'idealForceScale_N': pressure * coupling_area_m2,
        'idealAccelerationScale_g': pressure * coupling_area_m2 / mass_kg / G0,
        'thinSupportHoopStress_Pa': pressure * support_radius_m / support_thickness_m,
    }


def em_payload_budget(acceleration_g, mass_kg=1, coupling_area_m2=0.001,
                      density_kg_m3=3000, supported_length_m=0.1):
    """End-supported uniform slab stress rho*a*l and optimistic field scale.

    Not a qualification of electronics, optics, joints, or a complete probe.
    Effective magnetic coupling area need not equal the payload frontal area.
    """
    _em_positive(acceleration_g=acceleration_g, mass_kg=mass_kg,
                 coupling_area_m2=coupling_area_m2, density_kg_m3=density_kg_m3,
                 supported_length_m=supported_length_m)
    a = acceleration_g * G0
    pressure = mass_kg * a / coupling_area_m2
    return {'force_N': mass_kg * a,
            'endSupportStress_Pa': density_kg_m3 * a * supported_length_m,
            'idealCouplingPressure_Pa': pressure,
            'idealCouplingField_T': math.sqrt(2 * MU0 * pressure)}


def em_switching_budget(speed_km_s, pitch_m=0.1, inductance_H=10e-6,
                       current_A=10000, resistance_ohm=0.001,
                       rise_fraction=0.25, flux_gradient_Wb_m=1):
    """One illustrative driven coil phase: V=RI+L*dI/dt+v*d(lambda)/dx.

    Constant L and prescribed external/mutual flux gradient. The three terms
    are assumed to add during current rise; real signs/waveforms vary by stage.
    Values are not a self-consistent launcher design or switch specification.
    """
    _em_positive(speed_km_s=speed_km_s, pitch_m=pitch_m,
                 inductance_H=inductance_H, current_A=current_A,
                 resistance_ohm=resistance_ohm, rise_fraction=rise_fraction,
                 flux_gradient_Wb_m=flux_gradient_Wb_m)
    if rise_fraction > 1:
        raise ValueError("rise_fraction must be <= 1")
    speed = speed_km_s * 1000
    transit = pitch_m / speed
    inductive = inductance_H * current_A / (rise_fraction * transit)
    motional = speed * flux_gradient_Wb_m
    resistive = resistance_ohm * current_A
    return {'stageTransit_s': transit, 'stageRate_Hz': 1 / transit,
            'riseTime_s': rise_fraction * transit,
            'inductiveVoltage_V': inductive, 'motionalVoltage_V': motional,
            'resistiveVoltage_V': resistive,
            'riseVoltageSum_V': inductive + motional + resistive,
            'coilStoredEnergy_J': 0.5 * inductance_H * current_A**2,
            'coilOhmicPower_W': current_A**2 * resistance_ohm}


def em_lunar_ring_budget(speed_km_s, acceleration_g, mass_kg=1):
    """Ideal Moon-radius guideway; constant tangential acceleration from rest.

    Curvature acceleration is v^2/R. Track's signed inward support subtracts
    lunar gravity, and combines orthogonally with tangential drive for proper
    payload load. Ring laps use tangential acceleration only: they do NOT
    certify compliance with a total g limit. Ignores rotation and topography.
    """
    _em_positive(speed_km_s=speed_km_s, acceleration_g=acceleration_g, mass_kg=mass_kg)
    speed = speed_km_s * 1000
    circumference = 2 * math.pi * R_MOON
    radial = speed**2 / R_MOON
    gravity = MU_MOON / R_MOON**2
    guide = radial - gravity
    return {
        'circumference_km': circumference / 1000,
        'accelerationLaps': speed**2 / (2 * acceleration_g * G0) / circumference,
        'curvatureAcceleration_g': radial / G0,
        'signedInwardGuideForce_N': mass_kg * guide,
        'totalSupportedLoad_g': math.hypot(acceleration_g, guide / G0),
        # Coasting limit with ALL support-load budget devoted to curvature.
        'coastingSpeedAtLoadLimit_km_s': math.sqrt(
            (acceleration_g * G0 + gravity) * R_MOON) / 1000,
    }


def em_atmosphere_budget(speed_km_s, frontal_area_m2=0.0001,
                        air_density_kg_m3=1.225, surface_pressure_Pa=101325):
    """Incident gas momentum/energy scales; NOT heat flux to the probe.

    Column mass p*A/g assumes a vertical hydrostatic Earth column. Constant
    speed incident energy is a counterfactual if appreciable deceleration
    occurs. Shocks, radiation, ablation, chemistry and heat partition absent.
    Standard sea-level inputs: NASA SP-367; see em-rail-limits.md.
    """
    _em_positive(speed_km_s=speed_km_s, frontal_area_m2=frontal_area_m2,
                 air_density_kg_m3=air_density_kg_m3,
                 surface_pressure_Pa=surface_pressure_Pa)
    speed = speed_km_s * 1000
    column = surface_pressure_Pa * frontal_area_m2 / G0
    return {'dynamicPressure_Pa': 0.5 * air_density_kg_m3 * speed**2,
            'incidentKineticPower_W': 0.5 * air_density_kg_m3 * frontal_area_m2 * speed**3,
            'verticalColumnMass_kg': column,
            'constantSpeedColumnEnergy_J': 0.5 * column * speed**2}


class EMRailTests(unittest.TestCase):
    """Independent rounded benchmarks and conservation/geometry checks (#66)."""

    def test_nine_launch_cases(self):
        # Hand-checked distances in km, times in seconds, mechanical mean in GW.
        expected = (
            (10, 1e3, 5.098581, 1.019716, 0.04903325),
            (10, 1e4, 0.5098581, 0.1019716, 0.4903325),
            (10, 1e5, 0.05098581, 0.01019716, 4.903325),
            (50, 1e3, 127.4645, 5.098581, 0.24516625),
            (50, 1e4, 12.74645, 0.5098581, 2.4516625),
            (50, 1e5, 1.274645, 0.05098581, 24.516625),
            (300, 1e3, 4588.723, 30.59149, 1.4709975),
            (300, 1e4, 458.8723, 3.059149, 14.709975),
            (300, 1e5, 45.88723, 0.3059149, 147.09975),
        )
        for speed, g, length, duration, mean in expected:
            with self.subTest(speed=speed, g=g):
                row = em_launch_budget(speed, g)
                self.assertAlmostEqual(row['length_km'] / length, 1, delta=1e-6)
                self.assertAlmostEqual(row['duration_s'] / duration, 1, delta=1e-6)
                self.assertAlmostEqual(row['averageMechanicalPower_W'] / 1e9, mean)
                self.assertAlmostEqual(row['peakMechanicalPower_W'] / 1e9, 2 * mean)
                self.assertAlmostEqual(row['averageElectricalPower_W'] / 1e9, 2 * mean)
                self.assertAlmostEqual(row['peakElectricalPower_W'] / 1e9, 4 * mean)
                self.assertAlmostEqual(row['force_N'] * row['length_km'] * 1000,
                                       row['kineticEnergyGain_J'], delta=1e-4)
                self.assertAlmostEqual(row['force_N'] * row['duration_s'],
                                       speed * 1000, delta=1e-9)  # 1 kg momentum gain
                expected_energy = {10: 50e6, 50: 1.25e9, 300: 45e9}[speed]
                self.assertEqual(row['kineticEnergyGain_J'], expected_energy)
                self.assertEqual(row['inputEnergy_J'], 2 * expected_energy)
                self.assertEqual(row['lossEnergy_J'], expected_energy)

    def test_mass_efficiency_and_nonzero_injection(self):
        base = em_launch_budget(5, 1e3)
        heavy = em_launch_budget(5, 1e3, mass_kg=2, efficiency=1)
        self.assertEqual(heavy['length_km'], base['length_km'])
        self.assertEqual(heavy['duration_s'], base['duration_s'])
        self.assertEqual(heavy['kineticEnergyGain_J'], 2 * base['kineticEnergyGain_J'])
        self.assertEqual(heavy['inputEnergy_J'], base['inputEnergy_J'])
        self.assertEqual(heavy['lossEnergy_J'], 0)
        injected = em_launch_budget(5, 1e3, initial_speed_km_s=3)
        self.assertEqual(injected['kineticEnergyGain_J'], 8e6)
        self.assertAlmostEqual(injected['length_km'], 0.815773, delta=1e-6)
        # Same track and force adds v^2, not speeds: a 3 km/s injection into
        # a rail which provides 4 km/s from rest exits at 5 km/s, not 7 km/s.
        self.assertAlmostEqual(injected['length_km'], em_launch_budget(4, 1e3)['length_km'])
        self.assertAlmostEqual(injected['averageMechanicalPower_W'],
                               injected['force_N'] * 4000)

    def test_pressure_payload_and_support_stress(self):
        for field, pressure_MPa in ((10, 39.788736), (20, 159.154943),
                                     (30, 358.098622), (45, 805.721899)):
            row = em_field_budget(field)
            self.assertAlmostEqual(row['pressure_Pa'] / 1e6, pressure_MPa, delta=1e-6)
            self.assertEqual(row['energyDensity_J_m3'], row['pressure_Pa'])
            self.assertAlmostEqual(row['thinSupportHoopStress_Pa'], 10 * row['pressure_Pa'])
        self.assertAlmostEqual(em_field_budget()['idealAccelerationScale_g'], 16229.287, delta=0.001)
        for g, stress_MPa, field in ((1e3, 2.941995, 4.964554),
                                    (1e4, 29.41995, 15.699299),
                                    (1e5, 294.1995, 49.645543)):
            row = em_payload_budget(g)
            self.assertAlmostEqual(row['endSupportStress_Pa'] / 1e6, stress_MPa)
            self.assertAlmostEqual(row['idealCouplingField_T'], field, delta=0.00001)
            self.assertAlmostEqual(em_field_budget(row['idealCouplingField_T'])[
                'idealAccelerationScale_g'], g, delta=1e-9)

    def test_switching_and_back_emf(self):
        for speed, transit_us, inductive_kV, motional_kV in (
                (10, 10, 40, 10), (50, 2, 200, 50), (300, 1/3, 1200, 300)):
            row = em_switching_budget(speed)
            self.assertAlmostEqual(row['stageTransit_s'] * 1e6, transit_us)
            self.assertAlmostEqual(row['inductiveVoltage_V'] / 1000, inductive_kV)
            self.assertAlmostEqual(row['motionalVoltage_V'] / 1000, motional_kV)
            self.assertAlmostEqual(row['riseVoltageSum_V'], (inductive_kV + motional_kV) * 1000 + 10)
            self.assertAlmostEqual(row['coilStoredEnergy_J'], 500)
            self.assertEqual(row['coilOhmicPower_W'], 100000)
        # Longer stages relax di/dt, but cannot remove motional EMF at fixed flux gradient.
        wider = em_switching_budget(300, pitch_m=1)
        self.assertAlmostEqual(wider['inductiveVoltage_V'], 120000)
        self.assertEqual(wider['motionalVoltage_V'], 300000)

    def test_ring_curvature_is_not_free(self):
        ring = em_lunar_ring_budget(300, 1e3)
        self.assertAlmostEqual(ring['circumference_km'], 10916.406, delta=0.001)
        self.assertAlmostEqual(ring['curvatureAcceleration_g'], 5282.287, delta=0.001)
        self.assertAlmostEqual(ring['accelerationLaps'], 0.420351, delta=1e-6)
        self.assertGreater(ring['totalSupportedLoad_g'], 1e3)
        self.assertAlmostEqual(ring['coastingSpeedAtLoadLimit_km_s'], 130.541, delta=0.001)
        high = em_lunar_ring_budget(300, 1e4)
        self.assertAlmostEqual(high['totalSupportedLoad_g'], 11309.324, delta=0.001)
        # At lunar circular speed gravity supplies curvature without a guide load.
        circular = em_lunar_ring_budget(kms(math.sqrt(MU_MOON / R_MOON)), 1e3)
        self.assertAlmostEqual(circular['signedInwardGuideForce_N'], 0, delta=1e-9)
        self.assertAlmostEqual(circular['totalSupportedLoad_g'], 1e3)

    def test_atmospheric_scales_are_not_absorbed_heat(self):
        for speed, pressure_MPa, incident_MW in (
                (10, 61.25, 61.25), (50, 1531.25, 7656.25),
                (300, 55125, 1653750)):
            row = em_atmosphere_budget(speed)
            self.assertAlmostEqual(row['dynamicPressure_Pa'] / 1e6, pressure_MPa)
            self.assertAlmostEqual(row['incidentKineticPower_W'] / 1e6, incident_MW)
            self.assertAlmostEqual(row['verticalColumnMass_kg'], 1.033227, delta=1e-6)
            self.assertAlmostEqual(row['constantSpeedColumnEnergy_J'],
                                   0.5 * row['verticalColumnMass_kg'] * (speed * 1000)**2)

    def test_invalid_inputs(self):
        cases = (
            (em_launch_budget, {'final_speed_km_s': 10, 'acceleration_g': 1e3}),
            (em_field_budget, dict(field_T=20, coupling_area_m2=0.001, mass_kg=1,
                support_radius_m=0.1, support_thickness_m=0.01)),
            (em_payload_budget, dict(acceleration_g=1e3, mass_kg=1, coupling_area_m2=0.001,
                density_kg_m3=3000, supported_length_m=0.1)),
            (em_switching_budget, dict(speed_km_s=10, pitch_m=0.1, inductance_H=10e-6,
                current_A=10000, resistance_ohm=0.001, rise_fraction=0.25,
                flux_gradient_Wb_m=1)),
            (em_lunar_ring_budget, dict(speed_km_s=10, acceleration_g=1e3, mass_kg=1)),
            (em_atmosphere_budget, dict(speed_km_s=10, frontal_area_m2=0.0001,
                air_density_kg_m3=1.225, surface_pressure_Pa=101325)),
        )
        for function, kwargs in cases:
            for key in kwargs:
                for invalid in (0, -1, math.nan, math.inf):
                    with self.subTest(function=function.__name__, key=key, value=invalid):
                        with self.assertRaises(ValueError):
                            function(**{**kwargs, key: invalid})
        for kwargs in ({'efficiency': 0}, {'efficiency': 1.01}, {'efficiency': math.nan},
                       {'mass_kg': -1}, {'initial_speed_km_s': -1},
                       {'initial_speed_km_s': 10}, {'initial_speed_km_s': math.inf},
                       {'initial_speed_km_s': math.nan}):
            with self.assertRaises(ValueError):
                em_launch_budget(10, 1e3, **kwargs)
        with self.assertRaises(ValueError):
            em_field_budget(support_thickness_m=0.02)
        with self.assertRaises(ValueError):
            em_switching_budget(10, rise_fraction=1.1)


print("\n== EM rail / coilgun limits (issue #66; eta=0.5 ASSUMED) ==")
print("  v_km_s g length_km duration_s KE_MJ input_MJ mech_avg_GW mech_peak_GW elec_avg_GW elec_peak_GW")
for speed in (10, 50, 300):
    for g_limit in (1e3, 1e4, 1e5):
        row = em_launch_budget(speed, g_limit)
        print(f"  {speed:3} {g_limit:.0e} {row['length_km']:.6f} {row['duration_s']:.8f} "
              f"{row['kineticEnergyGain_J']/1e6:.3f} {row['inputEnergy_J']/1e6:.3f} "
              + " ".join(f"{row[key]/1e9:.8f}" for key in (
                  'averageMechanicalPower_W', 'peakMechanicalPower_W',
                  'averageElectricalPower_W', 'peakElectricalPower_W')))
for label, values in (
        ('candidate 5 km/s, 1000 g', em_launch_budget(5, 1e3)),
        ('candidate 2.5 km/s, 1000 g', em_launch_budget(2.5, 1e3))):
    print(f"  {label}: {values}")
for field in (10, 20, 30, 45):
    print(f"  B={field} T: {em_field_budget(field)}")
for g_limit in (1e3, 1e4, 1e5):
    print(f"  payload at {g_limit:.0e} g: {em_payload_budget(g_limit)}")
for speed in (10, 50, 300):
    print(f"  switching at {speed} km/s: {em_switching_budget(speed)}")
    print(f"  lunar ring at {speed} km/s, 1000 g tangential: {em_lunar_ring_budget(speed, 1e3)}")
    print(f"  Earth atmosphere at {speed} km/s: {em_atmosphere_budget(speed)}")
print("  lunar ring at 300 km/s, 10000 g tangential:", em_lunar_ring_budget(300, 1e4))
print("  VERDICT: lunar contactless coilgun, 2.5-5 km/s first stage is a development candidate; "
      "10 km/s is a stretch; 300 km/s is not a realistic rail baseline.")

# C/1843 D1: JPL SBDB SAO_2008 / Kreutz, retrieved 2026-10-25.
# Freeze the published inputs; tests never fetch a changing orbit solution.
# Source provenance, formula derivations and limitations: comet-hitchhike.md.
COMET_Q_AU = 0.005527
COMET_E = 0.999914
COMET_I_DEG = 144.3548
COMET_ARGP_DEG = 82.6390


def comet_orbit(q_AU=COMET_Q_AU, eccentricity=COMET_E):
    """Bound two-body ellipse; None means no real solar escape v-infinity."""
    _em_positive(q_AU=q_AU)
    if not math.isfinite(eccentricity) or not 0 <= eccentricity < 1:
        raise ValueError('comet orbit requires 0 <= eccentricity < 1')
    q = q_AU * AU
    a = q / (1 - eccentricity)
    energy = -MU_SUN / (2 * a)
    return {
        'q_km': q / 1000, 'altitude_km': (q - R_SUN) / 1000,
        'q_Rsun': q / R_SUN, 'a_AU': a / AU,
        'aphelion_AU': a * (1 + eccentricity) / AU,
        'period_years': 2 * math.pi * math.sqrt(a**3 / MU_SUN) / (365.25 * 86400),
        'specificEnergy_km2_s2': energy / 1e6,
        'perihelionSpeed_km_s': kms(math.sqrt(MU_SUN * (1 + eccentricity) / q)),
        'escapeSpeed_km_s': kms(math.sqrt(2 * MU_SUN / q)),
        'bound': True, 'vInf_km_s': None,
    }


def comet_oberth_burn(q_AU=COMET_Q_AU, specific_energy_km2_s2=None,
                      delta_v_km_s=24, target_vinf_km_s=300):
    """Tangential, instantaneous prograde burn; energy may be bound or unbound.

    Default energy is the catalog comet's, even if q is overridden. For a
    different incoming orbit, explicitly supply its energy. Approximation
    drops both incoming energy and dv^2; it is only near-parabolic/small-kick.
    """
    _em_positive(q_AU=q_AU)
    if specific_energy_km2_s2 is None:
        specific_energy_km2_s2 = comet_orbit()['specificEnergy_km2_s2']
    for value in (specific_energy_km2_s2, delta_v_km_s, target_vinf_km_s):
        if not math.isfinite(value):
            raise ValueError('burn inputs must be finite')
    if delta_v_km_s < 0 or target_vinf_km_s < 0:
        raise ValueError('burn and target speeds must be nonnegative')
    escape2 = 2 * MU_SUN / (q_AU * AU) / 1e6
    speed2 = escape2 + 2 * specific_energy_km2_s2
    if speed2 <= 0:
        raise ValueError('incoming orbit has no moving state at this radius')
    speed = math.sqrt(speed2)
    # Rationalise the difference to preserve small kicks on nearly parabolic orbits.
    required = (target_vinf_km_s**2 - 2 * specific_energy_km2_s2) / (
        math.sqrt(escape2 + target_vinf_km_s**2) + speed)
    energy = specific_energy_km2_s2 + speed * delta_v_km_s + delta_v_km_s**2 / 2
    return {
        'perihelionSpeed_km_s': speed, 'specificEnergyAfter_km2_s2': energy,
        'vInf_km_s': math.sqrt(2 * energy) if energy >= 0 else None,
        'targetDeltaV_km_s': required,
        'parabolicApproxDeltaV_km_s': target_vinf_km_s**2 / (2 * speed),
    }


def comet_passage(radius_Rsun, q_AU=COMET_Q_AU, eccentricity=COMET_E):
    """Exact unpowered elliptic residence time and normal-plane solar fluence.

    Both inbound and outbound legs inside the specified radius. Fluence uses
    r^2 dnu/dt = h, so integral F dt = S AU^2 * 2 nu / h. The impulse case
    has a different outgoing conic and is not represented by this window.
    """
    orbit = comet_orbit(q_AU, eccentricity)
    _em_positive(radius_Rsun=radius_Rsun)
    q = q_AU * AU
    radius = radius_Rsun * R_SUN
    if radius < q or radius > orbit['aphelion_AU'] * AU:
        raise ValueError('window radius must be between perihelion and aphelion')
    if eccentricity == 0:
        raise ValueError('a circular orbit has no isolated perihelion passage')
    p = q * (1 + eccentricity)
    nu = math.acos(max(-1, min(1, (p / radius - 1) / eccentricity)))
    anomaly = 2 * math.atan2(math.sqrt(1 - eccentricity) * math.sin(nu / 2),
                             math.sqrt(1 + eccentricity) * math.cos(nu / 2))
    a = q / (1 - eccentricity)
    duration = 2 * math.sqrt(a**3 / MU_SUN) * (anomaly - eccentricity * math.sin(anomaly))
    return {
        'duration_s': duration, 'halfAngle_rad': nu,
        'normalFluence_J_m2': 2 * SOLAR_FLUX_W_M2 * AU**2 * nu / math.sqrt(MU_SUN * p),
    }


def comet_thermal_budget(q_AU=COMET_Q_AU, absorptivity=1, emissivity=1,
                         radiating_area_ratio=1, limit_K=1650):
    """Normal flat shield balance; area ratio = emitting / projected area.

    Sphere outputs distinguish point-source and uniform extended solar disk.
    Limb darkening, sublimation, conduction and coronal heating are omitted.
    Selective optical properties are assumptions, not material specifications.
    """
    _em_positive(q_AU=q_AU, absorptivity=absorptivity, emissivity=emissivity,
                 radiating_area_ratio=radiating_area_ratio, limit_K=limit_K)
    if absorptivity > 1 or emissivity > 1 or q_AU * AU <= R_SUN:
        raise ValueError('optical fractions must be <= 1 and q outside the Sun')
    flux = SOLAR_FLUX_W_M2 / q_AU**2
    disk_factor = 2 / (1 + math.sqrt(1 - (R_SUN / (q_AU * AU))**2))
    return {
        'flux_W_m2': flux, 'suns': 1 / q_AU**2,
        'equilibrium_K': (absorptivity * flux / (
            emissivity * radiating_area_ratio * SIGMA_SB))**0.25,
        'pointSourceBlackSphere_K': (flux / (4 * SIGMA_SB))**0.25,
        'uniformDiskBlackSphere_K': (disk_factor * flux / (4 * SIGMA_SB))**0.25,
        'sphereDiskFactor': disk_factor,
        'maxAlphaOverEpsilon': radiating_area_ratio * SIGMA_SB * limit_K**4 / flux,
        'solarHalfAngle_deg': math.degrees(math.asin(R_SUN / (q_AU * AU))),
    }


def comet_secondary_budget(nucleus_radius_m=1000, density_kg_m3=500,
                            gas_speed_m_s=1000, sublimation_J_kg=2.8e6,
                            gas_rate_kg_s=1e6, standoff_m=10000,
                            area_mass_m2_kg=0.01, impact_speed_km_s=570):
    """Illustrative scales, NOT measured C/1843 D1 physical properties.

    Recoil upper scale spends all intercepted sunlight on gas, all momentum
    aligned, fixed nucleus mass. Integrate normal flux inside 2q, then bound
    the extended-disk correction by its peak value. A separate isotropic gas
    example estimates local drag; it is not the total energy-limited rate.
    """
    _em_positive(nucleus_radius_m=nucleus_radius_m, density_kg_m3=density_kg_m3,
                 gas_speed_m_s=gas_speed_m_s, sublimation_J_kg=sublimation_J_kg,
                 gas_rate_kg_s=gas_rate_kg_s, standoff_m=standoff_m,
                 area_mass_m2_kg=area_mass_m2_kg, impact_speed_km_s=impact_speed_km_s)
    q = COMET_Q_AU * AU
    if nucleus_radius_m >= q - R_SUN or standoff_m <= nucleus_radius_m:
        raise ValueError('nucleus must clear Sun and gas sample must be outside nucleus')
    thermal = comet_thermal_budget()
    passage = comet_passage(2 * q / R_SUN)
    flux = thermal['flux_W_m2']
    correction = thermal['sphereDiskFactor']
    mass = 4 / 3 * math.pi * density_kg_m3 * nucleus_radius_m**3
    rate = math.pi * nucleus_radius_m**2 * flux * correction / sublimation_J_kg
    recoil = 3 * gas_speed_m_s * passage['normalFluence_J_m2'] * correction / (
        4 * density_kg_m3 * nucleus_radius_m * sublimation_J_kg)
    ram = gas_rate_kg_s * gas_speed_m_s / (4 * math.pi * standoff_m**2)
    return {
        'nucleusMass_kg': mass,
        # Similar triangles between the two spheres' common external tangents.
        'umbraBeyondSurface_m': nucleus_radius_m * q / (R_SUN - nucleus_radius_m) - nucleus_radius_m,
        'peakEnergyLimitedGasRate_kg_s': rate,
        'recoilDeltaVUpperScale_m_s': recoil,
        'lostMassFractionUpperScale': recoil / gas_speed_m_s,
        'subsolarErosionScale_m': passage['normalFluence_J_m2'] / (density_kg_m3 * sublimation_J_kg),
        'isotropicGasRamPressure_Pa': ram,
        'gasImpulseScale_m_s': ram * area_mass_m2_kg * passage['duration_s'],
        'tidalAcceleration_m_s2': 2 * MU_SUN * nucleus_radius_m / q**3,
        'surfaceGravity_m_s2': 4 * math.pi * 6.6743e-11 * density_kg_m3 * nucleus_radius_m / 3,
        'specificImpactEnergy_J_kg': 0.5 * (impact_speed_km_s * 1000)**2,
        'oneMicrogramImpact_J': 0.5 * 1e-9 * (impact_speed_km_s * 1000)**2,
    }


def comet_rendezvous_scales(radius_AU=1):
    """Catalog incoming state and node radii; no launch/rendezvous optimisation."""
    orbit = comet_orbit()
    _em_positive(radius_AU=radius_AU)
    if not COMET_Q_AU < radius_AU < orbit['aphelion_AU']:
        raise ValueError('sample must be strictly between the apsides')
    p = COMET_Q_AU * AU * (1 + COMET_E)
    h = math.sqrt(MU_SUN * p)
    radius = radius_AU * AU
    nu = -math.acos((p / radius - 1) / COMET_E)
    radial = MU_SUN / h * COMET_E * math.sin(nu)
    transverse = h / radius
    circular = math.sqrt(MU_SUN / radius)
    argp = math.radians(COMET_ARGP_DEG)
    return {
        'radialSpeed_km_s': kms(radial), 'transverseSpeed_km_s': kms(transverse),
        'speed_km_s': kms(math.hypot(radial, transverse)),
        # Minimum mismatch to ANY local circular velocity; not Earth's state.
        'localCircularMismatchLowerBound_km_s': kms(math.hypot(radial, transverse - circular)),
        'latitude_deg': math.degrees(math.asin(math.sin(math.radians(COMET_I_DEG)) * math.sin(argp + nu))),
        'nodeRadii_AU': [p / (1 + COMET_E * math.cos(n)) / AU for n in (-argp, math.pi - argp)],
    }


class CometHitchhikeTests(unittest.TestCase):
    def test_catalog_orbit_is_bound_despite_large_perihelion_speed(self):
        row = comet_orbit()
        self.assertAlmostEqual(row['q_km'], 826839.2, delta=0.1)
        self.assertAlmostEqual(row['a_AU'], 64.2674419, delta=1e-7)
        self.assertAlmostEqual(row['aphelion_AU'], 128.5293567, delta=1e-7)
        self.assertAlmostEqual(row['specificEnergy_km2_s2'], -6.901724, delta=1e-6)
        self.assertAlmostEqual(row['perihelionSpeed_km_s'], 566.565634, delta=1e-6)
        self.assertTrue(row['bound'])
        self.assertIsNone(row['vInf_km_s'])
        # Energy reconstructed independently by vis-viva, including cancellation.
        self.assertAlmostEqual(0.5 * row['perihelionSpeed_km_s']**2 -
            MU_SUN / (row['q_km'] * 1000) / 1e6, row['specificEnergy_km2_s2'], delta=1e-9)
        self.assertIsNone(comet_oberth_burn(delta_v_km_s=0)['vInf_km_s'])

    def test_exact_burn_and_concept_c_comparison(self):
        ref = comet_oberth_burn()
        self.assertAlmostEqual(ref['targetDeltaV_km_s'], 74.535311, delta=1e-6)
        self.assertAlmostEqual(ref['parabolicApproxDeltaV_km_s'], 79.425926, delta=1e-6)
        self.assertAlmostEqual(ref['vInf_km_s'], 166.605363, delta=1e-6)
        exact = comet_oberth_burn(delta_v_km_s=ref['targetDeltaV_km_s'])
        self.assertAlmostEqual(exact['specificEnergyAfter_km2_s2'], 45000, delta=1e-8)
        self.assertAlmostEqual(exact['vInf_km_s'], 300, delta=1e-10)
        c_ref = comet_oberth_burn(3.5 * R_SUN / AU, 45**2 / 2)
        self.assertAlmostEqual(c_ref['vInf_km_s'], 136.36, delta=0.01)
        self.assertAlmostEqual(c_ref['targetDeltaV_km_s'], 112.89, delta=0.02)
        escape = comet_oberth_burn(target_vinf_km_s=0)['targetDeltaV_km_s']
        self.assertAlmostEqual(escape * 1000, 12.181554, delta=1e-6)
        # Small-kick approximation converges on an exactly parabolic incoming leg.
        tiny = comet_oberth_burn(specific_energy_km2_s2=0, target_vinf_km_s=1)
        self.assertAlmostEqual(tiny['targetDeltaV_km_s'] / tiny['parabolicApproxDeltaV_km_s'], 1, delta=1e-6)

    def test_passage_against_areal_law_quadrature_and_parabolic_limit(self):
        q = COMET_Q_AU * AU
        p = q * (1 + COMET_E)
        row = comet_passage(2 * q / R_SUN)
        # Integrate dt/dnu = r(nu)^2/h independently of eccentric anomaly.
        n = 2000
        step = row['halfAngle_rad'] / n
        f = lambda nu: (p / (1 + COMET_E * math.cos(nu)))**2 / math.sqrt(MU_SUN * p)
        weights = sum((4 if j % 2 else 2) * f(j * step) for j in range(1, n))
        duration = 2 * step / 3 * (f(0) + weights + f(n * step))
        self.assertAlmostEqual(row['duration_s'], duration, delta=1e-6)
        # For e=1 and r=2q, Barker's variable D=1; time in window = 2 sqrt(2q^3/mu)*4/3.
        parabolic = 2 * math.sqrt(2 * q**3 / MU_SUN) * 4 / 3
        self.assertAlmostEqual(row['duration_s'] / parabolic, 1, delta=1e-4)
        self.assertAlmostEqual(row['normalFluence_J_m2'] / 1e9, 204.2734, delta=0.001)
        self.assertEqual(comet_passage(q / R_SUN)['duration_s'], 0)
        self.assertAlmostEqual(comet_passage(2)['duration_s'] / 60, 98.69, delta=0.01)
        circular = comet_orbit(1, 0)
        self.assertAlmostEqual(circular['perihelionSpeed_km_s'], math.sqrt(MU_SUN / AU) / 1000)

    def test_heat_and_extended_sun_geometry(self):
        row = comet_thermal_budget()
        self.assertAlmostEqual(row['flux_W_m2'] / 1e6, 44.553230, delta=1e-6)
        self.assertAlmostEqual(row['equilibrium_K'], 5294.4014, delta=0.001)
        self.assertAlmostEqual(row['uniformDiskBlackSphere_K'], 3996.25, delta=0.1)
        self.assertAlmostEqual(row['maxAlphaOverEpsilon'], 0.0094334, delta=1e-7)
        self.assertAlmostEqual(comet_thermal_budget(absorptivity=0.15)['equilibrium_K'], 3294.8806, delta=0.001)
        # Two equally emitting faces and inverse-square flux give distinct scalings.
        self.assertAlmostEqual(comet_thermal_budget(radiating_area_ratio=2)['equilibrium_K'] /
                               row['equilibrium_K'], 2**(-0.25))
        self.assertAlmostEqual(comet_thermal_budget(q_AU=2 * COMET_Q_AU)['flux_W_m2'] /
                               row['flux_W_m2'], 0.25)
        secondary = comet_secondary_budget()
        self.assertAlmostEqual(secondary['umbraBeyondSurface_m'], 188.5013, delta=0.001)
        # At the umbra apex, Sun and nucleus have exactly equal angular radii.
        z = 1000 + secondary['umbraBeyondSurface_m']
        self.assertAlmostEqual(math.asin(1000 / z), math.asin(R_SUN / (COMET_Q_AU * AU + z)))

    def test_gas_dust_and_rendezvous_keep_frames_and_scales_explicit(self):
        row = comet_secondary_budget()
        self.assertAlmostEqual(row['oneMicrogramImpact_J'], 162.45)
        self.assertAlmostEqual(row['specificImpactEnergy_J_kg'], 1.6245e11)
        self.assertLess(row['recoilDeltaVUpperScale_m_s'], 150)
        self.assertGreater(row['recoilDeltaVUpperScale_m_s'], 140)
        self.assertGreater(row['tidalAcceleration_m_s2'], row['surfaceGravity_m_s2'])
        far = comet_secondary_budget(standoff_m=20000)
        self.assertAlmostEqual(far['gasImpulseScale_m_s'] / row['gasImpulseScale_m_s'], 0.25)
        r = comet_rendezvous_scales()
        self.assertAlmostEqual(r['speed_km_s'], 41.95737, delta=1e-5)
        self.assertLess(r['radialSpeed_km_s'], -41)
        self.assertLess(r['latitude_deg'], -35)
        self.assertGreater(r['localCircularMismatchLowerBound_km_s'], 49)
        self.assertTrue(all(x < 0.013 for x in r['nodeRadii_AU']))

    def test_invalid_inputs(self):
        for function, kwargs in (
                (comet_orbit, {'q_AU': 0}), (comet_orbit, {'eccentricity': 1}),
                (comet_orbit, {'eccentricity': -0.1}),
                (comet_orbit, {'eccentricity': math.nan}),
                (comet_oberth_burn, {'delta_v_km_s': -1}),
                (comet_oberth_burn, {'target_vinf_km_s': math.inf}),
                (comet_oberth_burn, {'specific_energy_km2_s2': -1e9}),
                (comet_passage, {'radius_Rsun': 1}),
                (comet_passage, {'radius_Rsun': 1e6}),
                (comet_thermal_budget, {'q_AU': R_SUN / AU}),
                (comet_thermal_budget, {'absorptivity': 1.1}),
                (comet_thermal_budget, {'emissivity': 0}),
                (comet_secondary_budget, {'standoff_m': 1000}),
                (comet_secondary_budget, {'density_kg_m3': math.nan}),
                (comet_rendezvous_scales, {'radius_AU': 200})):
            with self.subTest(function=function.__name__, kwargs=kwargs):
                with self.assertRaises(ValueError):
                    function(**kwargs)


print('\n== C/1843 D1 hitchhike (issue #69; ideal two-body / illustrative environment) ==')
print('  orbit:', comet_orbit())
print('  prograde 24 km/s burn and target 300 km/s:', comet_oberth_burn())
print('  Concept C, 3.5 Rsun, incoming vinf=45 km/s:',
      comet_oberth_burn(3.5 * R_SUN / AU, 45**2 / 2))
print('  normal black shield:', comet_thermal_budget())
for radius in (2, 2 * COMET_Q_AU * AU / R_SUN, 3.5):
    print(f'  unpowered passage inside {radius:.6f} Rsun:', comet_passage(radius))
print('  assumed 1 km, 500 kg/m^3 nucleus; gas/dust scales:', comet_secondary_budget())
print('  incoming rendezvous geometry:', comet_rendezvous_scales())
print('  VERDICT: riding a bound sungrazer does not escape; 74.5 km/s perihelion burn '
      'and 44.6 MW/m^2 heating make this a poor Concept C substitute.')

if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=2).run(
        unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(case)
                           for case in (EMRailTests, CometHitchhikeTests)))
    sys.exit(0 if result.wasSuccessful() else 1)
