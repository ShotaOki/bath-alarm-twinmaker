import "./App.css";
import { initialize } from "@iot-app-kit/source-iottwinmaker";
import { SceneViewer } from "@iot-app-kit/scene-composer";
import { useStore } from "@iot-app-kit/scene-composer/dist/src/store";
import { useEffect, useMemo, useState } from "react";
import {
  SceneController,
  SceneControllerState,
} from "./twinmaker-extra/SceneController";
import { replaceTagToMMD } from "./twinmaker-extra/ComponentController";
import { generateUUID } from "three/src/math/MathUtils";
import { DefaultAnchorStatus } from "@iot-app-kit/scene-composer";
import { stringToDefaultAnchorStatus } from "./twinmaker-extra/TwinMakerTagNames";
import { SystemLoadingStatus } from "./twinmaker-extra/DataType";

function App() {
  // TwinMakerのシーンを読み込む
  const twinmaker = initialize(process.env.REACT_APP_AWS_WORKSPACE_NAME ?? "", {
    awsCredentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ?? "",
    },
    awsRegion: process.env.REACT_APP_AWS_REGION ?? "",
  });
  // 画面情報を読み込む
  const sceneLoader = twinmaker.s3SceneLoader(
    process.env.REACT_APP_AWS_SCENE_NAME ?? ""
  );
  // Viewportを定義する
  const viewport = useMemo(() => {
    return {
      // 10m = 過去10分以内の状態を参照する
      duration: "10m",
    };
  }, []);
  // データソースを読み込む
  // 現行バージョンのiot-app-kitの型定義がおかしいため、anyでラップする
  // また、useMemoでラップしないと大量のリクエスト(数千件。Error 429が出るまで)が飛ぶため、必ずラップする
  const queries: any[] = useMemo(
    () => [
      twinmaker.query.timeSeriesData({
        entityId: process.env.REACT_APP_AWS_ENTITY_ID ?? "",
        componentName: process.env.REACT_APP_COMPONENT_NAME ?? "",
        properties: [
          { propertyName: process.env.REACT_APP_PROPERTY_NAME ?? "" },
        ],
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 任意のコンポーザーID: SceneComposerに対して固定値を指定する
  const composerId = useMemo(() => generateUUID(), []);
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
        /** TwinMakerのタグを上書きする */
        overrideTags(rootScene) {
          return {
            // TwinMakerのタグをMMDモデルに置き換える
            "Hatsune-Miku": (ref, anchor) =>
              replaceTagToMMD(ref, anchor, getObject3DBySceneNodeRef)
                ?.create({
                  rootScene, // ルートになるシーン
                  scale: 0.088, // オプション: 表示スケール
                  pmxPath: "mmd/UsadaPekora/PMX/UsadaPekora.pmx", // MMDファイル
                  motionMap: {
                    // モーションファイル
                    "swing-hand":
                      "mmd/motion/手を振るモーション2/手振_スタンダード(右手).vmd",
                    "swing-hand-body":
                      "mmd/motion/手を振るモーション2/体_スタンダード(右手用).vmd",
                    "swing-hand-face":
                      "mmd/motion/手を振るモーション2/表情.vmd",
                    "motion-waiting":
                      "mmd/motion/5.待機モーション・その他/待機モーション/1.呼吸_(90f_移動なし).vmd",
                  },
                })
                .bindOnStateChangeEvent({
                  /** タグの状態が変わったのであれば通知を受ける */
                  onChangeState(mesh, model, state) {
                    // 初期化実行の時は、モーションを実行しない
                    if (state === SystemLoadingStatus.Init) {
                      return [];
                    }
                    // 今のタグの状態に応じて、モーションを変更する
                    switch (stringToDefaultAnchorStatus(state)) {
                      case DefaultAnchorStatus.Error:
                        return [
                          "swing-hand",
                          "swing-hand-body",
                          "swing-hand-face",
                        ];
                      default: // DefaultAnchorStatus.Info
                        // return "mmd/Alicia/MMD Motion/2分ループステップ5.vmd";
                        return ["motion-waiting"];
                    }
                  },
                }),
          };
        },
      }),
    [composerId, getObject3DBySceneNodeRef]
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
        queries={queries}
        viewport={viewport}
        activeCamera="Camera1"
      />
    </div>
  );
}

export default App;
