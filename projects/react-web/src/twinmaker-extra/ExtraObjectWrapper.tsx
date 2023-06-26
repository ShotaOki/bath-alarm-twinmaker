import { IAnchorComponent } from "@iot-app-kit/scene-composer";
import * as THREE from "three";
import { SceneController } from "./SceneController";

export class ExtraObjectWrapper {
  protected _position: THREE.Vector3;
  protected _rotate: THREE.Euler;
  protected _scale: THREE.Vector3;
  protected _anchor: IAnchorComponent;
  protected _state: string | number;

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
  }

  get anchor() {
    return this._anchor;
  }

  observeController(controller: SceneController) {
    controller.addSubscribe(this);
  }

  stateChange(newState: string | number) {
    if (this._state === newState) {
      return;
    }
    this._state = newState;
    this.onChangeState(newState);
  }

  onChangeState(newState: string | number) {}
}
