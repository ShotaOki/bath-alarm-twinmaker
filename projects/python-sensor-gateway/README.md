## このアプリでできること

Switch Bot 防水温湿度計の計測データを取得します

## 前提

- Windows 環境であること
- Python 3.8 以上がインストールされていること

## 環境構築

**Step 1: 仮想環境を作ります**

```bash
# コマンドプロンプト：このディレクトリで実行
python -m venv .
```

**Step 2: Python の仮想環境に入ります**

```bash
# コマンドプロンプト：このディレクトリで実行
Scripts\\activate.bat
```

**Step 3: 仮想環境に必要なファイルをインストールします**

```bash
# 仮想環境内で実施
pip install -r requirements.txt
```

**Step 4: src の下に.env ファイルを作ります**

## 実行

**Step 1: （※もし入っていないのなら）Python の仮想環境に入ります**

```bash
# コマンドプロンプト：このディレクトリで実行
Scripts\\activate.bat
```

**Step 2: src ディレクトリに移動して、アプリを実行します**

```bash
# 仮想環境内で実施
cd src

python app.py
```
