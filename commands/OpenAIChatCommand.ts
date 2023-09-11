import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IMessage, IMessageAction,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {requestBillingByPhone} from '../api/RequestManagerApi';
import { AppSetting } from "../config/Settings";
import {AppEnum} from '../enum/App';
import { GetUserSystemInstruction } from "../lib/GetUserSystemInstruction";
import { OpenAiCompletionRequest } from "../lib/RequestOpenAiChat";
import {sendBillingNotification} from '../lib/SendBillingNotification';
import {sendDirect} from '../lib/SendDirect';
import { sendMessage } from "../lib/SendMessage";
import { sendNotification } from "../lib/SendNotification";
import { OpenAiChatApp } from "../OpenAiChatApp";
import { SystemInstructionPersistence } from "../persistence/ChatGPTPersistence";
import { createAskChatGPTModal } from "../ui/AskChatGPTModal";

export class OpenAIChatCommand implements ISlashCommand {
    public command = "chatgptplus";
    public i18nParamsExample = AppSetting.NAMESPACE + "_SlashCommand_Params";
    public i18nDescription = AppSetting.NAMESPACE + "_SlashCommand_Description";
    public providesPreview = false;

    constructor(private readonly app: OpenAiChatApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const prompt_array = context.getArguments();
        const room = context.getRoom();
        const sender = context.getSender();
        const threadId = context.getThreadId();
        const triggerId = context.getTriggerId();
        const instruction = await GetUserSystemInstruction(read, sender);

        if (!triggerId) {
            return this.app.getLogger().error("TRIGGER UNDEFINED");
        }

        if (prompt_array.length == 0) {
            // get initial system instruction

            var askChatGPT_Modal = createAskChatGPTModal(
                modify,
                room,
                undefined,
                instruction,
                threadId
            );
            return modify
                .getUiController()
                .openModalView(askChatGPT_Modal, { triggerId }, sender);
        } else {
            var prompt = prompt_array.join(" ");
            const payload = [{ role: "user", content: prompt }];

            //计费
            const isBilling = await requestBillingByPhone(
                this.app,
                http,
                read,
                prompt,
                sender,
                "1"
            );

            if (!isBilling) {
                sendBillingNotification(
                    modify,
                    room,
                    sender,
                    AppEnum.MIDJOURNEY_TEXT_BILLING_fAIL
                );
                return ;
            }



            sendNotification(
                modify,
                room,
                sender,
                AppEnum.CHATGPT_TEXT_WATTING
            );


            const result = await OpenAiCompletionRequest(
                this.app,
                http,
                read,
                payload,
                sender
            );

            if (result.success) {
                // format return
                var content = result.content.choices[0].message
                    .content as string;
                // remove initial break lines
                content = content.replace(/^\s*/gm, "");
                var before_message = `**Instruction**: ${instruction}\n**Prompt**: ${prompt}`;
                var message = before_message + "\n" + content;
                sendMessage(
                    modify,
                    room,
                    message,
                    undefined,
                    context.getThreadId()
                );
            } else {
                sendNotification(
                    modify,
                    room,
                    sender,
                    `**执行出错!** 无法完成请求，请重试！:\n\n` +
                        result.content.error.message
                );
            }
        }
    }
}
