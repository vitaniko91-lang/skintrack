import { Color, ShaderMaterial } from 'three'
import { SLOPE_BANDS } from '../terrain/slope'

export interface TerrainUniforms {
  uRise: { value: number }
  uContours: { value: number }
  uSlope: { value: number }
}

const vertex = /* glsl */ `
  attribute float aHeight;
  attribute float aSlope;
  uniform float uRise;
  varying float vH;
  varying float vSlope;
  varying float vX;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 p = position;
    p.y *= mix(0.015, 1.0, uRise);
    vH = aHeight;
    vSlope = aSlope;
    vX = uv.x;
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal); // мировое пространство: свет СЗ не ездит за камерой
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uContours;
  uniform float uSlope;
  uniform vec3 uGround;
  uniform vec3 uLine;
  uniform vec3 uBand1;
  uniform vec3 uBand2;
  uniform vec3 uBand3;
  uniform vec3 uBand4;
  uniform vec3 uBg;
  varying float vH;
  varying float vSlope;
  varying float vX;
  varying vec2 vUv;
  varying vec3 vNormal;

  const float INTERVAL = 1.0 / 32.0; // ≈ 70 м по вертикали на этой горе

  void main() {
    // Свет: одна сторона, мягко — рельеф читается, но сцену держат изолинии.
    float light = clamp(dot(normalize(vNormal), normalize(vec3(-0.4, 0.8, 0.3))), 0.0, 1.0);
    vec3 color = uGround * (0.55 + 0.9 * light);

    // Слой крутизны — тонировка под изолиниями: волна с запада на восток,
    // края полос размыты на ~1°, чтобы не было крапа.
    float bandMask = smoothstep(29.5, 30.5, vSlope);
    vec3 band = mix(uBand1, uBand2, smoothstep(34.5, 35.5, vSlope));
    band = mix(band, uBand3, smoothstep(39.5, 40.5, vSlope));
    band = mix(band, uBand4, smoothstep(44.5, 45.5, vSlope));
    float sweep = 1.0 - smoothstep(uSlope * 1.2 - 0.12, uSlope * 1.2, vX);
    color = mix(color, band, bandMask * sweep * 0.38);

    // Изолинии поверх крутизны: толщина в пикселях через fwidth, появляются снизу вверх.
    float f = vH / INTERVAL;
    float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-4);
    float line = 1.0 - smoothstep(0.0, 1.2, d);
    float major = 1.0 - step(0.5, mod(floor(f + 0.5), 5.0)); // каждая 5-я линия — основная
    float reveal = smoothstep(uContours * 1.08 - 0.08, uContours * 1.08 - 0.02, vH);
    float lineAlpha = line * (1.0 - reveal) * mix(0.35, 0.85, major);
    color = mix(color, uLine, lineAlpha);

    // Край тайла растворяется в фоне — не срезанная плита, а гора на земле.
    float edge = smoothstep(0.5, 0.36, length(vUv - 0.5));
    color = mix(uBg, color, edge);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

export function createTerrainMaterial(): ShaderMaterial & { uniforms: TerrainUniforms } {
  const [b1, b2, b3, b4] = SLOPE_BANDS.map((b) => new Color(b.color))
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uRise: { value: 0 },
      uContours: { value: 0 },
      uSlope: { value: 0 },
      uGround: { value: new Color('#131c25') },
      uLine: { value: new Color('#bfe0ee') },
      uBg: { value: new Color('#0a0f15') }, // = фон канваса; Color хранит линейное значение
      uBand1: { value: b1 },
      uBand2: { value: b2 },
      uBand3: { value: b3 },
      uBand4: { value: b4 },
    },
  }) as ShaderMaterial & { uniforms: TerrainUniforms }
}
