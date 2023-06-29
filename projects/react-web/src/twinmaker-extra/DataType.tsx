import { IAnchorComponent } from "@iot-app-kit/scene-composer";
import { ExtraObjectWrapper } from "./ExtraObjectWrapper";

export type SearchTagsCallback = (
  ref: string,
  anchor: IAnchorComponent
) => ExtraObjectWrapper | undefined;

export type OverrideTagsParameter = { [key: string]: SearchTagsCallback };

export namespace SystemLoadingStatus {
  export const Init: string = "init";
  export const UndefinedState: string = "undefined";
}
