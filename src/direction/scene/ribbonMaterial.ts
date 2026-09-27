import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three'

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
      uTime: { value: 0 },
      uColor: { value: new Color('#5CE8FF') },
      uHot: { value: new Color('#D8FBFF') },
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
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uHot;
      varying float vT;
      varying float vSide;
      void main() {
        if (vT > uDraw || uDraw <= 0.0) discard;
        float edge = 1.0 - abs(vSide);
        float core = pow(edge, 2.5);
        float chevron = 0.75 + 0.25 * step(0.5, fract(vT * 180.0 + abs(vSide) * 0.6 - uTime * 0.6));
        float head = smoothstep(uDraw - 0.035, uDraw, vT);
        vec3 c = uColor * (0.35 + 2.2 * core) * chevron + uHot * head * 3.0 * core;
        float a = smoothstep(0.0, 0.25, edge);
        gl_FragColor = vec4(c * a, a);
      }`,
  })
}
