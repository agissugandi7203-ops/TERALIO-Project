import React, { useEffect, useRef } from 'react';
import { HERO_IMAGES } from '../constants/heroAssets.js';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';
import FogCanvas from './FogCanvas.jsx';
import TimeToggle from './TimeToggle.jsx';

export function HeroFogScene() {
  const setMRef = useRef(null);
  const setNRef = useRef(null);
  const { visibleSet, registerHouseElements } = useAtmosphere();

  useEffect(() => {
    registerHouseElements(setMRef.current, setNRef.current);
    return () => registerHouseElements(null, null);
  }, [registerHouseElements]);

  return (
    <section className="hero" aria-label="Teralio Solar Hero">
      <div className="layer sky">
        <img id="skyM" alt="" src={HERO_IMAGES.morningSky} />
        <img id="skyN" alt="" src={HERO_IMAGES.nightSky} />
      </div>

      <div className="layer home">
        <div
          ref={setMRef}
          className={`set ${visibleSet === 0 ? 'is-on' : ''}`}
          id="setM"
        >
          <div className="layer ground">
            <img alt="" src={HERO_IMAGES.morningGround} />
          </div>
          <img
            className="cut"
            alt="A charcoal farmhouse with solar panels in soft morning light"
            src={HERO_IMAGES.morningCutout}
          />
        </div>

        <div
          ref={setNRef}
          className={`set ${visibleSet === 1 ? 'is-on' : ''}`}
          id="setN"
        >
          <div className="layer ground">
            <img alt="" src={HERO_IMAGES.nightGround} />
          </div>
          <img
            className="cut"
            alt="The same farmhouse at dusk with warm amber windows"
            src={HERO_IMAGES.nightCutout}
          />
        </div>
      </div>

      <div className="tilt" />
      <FogCanvas />

      <div className="ui">
        <h1>
          <span className="l1">Cari Kos Cerdas</span>
          <span>
            <i>berbasis</i> <span className="y">AI Living Hub</span>
          </span>
        </h1>

        <div className="dock">
          <TimeToggle />
          <p className="cap">
            Eksplorasi hunian mahasiswa transparan tanpa perantara. Dilengkapi
            <br />
            analisis total biaya tinggal dan rute jalan kaki Google Maps ke kampus Anda.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HeroFogScene;
