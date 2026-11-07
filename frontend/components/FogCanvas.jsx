import React, { useEffect, useRef } from 'react';
import {
  FOG_FRAGMENT_SHADER,
  FOG_VERTEX_SHADER,
  HERO_TIMING,
} from '../constants/heroAssets.js';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';

export function FogCanvas() {
  const canvasRef = useRef(null);
  const { registerFogRenderer } = useAtmosphere();

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
      registerFogRenderer(null);
      return undefined;
    }

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, FOG_VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FOG_FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      registerFogRenderer(null);
      return undefined;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const uniforms = {
      R: gl.getUniformLocation(program, 'R'),
      T: gl.getUniformLocation(program, 'T'),
      S: gl.getUniformLocation(program, 'S'),
      K: gl.getUniformLocation(program, 'K'),
    };

    const updateCanvasSize = () => {
      const safeInnerW = Math.max(window.innerWidth || 1280, 1);
      const safeInnerH = Math.max(window.innerHeight || 800, 1);
      const w = Math.round(Math.min(safeInnerW, HERO_TIMING.MAX_FOG_WIDTH));
      const h = Math.round((w * safeInnerH) / safeInnerW);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    registerFogRenderer((nowMs, surge, nightAmount) => {
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(uniforms.R, cv.width, cv.height);
      gl.uniform1f(uniforms.T, nowMs / 1000);
      gl.uniform1f(uniforms.S, surge);
      gl.uniform1f(uniforms.K, nightAmount);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    return () => {
      registerFogRenderer(null);
      window.removeEventListener('resize', updateCanvasSize);
      if (vao) gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [registerFogRenderer]);

  return <canvas id="fog" ref={canvasRef} aria-hidden="true" />;
}

export default FogCanvas;
