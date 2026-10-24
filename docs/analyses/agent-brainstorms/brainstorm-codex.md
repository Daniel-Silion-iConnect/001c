Both ideas accelerate a **1 kg probe plus an assumed 1 kg propulsion package**. Speeds below are conditional first-order estimates; TRLs are my assessments of the complete concepts.

**1. Chirped Pellet Slipstream**

A remote laser accelerates neutral micropellets toward the probe, which ionizes them just upstream and magnetically deflects the resulting plasma without physical impact. The twist is to progressively increase pellet launch speed so that pellets always overtake the accelerating probe at approximately **100 km/s**, limiting the required magnetic rigidity. This combines [pellet-beam propulsion](https://www.nasa.gov/general/pellet-beam-propulsion-for-breakthrough-space-exploration/) with [magnetic particle-beam reflection](https://ntrs.nasa.gov/citations/20020023956).

**Assumptions:** Accelerated mass \(m=2\) kg; intercepted pellet mass \(M=3.75\) kg; relative speed \(w=100\) km/s; axial momentum transfer \(80\%\) of ideal reflection, \(\eta=0.8\). Pellets are deflected rather than accumulated.

\[
\Delta v=\frac{2\eta wM}{m}
=\frac{2(0.8)(100)(3.75)}{2}
=\boxed{300\ {\rm km/s}}.
\]

Start radially outward on a near-parabolic trajectory at 5 AU, where \(v_0=v_{\rm esc}=18.84\) km/s. For acceleration over 30 days, solar gravity removes at most

\[
\delta v_g\leq\frac{\mu_\odot t}{(5\,{\rm AU})^2}
=0.615\ {\rm km/s}.
\]

Conservatively charging the full 5-AU escape-energy cost afterward gives

\[
v_\infty\gtrsim
\sqrt{(18.84+300-0.615)^2-18.84^2}
=\boxed{317.7\ {\rm km/s}}.
\]

Pellet speeds rise from roughly 119 to 419 km/s; their total launch kinetic energy is approximately **150 GJ**, supplied externally.

**TRL: 2. Key showstopper:** Reliably delivering, ionizing, and deflecting the entire pellet stream across astronomical distances with a 1 kg propulsion package. An unprocessed pellet becomes a destructive impact.

**2. Solar-Wind Bank Shot**

Use a directional plasma-wave “wing” to turn the spacecraft’s velocity relative to the solar wind, extracting energy from the moving plasma. Instead of completing repeated dynamic-soaring loops, execute one controlled turn and disengage—a target-specific adaptation of the [plasma-wave lift mechanism](https://arxiv.org/abs/2211.14643).

**Assumptions:** Total mass 2 kg; initial heliocentric velocity \(v_i=30\) km/s radially outward at 5 AU; locally uniform outward wind \(U=400\) km/s; lift-to-drag ratio \(\Lambda=10\); wind-frame turn angle \(\theta=60^\circ\). With drag opposing relative motion,

\[
w_f=(U-v_i)e^{-\theta/\Lambda}
=(400-30)e^{-(\pi/3)/10}
=333.21\ {\rm km/s}.
\]

Transforming the turned velocity back into the heliocentric frame,

\[
v_f=\sqrt{U^2+w_f^2-2Uw_f\cos\theta}
=\sqrt{400^2+333.21^2-2(400)(333.21)(0.5)}
=371.14\ {\rm km/s},
\]

\[
v_\infty\approx\sqrt{371.14^2-18.84^2}
=\boxed{370.7\ {\rm km/s}}.
\]

The hardware requirement is extreme: assuming \(n=0.2\) protons/cm³ and unit lift coefficient relative to momentum flux, achieving \(a_L=1\) m/s² initially requires

\[
A_{\rm eff}\approx\frac{ma_L}{nm_pw^2}
=\frac{2(1)}{(2\times10^5)(1.67\times10^{-27})(3.70\times10^5)^2}
\approx4.4\times10^{10}\ {\rm m^2},
\]

an effective plasma-wing radius of **118 km**. The turn takes roughly four days; changing wind geometry still requires trajectory integration.

**TRL: 2. Key showstopper:** Demonstrating a controllable plasma interaction region that large, with lift-to-drag ratio 10, using kilogram-scale hardware.

IDEA|Chirped Pellet Slipstream|317.7|2

IDEA|Solar-Wind Bank Shot|370.7|2
