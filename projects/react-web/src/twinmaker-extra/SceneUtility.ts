import * as THREE from "three";
import { RootState } from "@react-three/fiber";

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

/**
 * R3FのStateを取得する(GLRenderer、Scene、Cameraが取得できる)
 */
export function getState(rootScene: THREE.Scene): RootState {
  const d3fScene: any = rootScene;
  return d3fScene.__r3f.root.getState() as RootState;
}

/**
 * TwinMakerのシーン描画(色の描画)をMMDに合わせて調整する
 */
export function setupSceneForMMD(gl: THREE.WebGLRenderer) {
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  // LinearEncodingにすると色彩が強くなる
  gl.outputEncoding = THREE.LinearEncoding;
  gl.toneMapping = THREE.LinearToneMapping;
}
