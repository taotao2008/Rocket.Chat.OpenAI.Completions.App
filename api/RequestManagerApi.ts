import {
    IHttp,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { AppSetting } from "../config/Settings";
import { OpenAiChatApp } from "../OpenAiChatApp";

export async function requestBillingByPhone(
    app: OpenAiChatApp,
    http: IHttp,
    read: IRead,
    prompt: any,
    sender: IUser,
    integration_used: string
): Promise<boolean> {
    // get configs
    const { value: MAMNAGER_API_URL } = await read
        .getEnvironmentReader()
        .getSettings()
        .getById(AppSetting.MAMNAGER_API_URL);


    const params = {
        "phone": sender.emails[0].address,
        "integration_used": integration_used
    };
    return http
        .post(MAMNAGER_API_URL + "/order/requestBillingByPhone", {
            params: params,
        })
        .then((ok) => {

            if (ok.data.code == 200) {
                return true;
            } else {
                return false;
            }
        })
        .catch((error) => {
            return  false ;
        });
}
