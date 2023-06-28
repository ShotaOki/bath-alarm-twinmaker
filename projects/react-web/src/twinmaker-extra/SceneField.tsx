import * as THREE from "three";
import { OverrideTagsParameter } from "./DataType";

/**
 * SceneControllerの更新イベント
 */
export interface ISceneFieldInterface {
  /**
   * 初期化が完了して、タグを更新する(初期化完了時に1度だけ呼ばれる)
   * @param rootScene ルートになるThree.jsのシーンインスタンス
   */
  overrideTags(rootScene: THREE.Scene): OverrideTagsParameter;
}
