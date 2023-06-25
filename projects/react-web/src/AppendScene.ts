import * as THREE from "three";

/** ルートシーンを取得する */
export function findRootScene(target: THREE.Object3D<THREE.Event> | undefined) {
  if (target === undefined) {
    return undefined;
  }
  let current: THREE.Object3D<THREE.Event> = target;
  while (current.parent !== undefined && current.parent !== null) {
    current = current.parent as THREE.Object3D<THREE.Event>;
  }
  return current;
}
