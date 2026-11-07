import React, { useEffect, useRef, useState } from 'react';
import { Link } from '../context/RouterContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { BRAND, MEDIA_ASSETS, NAV_LINKS } from '../data/teralioData.js';
import BrandLogo from './BrandLogo.jsx';
import { MobileNavDrawer } from './Header.jsx';
import { MenuIcon } from './Icons.jsx';

const VERTEX_SHADER = `#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 R;uniform float T,S,K;out vec4 O;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);p=mat2(.8,.6,-.6,.8)*p+5.3;for(int i=0;i<5;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}
void main(){
  vec2 uv=gl_FragCoord.xy/R;uv.y=1.-uv.y;
  float asp=R.x/R.y;vec2 p=vec2(uv.x*asp,uv.y);
  float t=T*.05;
  vec2 w=vec2(fbm(p*1.3+vec2(t,-t*.6)),fbm(p*1.3+vec2(-t*.8,t)+7.));
  float d=fbm(p*1.9+w*1.7+vec2(t*1.6,-t*1.1+S*.5));
  float e=fbm(p*.9-w+vec2(-t,t*.5)+3.);
  float low=smoothstep(.70,1.04,uv.y+(d-.5)*.34);
  float side=smoothstep(.2,.0,uv.x+(e-.5)*.28)+smoothstep(.8,1.,uv.x+(e-.5)*.28);
  side*=smoothstep(.25,.6,uv.y)*.2;
  float wisps=smoothstep(.5,.78,d)*smoothstep(.22,.5,uv.y)*smoothstep(.86,.6,uv.y)*.18;
  float rest=clamp(low+side+wisps,0.,1.);
  float front=1.02-S*.68;
  float rise=smoothstep(front-.02,front+.26,uv.y+(d-.5)*.5);
  float haze=S*(.3+.46*d);
  float a=clamp(max(rest,max(rise*.97,haze)),0.,1.);
  vec3 dayA=vec3(.97,.93,.84),dayB=vec3(.79,.78,.71);
  vec3 nitA=vec3(.40,.45,.57),nitB=vec3(.15,.19,.29);
  vec3 c=mix(mix(dayB,dayA,d*1.15),mix(nitB,nitA,d*1.1),K);
  float porch=exp(-dot((uv-vec2(.72,.74))*vec2(1.7,2.6),(uv-vec2(.72,.74))*vec2(1.7,2.6))*3.2);
  c=mix(c,vec3(.86,.55,.27),K*porch*.42*(1.-S));
  O=vec4(c*a,a);
}`;

export function HeroFogScene() {
  const canvasRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isNight, visibleSet, pickTimeOfDay, registerGlSubscriber } = useTheme();
  const { hero } = MEDIA_ASSETS;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;

    let gl = null;
    try {
      gl = cv.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setHasWebGL(false);
      return undefined;
    }

    setHasWebGL(true);

    const compileShader = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    gl.useProgram(pr);

    const U = {
      R: gl.getUniformLocation(pr, 'R'),
      T: gl.getUniformLocation(pr, 'T'),
      S: gl.getUniformLocation(pr, 'S'),
      K: gl.getUniformLocation(pr, 'K'),
    };

    const size = () => {
      const iw = window.innerWidth || 1280;
      const ih = window.innerHeight || 800;
      const w = Math.round(Math.min(iw, 960));
      const h = Math.round((w * ih) / iw);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    window.addEventListener('resize', size);
    size();

    const unsubscribe = registerGlSubscriber((now, s, k) => {
      gl.useProgram(pr);
      gl.uniform2f(U.R, cv.width, cv.height);
      gl.uniform1f(U.T, now / 1000);
      gl.uniform1f(U.S, s);
      gl.uniform1f(U.K, k);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', size);
      gl.deleteProgram(pr);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [registerGlSubscriber]);

  return (
    <>
      <section className="hero" data-testid="teralio-fog-hero">
        <div className="layer sky">
          <img id="skyM" alt="" src={hero.skyMorning} />
          <img id="skyN" alt="" src={hero.skyNight} />
        </div>

        <div className="layer home">
          <div className={`set ${visibleSet === 0 ? 'is-on' : ''}`} id="setM">
            <div className="layer ground">
              <img alt="" src={hero.groundMorning} />
            </div>
            <img
              className="cut"
              alt="A charcoal farmhouse with solar panels in soft morning light"
              src={hero.cutoutMorning}
            />
          </div>

          <div className={`set ${visibleSet === 1 ? 'is-on' : ''}`} id="setN">
            <div className="layer ground">
              <img alt="" src={hero.groundNight} />
            </div>
            <img
              className="cut"
              alt="The same farmhouse at dusk with warm amber windows"
              src={hero.cutoutNight}
            />
          </div>
        </div>

        <div className="tilt" />
        <canvas id="fog" ref={canvasRef} aria-hidden="true" />
        {!hasWebGL && <div className="fog-fallback" aria-hidden="true" />}

        <div className="ui">
          <header className="bar">
            <Link className="logo" to="/" aria-label={BRAND.name}>
              <BrandLogo />
              {BRAND.name}
            </Link>

            <ul className="links">
              {NAV_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>

            <div className="side">
              <Link className="side-link" to="/customers">
                Customers
              </Link>
              <Link className="side-link" to="/signup">
                Sign Up
              </Link>
              <Link className="cta" to="/quote">
                Get an Instant Quote
              </Link>
              <button
                type="button"
                className="hero-menu-btn"
                aria-label="Open navigation menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon />
              </button>
            </div>
          </header>

          <h1>
            <span className="l1">$0 Electricity Bills</span>
            <span>
              <i>for the next</i> <span className="y">7 Years</span>
            </span>
          </h1>

          <div className="dock">
            <div className="toggle" role="group" aria-label="Time of day">
              <button
                id="bm"
                type="button"
                aria-pressed={!isNight}
                onClick={() => pickTimeOfDay(0)}
              >
                <b>Morning</b>
                <small>$0 for Electricity</small>
              </button>
              <button
                id="bn"
                type="button"
                aria-pressed={isNight}
                onClick={() => pickTimeOfDay(1)}
              >
                <b>Night</b>
                <small>$0 for Electricity</small>
              </button>
            </div>

            <p className="cap">
              Forget the energy market, weather conditions and seasons. Our Smart
              <br />
              Controller guarantees you get no electricity bill for seven years.
            </p>
          </div>
        </div>
      </section>

      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

export default HeroFogScene;
