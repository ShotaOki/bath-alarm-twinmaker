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
  /** 状態変更イベント: 状態が変更された */
  onChangeState: (
    mesh: MMDMesh,
    model: MMDModelWrapper,
    state: string | number
  ) => string;
}

export class MMDModelWrapper extends ExtraObjectWrapper {
  // MMDモデル
  private _mesh?: MMDMesh;
  // 状態変更イベント
  private _stateChange?: StateChangeEvent;
  // アニメーションを管理するミキサー
  private _mixier?: THREE.AnimationMixer;

  /**
   * 初期化する
   *
   * @param parameter モデルのパラメータ
   * @returns
   */
  create(parameter: MMDModelParameter) {
    // ローダーを作成する
    const loader = new MMDLoader();
    // 自身のインスタンスの参照を保持
    const that = this;
    /** 非同期でMMDモデルを取得する */
    loader.loadAsync(parameter.pmxPath).then((mesh) => {
      // 位置情報、大きさ、回転角度をTwinMakerのタグに合わせる
      mesh.position.copy(this._position);
      mesh.rotation.copy(this._rotate);
      if (parameter.scale !== undefined) {
        mesh.scale.set(parameter.scale, parameter.scale, parameter.scale);
      } else {
        mesh.scale.copy(this._scale);
      }
      // 影を表示する
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // アニメーションミキサーを初期化する
      this._mixier = new THREE.AnimationMixer(mesh);

      // 発光設定、アウトライン設定をTwinMakerに合わせて補正する
      for (let m of mesh.material as THREE.Material[]) {
        let ma: any = m;
        ma.emissive.multiplyScalar(0.1);
        ma.userData.outlineParameters.thickness = 0.001;
        ma.needsUpdate = true;
      }

      // 読み込んだMMDモデルを表示する
      parameter.rootScene.add(mesh);
      this._mesh = mesh;

      // 状態を初期化する
      that.stateChange("init");

      // アニメーションを実行する
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);

        // アニメーションの状態を更新
        const delta = clock.getDelta();
        if (that._mixier) that._mixier.update(delta);
      }
      animate();
    });

    return this;
  }

  /**
   * 状態の変更通知を受け取る
   *
   * @param newState 次のオブジェクトの状態
   */
  protected onChangeState(newState: string | number) {
    if (this._stateChange && this._mesh && this._mixier) {
      const animationLoader = new MMDLoader();
      const animationName = this._stateChange.onChangeState(
        this._mesh!,
        this,
        newState
      );
      // もしアニメーションの戻り値がないのならアニメーションを終了する
      if (!(animationName && animationName.length)) {
        if (this._mixier) {
          this._mixier.stopAllAction();
          return;
        }
      }
      // 戻り値で受け取ったアニメーションを再生する
      animationLoader.loadAnimation(animationName, this._mesh, (motion) => {
        if (this._mixier) {
          this._mixier.stopAllAction();
          this._mixier.clipAction(motion as THREE.AnimationClip).play();
        }
      });
    }
  }

  /**
   * 状態変更イベントをバインドする
   *
   * @param stateChange 状態変更イベント
   * @returns 自身のオブジェクト（チェイン可能）
   */
  bindOnStateChangeEvent(stateChange: StateChangeEvent) {
    this._stateChange = stateChange;
    return this;
  }
}
