import * as THREE from "three";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";

export function AttachMMDFunction(scene: THREE.Scene) {
  const loader = new MMDLoader();
  const animationLoader = new MMDLoader();
  let mixer: THREE.AnimationMixer;
  loader.loadAsync("mmd/UsadaPekora/PMX/UsadaPekora.pmx").then((mesh) => {
    mesh.scale.set(0.088, 0.088, 0.088);
    mesh.position.set(0, 0.1, 2.0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mixer = new THREE.AnimationMixer(mesh);

    for (let m of mesh.material as THREE.Material[]) {
      let ma: any = m;
      ma.emissive.multiplyScalar(0.1);
      ma.userData.outlineParameters.thickness = 0.001;
      ma.needsUpdate = true;
    }

    scene.add(mesh);

    animationLoader.loadAnimation(
      "mmd/Alicia/MMD Motion/2分ループステップ1.vmd",
      mesh,
      (motion) => {
        mixer.clipAction(motion as THREE.AnimationClip).play();
        console.log(motion);
      }
    );

    // アニメーションを実行する
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);

      var delta = clock.getDelta();
      if (mixer) mixer.update(delta);
    }
    animate();
  });
}
