import { ExtraObjectWrapper } from "./ExtraObjectWrapper";
import * as THREE from "three";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";

export interface MMDModelParameter {
  rootScene: THREE.Scene;
  scale?: number;
  pmxPath: string;
}
type MMDMesh = THREE.SkinnedMesh<
  THREE.BufferGeometry,
  THREE.Material | THREE.Material[]
>;

export interface StateChangeEvent {
  onChangeState: (
    mesh: MMDMesh,
    model: MMDModelWrapper,
    state: string
  ) => string;
}

export class MMDModelWrapper extends ExtraObjectWrapper {
  private _mesh?: MMDMesh;
  private _stateChange?: StateChangeEvent;
  private _mixier?: THREE.AnimationMixer;

  create(parameter: MMDModelParameter) {
    const loader = new MMDLoader();
    const that = this;
    loader.loadAsync(parameter.pmxPath).then((mesh) => {
      mesh.position.copy(this._position);
      mesh.rotation.copy(this._rotate);
      if (parameter.scale !== undefined) {
        mesh.scale.set(parameter.scale, parameter.scale, parameter.scale);
      } else {
        mesh.scale.copy(this._scale);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this._mixier = new THREE.AnimationMixer(mesh);

      for (let m of mesh.material as THREE.Material[]) {
        let ma: any = m;
        ma.emissive.multiplyScalar(0.1);
        ma.userData.outlineParameters.thickness = 0.001;
        ma.needsUpdate = true;
      }

      parameter.rootScene.add(mesh);
      this._mesh = mesh;

      that.stateChange("current");

      // アニメーションを実行する
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);

        var delta = clock.getDelta();
        if (that._mixier) that._mixier.update(delta);
      }
      animate();
    });

    return this;
  }

  stateChange(newState: string) {
    if (this._stateChange && this._mesh && this._mixier) {
      const animationLoader = new MMDLoader();
      const animationName = this._stateChange.onChangeState(
        this._mesh!,
        this,
        newState
      );
      animationLoader.loadAnimation(animationName, this._mesh, (motion) => {
        if (this._mixier) {
          this._mixier.stopAllAction();
          this._mixier.clipAction(motion as THREE.AnimationClip).play();
        }
      });
    }
  }

  bindOnStateChangeEvent(stateChange: StateChangeEvent) {
    this._stateChange = stateChange;
    return this;
  }
}
