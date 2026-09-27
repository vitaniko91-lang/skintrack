import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Vector2 } from 'three'

/**
 * Светящаяся лента: яркое ядро, мягкие края, бегущие поперечные «ёлочки» подъёма
 * (след кантов на скин-треке) и горячая голова на фронте рисования.
 * toneMapped=false — значения выше 1 уходят в Bloom.
 */
export function makeRibbonMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    uniforms: {
      uDraw: { value: 0 },
      uStart: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: new Color('#5CE8FF') },
      uHot: { value: new Color('#D8FBFF') },
      /** участок ≥35° по настоящей сетке крутизны (доли длины) и сила его подсветки */
      uHaz: { value: new Vector2(0, 0) },
      uHazK: { value: 0 },
      uHazColor: { value: new Color('#FF9A1F') },
    },
    vertexShader: /* glsl */ `
      attribute float aT;
      attribute float aSide;
      varying float vT;
      varying float vSide;
      void main() {
        vT = aT;
        vSide = aSide;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw;
      uniform float uStart;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uHot;
      uniform vec2 uHaz;
      uniform float uHazK;
      uniform vec3 uHazColor;
      varying float vT;
      varying float vSide;
      void main() {
        if (vT > uDraw || vT < uStart || uDraw <= uStart) discard;
        float edge = 1.0 - abs(vSide);
        float core = pow(edge, 2.5);
        float chevron = 0.75 + 0.25 * step(0.5, fract(vT * 180.0 + abs(vSide) * 0.6 - uTime * 0.6));
        float head = smoothstep(uDraw - 0.035, uDraw, vT);
        // опасный участок: цвет шкалы опасности (данные безопасности, не бренд), мягкие края
        float haz = uHazK * smoothstep(uHaz.x - 0.006, uHaz.x + 0.004, vT) * (1.0 - smoothstep(uHaz.y - 0.004, uHaz.y + 0.006, vT));
        vec3 base = mix(uColor, uHazColor, haz);
        float pulse = 1.0 + haz * 0.35 * sin(uTime * 3.0 - vT * 90.0);
        vec3 c = base * (0.35 + 2.2 * core) * chevron * pulse + uHot * head * 3.0 * core;
        float a = smoothstep(0.0, 0.25, edge);
        gl_FragColor = vec4(c * a, a);
      }`,
  })
}
