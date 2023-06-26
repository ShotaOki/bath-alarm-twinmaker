import { ISceneNodeInternal } from "@iot-app-kit/scene-composer/dist/src/store";
import * as THREE from "three";

export interface ISceneFieldInterface {
  onInitialize(
    nodeMap: Record<string, ISceneNodeInternal>,
    rootScene: THREE.Scene
  ): void;
}
