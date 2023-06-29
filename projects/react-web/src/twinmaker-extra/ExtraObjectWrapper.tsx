import { IAnchorComponent } from "@iot-app-kit/scene-composer";
import * as THREE from "three";
import { SystemLoadingStatus } from "./DataType";

export class ExtraObjectWrapper {
  // 表示位置
  protected _position: THREE.Vector3;
  // 回転角度
  protected _rotate: THREE.Euler;
  // 表示スケール
  protected _scale: THREE.Vector3;
  // タグの詳細情報
  public _anchor: IAnchorComponent;
  // クラウドと同期したモデルの状態
  protected _state: string | number;
  // 読み込み完了フラグ
  protected _flagLoaded: boolean;

  constructor(
    position: THREE.Vector3,
    rotate: THREE.Euler,
    scale: THREE.Vector3,
    anchor: IAnchorComponent
  ) {
    this._position = position;
    this._rotate = rotate;
    this._scale = scale;
    this._anchor = anchor;
    this._state = "";
    this._flagLoaded = false;
  }

  /** 読み込みの完了フラグ */
  get isLoaded() {
    return this._flagLoaded;
  }

  /**
   * 状態を変更する
   * @param newState 次の状態
   */
  stateChange(newState: string | number) {
    // 同じ状態であれば処理をしない
    if (this._state === newState) {
      return;
    }
    // 初期化完了は読み込みの完了前であっても受け入れる
    if (newState === SystemLoadingStatus.Init) {
      this._state = newState;
      return;
    }
    // 読み込みが完了していないのなら状態を更新しない
    if (!this._flagLoaded) {
      return;
    }
    // 状態を更新する
    this._state = newState;
    this.onChangeState(newState);
  }

  /**
   * 子クラスで実装: イベント通知関数
   * @param newState 次の状態
   */
  protected onChangeState(newState: string | number) {}
}
