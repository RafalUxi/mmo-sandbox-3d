import { MeshReflectorMaterial } from "@react-three/drei";

export function MirrorTest(props: React.ComponentProps<"mesh">) {
  return (
    <mesh {...props}>
      <planeGeometry />
      <MeshReflectorMaterial
        blur={[0, 0]} // Blur ground reflections (width, height), 0 skips blur
        mixBlur={0} // How much blur mixes with surface roughness (default = 1)
        mixStrength={1} // Strength of the reflections
        mixContrast={1} // Contrast of the reflections
        roughness={0}
        resolution={512} // Off-buffer resolution, lower=faster, higher=better quality, slower
        mirror={1} // Mirror environment, 0 = texture colors, 1 = pick up env colors
        depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
        minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
        maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
        depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
        distortion={1} // Amount of distortion based on the distortionMap texture
      />
    </mesh>
  );
}