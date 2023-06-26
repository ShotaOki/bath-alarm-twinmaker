import {
  IAnchorComponent,
  KnownComponentType,
} from "@iot-app-kit/scene-composer";
import { ISceneNodeInternal } from "@iot-app-kit/scene-composer/dist/src/store";
import { MMDModelWrapper } from "./MMDModelWrapper";

export function searchTag(
  nodeMap: Record<string, ISceneNodeInternal>,
  requiredName: string,
  callback: (ref: string, anchor: IAnchorComponent) => void
) {
  for (let ref of Object.keys(nodeMap)) {
    const node = nodeMap[ref];
    // タグ名が一致するのなら処理をする
    if (node.name === requiredName) {
      executeIfNodeIsTag(ref, node, callback);
    }
  }
}

function executeIfNodeIsTag(
  ref: string,
  node: ISceneNodeInternal,
  callback: (ref: string, anchor: IAnchorComponent) => void
) {
  const type = node.components.map((component) => component.type);
  // コンポーネントがタグであるとき
  if (type.includes(KnownComponentType.Tag)) {
    for (let component of node.components) {
      if (component.type === KnownComponentType.Tag) {
        // タグの詳細情報を渡す
        callback(ref, component as IAnchorComponent);
        return;
      }
    }
  }
}

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
