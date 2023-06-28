from pydantic import BaseModel
import boto3
from argparse import ArgumentParser
import time
from uuid import uuid4


class Arguments(BaseModel):
    assetid: str
    propertyid: str
    datatype: str
    value: float

    @classmethod
    def parse_args(cls):
        parser = ArgumentParser()
        for k in cls.schema()["properties"].keys():
            parser.add_argument(f"-{k[0:1]}", f"--{k}")
        return cls.parse_obj(parser.parse_args().__dict__)


def main(args: Arguments):
    """
    SiteWiseにデータを送信する
    """
    send_value = {}
    send_value[args.datatype] = args.value

    client = boto3.Session(region_name="us-east-1").client("iotsitewise")
    client.batch_put_asset_property_value(
        entries=[
            {
                "entryId": str(uuid4()),
                "assetId": args.assetid,
                "propertyId": args.propertyid,
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


# 処理を実行
main(Arguments.parse_args())
