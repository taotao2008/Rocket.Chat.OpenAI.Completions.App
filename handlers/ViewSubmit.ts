import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import {requestBillingByPhone} from '../api/RequestManagerApi';
import { AppSetting } from "../config/Settings";
import {AppEnum} from '../enum/App';
import { OpenAiCompletionRequest } from "../lib/RequestOpenAiChat";
import {sendBillingNotification} from '../lib/SendBillingNotification';
import { sendDirect } from "../lib/SendDirect";
import { sendMessage } from "../lib/SendMessage";
import { sendNotification } from "../lib/SendNotification";
import { OpenAiChatApp } from "../OpenAiChatApp";
import { SystemInstructionPersistence } from "../persistence/ChatGPTPersistence";
import apply = Reflect.apply;

export class ViewSubmitHandler {
    public async executor(
        app: OpenAiChatApp,
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
        logger?: ILogger
    ) {
        const interaction_data = context.getInteractionData();
  /*      app.getLogger().info('interaction_data##############');
        app.getLogger().info(interaction_data);*/

        if (interaction_data.view.id.startsWith("ask-chatgpt-submit-view")) {
            //var prompt = interaction_data.view.state?.OpenAiCompletions_suggested_prompt
            if (interaction_data.view.state) {
                const completions_options =
                    interaction_data.view.state[
                        AppSetting.NAMESPACE + "_ask_chatgpt"
                    ];
                const prompt = completions_options["suggested_prompt"];
                const system_instruction = completions_options["instruction"];
                const output_options = completions_options["output_option"];
                const user = interaction_data.user;

                // process configurable system instruction
                const { value: OPEN_AI_DEFAULT_INSTRUCTION } = await read
                    .getEnvironmentReader()
                    .getSettings()
                    .getById(AppSetting.OpenAI_CHAT_DEFAULT_SYSTEM_INSTRUCTION);
                var instruction = OPEN_AI_DEFAULT_INSTRUCTION;
                // if the provided instruction difers from the default, we write it
                if (
                    completions_options["instruction"] !=
                    OPEN_AI_DEFAULT_INSTRUCTION
                ) {
                    await SystemInstructionPersistence.update(
                        persistence,
                        user.id,
                        completions_options["instruction"]
                    );
                    var instruction = completions_options["instruction"];
                }


                let room_id_billing = '';
                //获取roomId
                for (var output of output_options) {
                    // get room, output_mode and other from the output option
                    room_id_billing = output.split("#")[1];
                }
                const room_billing = await read.getRoomReader().getById(room_id_billing) as IRoom;
                //计费
                const isBilling = await requestBillingByPhone(
                    app,
                    http,
                    read,
                    prompt,
                    user,
                    "1"
                );
                if (!isBilling) {
                    sendBillingNotification(
                        modify,
                        room_billing,
                        user,
                        AppEnum.MIDJOURNEY_TEXT_BILLING_fAIL
                    );
                    return ;
                }

                sendNotification(
                    modify,
                    room_billing,
                    user,
                    AppEnum.CHATGPT_TEXT_WATTING
                );

                // do request
                OpenAiCompletionRequest(
                    app,
                    http,
                    read,
                    [
                        { role: "system", content: system_instruction },
                        { role: "user", content: prompt },
                    ],
                    user
                ).then((result) => {
                    for (var output of output_options) {
                        // get room, output_mode and other from the output option
                        const output_mode = output.split("#")[0];
                        const room_id = output.split("#")[1];
                        var thread_id = output.split("#")[2];
                        if (thread_id == "undefined") {
                            thread_id = undefined;
                        }
                        read.getRoomReader()
                            .getById(room_id)
                            .then((room) => {
                                if (!room) {
                                    return {
                                        success: false,
                                        message: "No room found",
                                    };
                                }

                                if (!result.success) {
                                    sendNotification(
                                        modify,
                                        room,
                                        user,
                                        `**出错!** 信息如下：\n\n` +
                                            result.content.error.message
                                    );
                                } else {
                                    var content = result.content.choices[0].message
                                    .content as string;
                                // remove initial break lines
                                content = content.replace(/^\s*/gm, "");
                                var before_message = `**Instruction**: ${instruction}\n**Prompt**: ${prompt}`;
                                var message = before_message + "\n" + content;




                                    switch (output_mode) {
                                        case "notification":
                                            sendNotification(
                                                modify,
                                                room,
                                                user,
                                                before_message + message,
                                                thread_id
                                            );
                                            break;

                                        case "direct":
                                            sendDirect(
                                                user,
                                                read,
                                                modify,
                                                message
                                            );
                                            break;

                                        case "thread":
                                            sendMessage(
                                                modify,
                                                room,
                                                message,
                                                undefined,
                                                thread_id
                                            );
                                            break;

                                        case "message":
                                            sendMessage(
                                                modify,
                                                room,
                                                message
                                            );
                                            break;

                                        default:
                                            break;
                                    }
                                }
                                return {
                                    success: true,
                                };
                            });
                    }
                });
            }
        }
        return {
            success: true,
        };
    }
}
