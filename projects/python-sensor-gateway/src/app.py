from pydantic import BaseModel, BaseSettings, Field
import asyncio
from argparse import ArgumentParser
import boto3
from bleak import BleakScanner
from dotenv import load_dotenv
import time
from uuid import uuid4

# 環境変数をENVから読み込む
load_dotenv()


class Config(BaseSettings):
    """
    環境変数から設定を読み出す
    """

    # MAC_ADDRESS : .envファイルにMAC_ADDRESS=の形式で指定する
    mac_address: str = Field("xx:xx:xx:xx:xx:xx")
    # ASSET_ID : .envファイルにASSET_ID=の形式で指定。SiteWiseのアセットID
    asset_id: str = Field("-")
    # PROPERTY_ID : .envファイルにPROPERTY_ID=の形式で指定。SiteWiseの測定値のID
    property_id: str = Field("-")
    # SYSTEM_OFFSET : ライブラリによってで他の読み出し位置が異なるため、オフセットする
    system_offset: int = Field(6)
    # BLEの再スキャンまでの周期
    loop_time_seconds: float = Field(5.0)
    # SiteWiseの送信データ型
    data_type: str = Field("doubleValue")
    # SiteWiseのリージョン
    region: str = Field("us-east-1")


class Arguments(BaseModel):
    value: float

    @classmethod
    def parse_args(cls):
        parser = ArgumentParser()
        for k in cls.schema()["properties"].keys():
            parser.add_argument(f"-{k[0:1]}", f"--{k}")
        return cls.parse_obj(parser.parse_args().__dict__)


# 環境変数から読み込んだ設定を反映する
config = Config()


class Parameter(BaseModel):
    """
    SwitchBot 防水温湿度計の計測値を格納する
    """

    # 気温
    temperature: float
    # 湿度
    humidity: int

    @staticmethod
    def from_manufacturer_data(binary: bytes, offset: int):
        """
        Manufacture dataから現在の気温を取得する

        binary : bytes
            Manufacture dataのバイナリ
        offset : int
            ライブラリによってデータの読み出し開始点が異なるため、オフセットを入れる
            bleak(Windows環境) -> 6
        """
        # 読み出し開始点からデータを取得する
        hex_bs: str = binary.hex()[offset:]
        # 気温の小数部分(10で割った値を利用する)
        tempFra: float = int(hex_bs[11:12], 16) / 10.0
        # 気温の整数部分
        tempInt: int = int(hex_bs[12:14], 16)
        # 湿度
        humidity: int = int(hex_bs[14:16], 16) % 128
        # 気温の整数部分は128のオフセットが入っている
        # もしオフセットよりも低い値ならマイナスの気温として判定する
        if tempInt < 128:
            tempInt *= -1
            tempFra *= -1
        else:
            tempInt -= 128
        # データを返却する
        return Parameter(temperature=tempFra + tempInt, humidity=humidity)


def send_value(value: float):
    """
    SiteWiseにデータを送信する
    """
    if len(config.asset_id) <= 1 or len(config.property_id) <= 1:
        print(f"No Config :: {value}")
        return

    send_value = {}
    send_value[config.data_type] = value

    client = boto3.Session(region_name=config.region).client("iotsitewise")
    client.batch_put_asset_property_value(
        entries=[
            {
                "entryId": str(uuid4()),
                "assetId": config.asset_id,
                "propertyId": config.property_id,
                "propertyValues": [
                    {
                        "value": send_value,
                        "timestamp": {
                            "timeInSeconds": int(time.time()),
                            "offsetInNanos": 0,
                        },
                        "quality": "GOOD",
                    },
                ],
            },
        ]
    )

    print(f"Send :: {value}")


def detection_callback(device, advertise):
    """
    データを受信
    仕様はSwitchBot開発元のGithubに上がっている
    https://github.com/OpenWonderLabs/python-host/blob/master/switchbot.py

    device : デバイス情報
    advertise : アドバタイズ情報
    """
    if config.mac_address == device.address:
        for k in advertise.manufacturer_data.keys():
            # Manufactureから現在の気温と湿度を取得する
            current = Parameter.from_manufacturer_data(
                advertise.manufacturer_data[k], config.system_offset
            )
            # 気温を送信する
            send_value(current.temperature)


async def run():
    """
    ループ: スキャンを実行する
    """
    scanner = BleakScanner()
    scanner.register_detection_callback(detection_callback)
    while True:
        await scanner.start()
        await asyncio.sleep(config.loop_time_seconds)
        await scanner.stop()


def main(args: Arguments, is_daemon: bool):
    """
    エントリポイント: 関数を実行する
    """
    if is_daemon:
        print("Start:: Waiting for detection...")
        loop = asyncio.get_event_loop()
        loop.run_until_complete(run())
    else:
        send_value(args.value)


# 実行する
try:
    # 送信する
    main(Arguments.parse_args(), False)
except Exception:
    # 引数が足りないのなら、BLEを検索する
    main(Arguments(value=0, daemon=True), True)
