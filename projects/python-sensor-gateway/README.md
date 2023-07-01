## このアプリでできること

Switch Bot 防水温湿度計の計測データを取得して、SiteWise に転送します

AWS CLI の認証情報をあらかじめ設定しておいてください。

## 前提

- Windows 環境であること
- Python 3.8 以上がインストールされていること

## 環境構築

**Step 1: 仮想環境を作ります**

```bat
REM コマンドプロンプト：このディレクトリで実行
python -m venv .
```

**Step 2: Python の仮想環境に入ります**

```bat
REM コマンドプロンプト：このディレクトリで実行
Scripts\activate.bat
```

**Step 3: 仮想環境に必要なファイルをインストールします**

```bat
REM 仮想環境内で実施
pip install -r requirements.txt
```

**Step 4: src の下に.env ファイルを作ります**

## 実行

**Step 1: （※もし入っていないのなら）Python の仮想環境に入ります**

```bat
REM コマンドプロンプト：このディレクトリで実行
Scripts\activate.bat
```

**Step 2: src ディレクトリに移動して、アプリを実行します**

```bat
REM 仮想環境内で実施
cd src

python app.py
```

**デバッグ用: 以下のように書くと、SiteWise に 1 件のデータを送信します**

※`99.9`の部分は任意の数字です

```bat
REM 仮想環境内で実施
cd src

python app.py --value 99.9
```
