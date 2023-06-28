import {
  IAnchorComponent,
  KnownComponentType,
} from "@iot-app-kit/scene-composer";
import { ISceneNodeInternal } from "@iot-app-kit/scene-composer/dist/src/store";
import { MMDModelWrapper } from "./MMDModelWrapper";
import { SearchTagsCallback } from "./DataType";

/**
 * タグを検索する
 *
 * @param nodeMap ノードの一覧（TwinMakerが管理する画面の構成情報）
 * @param requiredName 必要なタグ名
 * @param callback タグが見つかった時に返却するコールバック
 * @returns ExtraObjectWrapperのインスタンス
 */
export function searchTag(
  nodeMap: Record<string, ISceneNodeInternal>,
  requiredName: string,
  callback: SearchTagsCallback
) {
  // TwinMakerの構成情報をすべてさらう
  for (let ref of Object.keys(nodeMap)) {
    const node = nodeMap[ref];
    // タグ名が一致するのなら処理をする
    if (node.name === requiredName) {
      return executeIfNodeIsTag(ref, node, callback);
    }
  }
  return undefined;
}

/**
 * もしタグ情報が一致するのならコールバック関数を実行する
 *
 * @param ref タグオブジェクトのRef ID
 * @param node TwinMakerが管理する構成情報
 * @param callback タグが見つかった時に返却するコールバック
 * @returns ExtraObjectWrapperのインスタンス
 */
function executeIfNodeIsTag(
  ref: string,
  node: ISceneNodeInternal,
  callback: SearchTagsCallback
) {
  // ノードの詳細情報を参照する
  const type = node.components.map((component) => component.type);
  // コンポーネントがタグであるとき
  if (type.includes(KnownComponentType.Tag)) {
    // タグのコンポーネントには、タグ情報、オーバレイ情報などがあるため、タグ情報だけをフィルタして返す
    for (let component of node.components) {
      if (component.type === KnownComponentType.Tag) {
        // タグの詳細情報を渡す
        return callback(ref, component as IAnchorComponent);
      }
    }
  }
  return undefined;
}

/**
 * TwinMakerのタグオブジェクトをMMDに置き換える
 *
 * @param ref タグオブジェクトのRef ID
 * @param anchor タグオブジェクトのアンカー情報(位置、色、アイコン情報などが入っている)
 * @param getObject3DBySceneNodeRef 関数: TwinMakerのノード情報からThree.jsのオブジェクトを参照する関数
 * @returns MMDの管理クラス
 */
export function replaceTagToMMD(
  ref: string,
  anchor: IAnchorComponent,
  getObject3DBySceneNodeRef: (
    ref: string | undefined
  ) => THREE.Object3D<THREE.Event> | undefined
) {
  const tag = getObject3DBySceneNodeRef(ref);
  if (tag) {
    tag.visible = false;
    return new MMDModelWrapper(tag.position, tag.rotation, tag.scale, anchor);
  }
  return undefined;
}
