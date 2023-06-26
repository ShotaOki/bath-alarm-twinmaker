import "./App.css";
import { initialize } from "@iot-app-kit/source-iottwinmaker";
import { SceneViewer } from "@iot-app-kit/scene-composer";
import { useStore } from "@iot-app-kit/scene-composer/dist/src/store";
import { useEffect, useMemo, useState } from "react";
import {
  SceneController,
  SceneControllerState,
} from "./twinmaker-extra/SceneController";
import {
  replaceTagToMMD,
  searchTag,
} from "./twinmaker-extra/ComponentController";

function App() {
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

  // 任意のコンポーザーID
  const composerId = "abcdef-eeggff";
  // TwinMaker（クラウド側）の画面構成情報を参照する(※nodeMap＝S3にあるJsonデータのこと)
  const nodeMap = useStore(composerId)((state) => state.document.nodeMap);
  // Jsonのタグ情報に紐づいた3Dオブジェクトを参照する
  const getObject3DBySceneNodeRef = useStore(composerId)(
    (state) => state.getObject3DBySceneNodeRef
  );
  // データ参照変数を取る
  const { dataInput, dataBindingTemplate, getSceneRuleMapById } = useStore(
    composerId
  )((state) => state);

  /** 状態の管理フラグ */
  let [initializedFlag, setInitializedFlag] = useState(
    SceneControllerState.Initialize
  );
  /** TwinMakerをカスタマイズするコントローラー */
  const controller = useMemo(
    () =>
      new SceneController(composerId, {
        /** シーンの初期化時に実行される */
        onInitialize(nodeMap, rootScene) {
          // TwinMakerのタグ名
          const tagName = "Tag";
          // タグをTwinMakerから検索する
          searchTag(nodeMap, tagName, (ref, anchor) => {
            // TwinMakerのタグをMMDモデルに置き換える
            replaceTagToMMD(ref, anchor, getObject3DBySceneNodeRef)
              ?.create({
                rootScene, // ルートになるシーン
                scale: 0.088, // オプション: 表示スケール
                pmxPath: "mmd/UsadaPekora/PMX/UsadaPekora.pmx", // MMDファイル
              })
              .bindOnStateChangeEvent({
                /** タグの状態が変わったのであれば通知を受ける */
                onChangeState(mesh, model, state) {
                  console.log(state);
                  return "mmd/Alicia/MMD Motion/2分ループステップ1.vmd";
                },
              });
          });
        },
      }),
    [getObject3DBySceneNodeRef]
  );

  // nodeMapの更新まではフックできるが、r3fの初期化はフックできない
  // そのため、nodeMap更新からタイマーで500msごとに更新完了を監視する
  useEffect(() => {
    /** 500msごとに状態を監視する */
    const timer = setInterval(() => {
      /** 500msごとに状態を更新する */
      setInitializedFlag(
        controller.exec(initializedFlag, nodeMap, getObject3DBySceneNodeRef)
      );
      controller.execData(dataInput, dataBindingTemplate, getSceneRuleMapById);
    }, 500);
    // useEffectのデストラクタ
    return () => {
      clearInterval(timer);
    };
  }, [
    nodeMap,
    getObject3DBySceneNodeRef,
    initializedFlag,
    controller,
    dataInput,
    dataBindingTemplate,
    getSceneRuleMapById,
  ]);

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
