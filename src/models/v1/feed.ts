import { Required, PropertyType } from "@tsed/common";
import { Description } from "@tsed/swagger";

class OGInfoEntry {
    @PropertyType(String)
    thumbnailUrl: string;
    @PropertyType(String)
    description: string;
    @PropertyType(String)
    title: string;
}

export class MultiGetOgInfoResponse {
    @Required()
    statusId: number;
    @Required()
    url: string;
    @Required()
    @Description('Note that all fields here are optional; this can be an empty object')
    ogInfo: OGInfoEntry;
}