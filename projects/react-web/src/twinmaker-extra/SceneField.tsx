import * as THREE from "three";
import { OverrideTagsParameter } from "./DataType";

export interface ISceneFieldInterface {
  overrideTags(rootScene: THREE.Scene): OverrideTagsParameter;
}
