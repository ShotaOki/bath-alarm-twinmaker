# bath-alarm-twinmaker

## このプロジェクトについて

このプロジェクトでは、SwichBot の防水温湿度センサーのデータを、iot-app-kit（TwinMaker）に連携するソリューションを提供します。

また、iot-app-kit についての、以下の拡張機能を持ちます。

- TwinMaker で構築した 3D シーンの`タグ`を MMD に置き換える機能を持ちます。
- `タグ`の色変えのイベントを受け取って、MMD のモーション変更を行うことができます。

## プロジェクトの構成

- projects/python-sensor-gateway  
  SiteWise に対してデータを送信するクライアントです
- projects/react-web  
  iot-app-kit の React アプリケーションです

## プロジェクトの前提

Windows での開発を想定しています。

利用規約の事情から、MMD モデル、モーションは git の管理対象に含めていません。  
プロジェクトを clone された方が、正規の方法で MMD モデルをダウンロードして利用していただきますよう、お願いいたします。

### デフォルトの設定

- TwinMaker のタグの名称は、`Usada-Pekora`にしています。
- モーション、リソースは、public ディレクトリに配置します。

## セットアップ

認証情報、接続先情報の設定のため、各プロジェクトに.env ファイルが必要です。

設定する内容は projects 以下の各フォルダにある README を確認してください。

## ライセンス

ライセンスは MIT です。
