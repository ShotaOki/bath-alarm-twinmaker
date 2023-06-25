import "./App.css";
import { initialize } from "@iot-app-kit/source-iottwinmaker";
import { SceneViewer } from "@iot-app-kit/scene-composer";
import { useStore } from "@iot-app-kit/scene-composer/dist/src/store";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { findRootScene } from "./AppendScene";
import { AttachMMDFunction } from "./MMDScene";

function App() {
  console.log(process.env);
  // TwinMakerのシーンを読み込む
  const sceneLoader = initialize(
    process.env.REACT_APP_AWS_WORKSPACE_NAME ?? "",
    {
      awsCredentials: {
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ?? "",
      },
      awsRegion: process.env.REACT_APP_AWS_REGION ?? "",
    }
  ).s3SceneLoader(process.env.REACT_APP_AWS_SCENE_NAME ?? "");

  // 初期化フラグ
  const [initializedFlag, setInitializedFlag] = useState(false);
  // 任意のコンポーザーID
  const composerId = "abcdef-eeggff";
  // TwinMaker（クラウド側）の画面構成情報を参照する(※nodeMap＝S3にあるJsonデータのこと)
  const nodeMap = useStore(composerId)((state) => state.document.nodeMap);
  // Jsonのタグ情報に紐づいた3Dオブジェクトを参照する
  const getObject3DBySceneNodeRef = useStore(composerId)(
    (state) => state.getObject3DBySceneNodeRef
  );
  // nodeMapの更新まではフックできるが、r3fの初期化はフックできない
  // そのため、nodeMap更新からタイマーで500msごとに更新完了を監視する
  useEffect(() => {
    const timer = setInterval(() => {
      // 初期化済みなら処理をしない
      if (initializedFlag) {
        return;
      }
      // documentから3Dシーンを取得する
      for (let ref of Object.keys(nodeMap)) {
        // オブジェクトを参照する
        const object3D = getObject3DBySceneNodeRef(ref);
        const rootScene: any = findRootScene(object3D) as THREE.Scene;
        if (rootScene !== null && rootScene !== undefined) {
          // 初期化済みフラグを立てる
          setInitializedFlag(true);
          const { gl } = rootScene.__r3f.root.getState();
          const _gl: THREE.WebGLRenderer = gl;
          _gl.shadowMap.enabled = true;
          _gl.shadowMap.type = THREE.PCFSoftShadowMap;
          // LinearEncodingにすると色彩が強くなる
          _gl.outputEncoding = THREE.LinearEncoding;
          _gl.toneMapping = THREE.LinearToneMapping;

          // シーンに3Dモデルをアタッチする
          AttachMMDFunction(rootScene);
          return;
        }
      }
    }, 500);
    // useEffectのデストラクタ
    return () => {
      clearInterval(timer);
    };
  }, [nodeMap, getObject3DBySceneNodeRef, initializedFlag]);

  return (
    <div className="App">
      <SceneViewer
        sceneComposerId={composerId}
        sceneLoader={sceneLoader}
        activeCamera="Camera1"
      />
    </div>
  );
}

export default App;
