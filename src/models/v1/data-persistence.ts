import {AllowTypes, Required} from "@tsed/common";

export class SetDataRequest {
    @Required()
    @AllowTypes('string','number','boolean','null')
    value: string|number|boolean|null;
}