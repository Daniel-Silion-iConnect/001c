# SPECS.md — Requirements & Constraints

## Payload
- Dry mass: **1.0 kg** (probe + minimal systems).
- Must survive high-g tether releases, solar approach thermal environment, and long cruise.

## Performance Target
- Asymptotic heliocentric velocity: **≥ 299.8 km/s** (0.001c).
- Direction: Preferentially toward a scientifically interesting exit vector; any high-speed exit is acceptable for precursor.

## Propulsion & Infrastructure Constraints
- Chemical stages: Isp ≤ 460 s practical (LH2/LOX or advanced). Solids allowed for kick stages.
- Orbital refueling: Starship-class or equivalent assumed available for staging.
- Solar perihelion: Heat shield technology comparable to or better than Parker Solar Probe; target as low as 3–10 R⊙ if feasible.
- Momentum-exchange tethers: Tip speeds 1.5–3 km/s with current materials; higher with CNT.
- Hitchhike: Tether/harpoon to interstellar objects or asteroids for 2–10 km/s incremental Δv.

## Environmental
- Thermal: Survive solar flux at low perihelion.
- Radiation: Survive Jupiter or other planetary flybys if used.
- Lifetime: ≥20 years for data return from high distance (power source TBD — RTG or advanced).

## Interfaces
- Launch: Compatible with Falcon Heavy / Starship / SLS class vehicles.
- Operations: Autonomous after final boost; limited ground contact.

## Verification
- Trajectory models must be reproducible (code or detailed assumptions documented).
- Mass budgets must include heat shields, tether grapple, and residual propellant.
