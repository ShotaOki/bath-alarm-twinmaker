import * as THREE from "three";
import { ISceneNodeInternal } from "@iot-app-kit/scene-composer/dist/src/store";
import { findRootScene, getState, setupSceneForMMD } from "./SceneUtility";
import { ISceneFieldInterface } from "./SceneField";
import { ExtraObjectWrapper } from "./ExtraObjectWrapper";
import {
  IDataBindingTemplate,
  IDataInput,
  IRuleBasedMap,
} from "@iot-app-kit/scene-composer";
import {
  dataBindingValuesProvider,
  ruleEvaluator,
} from "@iot-app-kit/scene-composer/dist/src/utils/dataBindingUtils";
import { searchTag } from "./ComponentController";

export enum SceneControllerState {
  Initialize,
  Active,
}

export class SceneController {
  private _composerId: string;
  private _interface: ISceneFieldInterface;
  private _objects: { [key: string]: ExtraObjectWrapper };

  constructor(composeId: string, sceneInterface: ISceneFieldInterface) {
    this._composerId = composeId;
    this._interface = sceneInterface;
    this._objects = {};
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
        const overrides = this._interface.overrideTags(
          rootScene as THREE.Scene
        );
        for (let tag of Object.keys(overrides)) {
          const wrapper = searchTag(nodeMap, tag, overrides[tag]);
          if (wrapper) {
            this._objects[tag] = wrapper;
          }
        }
        return SceneControllerState.Active;
      }
    }
    return state;
  }

  execData(
    dataInput: IDataInput | undefined,
    dataBindingTemplate: IDataBindingTemplate | undefined,
    getSceneRuleMapById: (
      id?: string | undefined
    ) => Readonly<IRuleBasedMap | undefined>
  ) {
    for (let tag of Object.keys(this._objects)) {
      const wrapper = this._objects[tag];
      if (wrapper && wrapper._anchor) {
        const values: Record<string, unknown> = dataBindingValuesProvider(
          dataInput,
          wrapper._anchor.valueDataBinding,
          dataBindingTemplate
        );
        const ruleId = wrapper._anchor.ruleBasedMapId;
        const ruleTarget = ruleEvaluator(
          "normal",
          values,
          getSceneRuleMapById(ruleId)
        );
        if (ruleTarget) {
          wrapper.stateChange(ruleTarget);
        }
      }
    }
  }
}
