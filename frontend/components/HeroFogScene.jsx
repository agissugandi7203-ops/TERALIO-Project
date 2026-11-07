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
          <span className="l1">$0 Electricity Bills</span>
          <span>
            <i>for the next</i> <span className="y">7 Years</span>
          </span>
        </h1>

        <div className="dock">
          <TimeToggle />
          <p className="cap">
            Forget the energy market, weather conditions and seasons. Our Smart
            <br />
            Controller guarantees you get no electricity bill for seven years.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HeroFogScene;
