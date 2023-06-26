import * as THREE from "three";
import { ISceneNodeInternal } from "@iot-app-kit/scene-composer/dist/src/store";
import { findRootScene, getState, setupSceneForMMD } from "../AppendScene";
import { ISceneFieldInterface } from "./SceneField";

export enum SceneControllerState {
  Initialize,
  Active,
}

export class SceneController {
  private _composerId: string;
  private _interface: ISceneFieldInterface;
  constructor(composeId: string, sceneInterface: ISceneFieldInterface) {
    this._composerId = composeId;
    this._interface = sceneInterface;
  }

  private searchRootScene(
    nodeMap: Record<string, ISceneNodeInternal>,
    getObject3DBySceneNodeRef: (
      ref: string | undefined
    ) => THREE.Object3D<THREE.Event> | undefined
  ) {
    // documentから3Dシーンを取得する
    for (let ref of Object.keys(nodeMap)) {
      // オブジェクトを参照する
      const object3D = getObject3DBySceneNodeRef(ref);
      const rootScene: any = findRootScene(object3D) as THREE.Scene;
      if (rootScene !== null && rootScene !== undefined) {
        return rootScene;
      }
    }
    return undefined;
  }

  /**
   * シーンの状態を更新する
   * @param current
   * @param rootScene
   */
  private onUpdateScene(current: SceneControllerState, rootScene: THREE.Scene) {
    if (current === SceneControllerState.Initialize) {
      // ライティングを設定する
      rootScene.add(new THREE.AmbientLight(0xffffff, 0.7));
      // RendererをMMDに合わせて最適化する
      const { gl } = getState(rootScene);
      setupSceneForMMD(gl);
    }
  }

  /**
   * 実行する
   * @param state
   * @param nodeMap
   * @param getObject3DBySceneNodeRef
   * @returns
   */
  exec(
    state: SceneControllerState,
    nodeMap: Record<string, ISceneNodeInternal>,
    getObject3DBySceneNodeRef: (
      ref: string | undefined
    ) => THREE.Object3D<THREE.Event> | undefined
  ) {
    const rootScene = this.searchRootScene(nodeMap, getObject3DBySceneNodeRef);
    if (rootScene !== undefined) {
      if (state === SceneControllerState.Initialize) {
        this.onUpdateScene(state, rootScene as THREE.Scene);
        this._interface.onInitialize(nodeMap, rootScene as THREE.Scene);
        return SceneControllerState.Active;
      }
    }
    return state;
  }
}
