import {
    IHttp, IHttpRequest,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { AppSetting } from "../config/Settings";
import { OpenAiChatApp } from "../OpenAiChatApp";
import {IRoom} from "@rocket.chat/apps-engine/definition/rooms";

export async function requestTxt2Speech(
    app: OpenAiChatApp,
    http: IHttp,
    read: IRead,
    prompt: any,
    sender: IUser,
    personChoice: string,
    room: IRoom,
    msgId: string,
): Promise<boolean> {
    // get configs

    //audio_modal_people_zh-CN-XiaoxiaoNeural_style_newscast-casual
    const peopleStart = personChoice.toString().indexOf('people_');
    const styleStart = personChoice.toString().indexOf('style_');
    const peopleStr = personChoice.substr(peopleStart + 7, styleStart - 1 - peopleStart - 7);
    const styleStr = personChoice.substr(styleStart + 6, personChoice.length - styleStart -6);


    const state_obj = {
        "roomId": room.id,
        "msgId": msgId,
        "command": "t2s",
        "userId": sender.id,
        "username": sender.username,
        "name": sender.name,
         "prompt": prompt
    };

    const payload = {
        "text": prompt,
        "voice": peopleStr,
        "language_style": styleStr,
        "language_code": "zh-CN",
        "state": JSON.stringify(state_obj)
    };


    return http
        .post(app.AUDIO_SERVICE_API_URL + "/txt2speech/", {
            data: payload,
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



export async function requestSpeech2Txt(
    app: OpenAiChatApp,
    http: IHttp,
    read: IRead,
    prompt: any,
    sender: IUser,
    languageCode: string,
    room: IRoom,
    msgId: string,
): Promise<boolean> {
    // get configs



    const state_obj = {
        "roomId": room.id,
        "msgId": msgId,
        "command": "gpt_s2t",
        "userId": sender.id,
        "username": sender.username,
        "name": sender.name
    };

    const payload = {
        "text": prompt,
        "language_code": languageCode,
        "state": JSON.stringify(state_obj)
    };


    return http
        .post(app.AUDIO_SERVICE_API_URL + "/speech2txt/", {
            data: payload,
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





export async function requestSpeech2TxtSummarize(
    app: OpenAiChatApp,
    http: IHttp,
    read: IRead,
    prompt: any,
    sender: IUser,
    languageCode: string,
    room: IRoom,
    msgId: string,
): Promise<boolean> {
    // get configs



    const state_obj = {
        "roomId": room.id,
        "msgId": msgId,
        "command": "summary",
        "userId": sender.id,
        "username": sender.username,
        "name": sender.name
    };

    const payload = {
        "text": prompt,
        "language_code": languageCode,
        "state": JSON.stringify(state_obj)
    };


    return http
        .post(app.AUDIO_SERVICE_API_URL + "/speech2txt_summarize/", {
            data: payload,
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


export async function requestAiRemoveNoise(
    app: OpenAiChatApp,
    http: IHttp,
    read: IRead,
    prompt: any,
    sender: IUser,
    languageCode: string,
    room: IRoom,
    msgId: string,
): Promise<boolean> {
    // get configs



    const state_obj = {
        "roomId": room.id,
        "msgId": msgId,
        "command": "remove-noise",
        "userId": sender.id,
        "username": sender.username,
        "name": sender.name
    };

    const payload = {
        "text": prompt,
        "state": JSON.stringify(state_obj)
    };


    return http
        .post(app.AUDIO_SERVICE_API_URL + "/ai_remove_noise/", {
            data: payload,
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
