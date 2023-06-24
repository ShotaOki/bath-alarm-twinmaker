from pydantic import BaseModel, BaseSettings, Field
import asyncio
from bleak import BleakScanner
from dotenv import load_dotenv

# 環境変数をENVから読み込む
load_dotenv()


class Config(BaseSettings):
    """
    環境変数から設定を読み出す
    """

    # MAC_ADDRESS : .envファイルにMAC_ADDRESS=の形式で指定する
    mac_address: str = Field("xx:xx:xx:xx:xx:xx")
    # SYSTEM_OFFSET : ライブラリによってで他の読み出し位置が異なるため、オフセットする
    system_offset: int = Field(6)
    # BLEの再スキャンまでの周期
    loop_time_seconds: float = Field(5.0)


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
            print(current)


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


loop = asyncio.get_event_loop()
loop.run_until_complete(run())
