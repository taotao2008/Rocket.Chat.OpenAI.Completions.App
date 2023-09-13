import {
    IAppAccessors,
    IConfigurationExtend, IConfigurationModify, IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from "@rocket.chat/apps-engine/definition/App";
import {
    IMessage, IMessageAttachment,
    IPostMessageSent,
} from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import {IPostRoomCreate, IRoom, RoomType} from '@rocket.chat/apps-engine/definition/rooms';
import {ISetting} from '@rocket.chat/apps-engine/definition/settings';
import {
    IUIKitResponse,
    UIKitActionButtonInteractionContext, UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import {requestSpeech2Txt} from './api/RequestAudioServiceApi';
import {requestBillingByPhone} from './api/RequestManagerApi';
import { OpenAIChatCommand } from "./commands/OpenAIChatCommand";
import { buttons } from "./config/Buttons";
import {AppSetting, settings} from './config/Settings';
import {AppEnum} from './enum/App';
import { ActionButtonHandler } from "./handlers/ActionButtonHandler";
import {ExecuteBlockAction} from './handlers/ExecuteBlockAction';
import { ViewSubmitHandler } from "./handlers/ViewSubmit";
import {sendHelpFix} from './lib/help';
import { OpenAiCompletionRequest } from "./lib/RequestOpenAiChat";
import {sendBillingNotification} from './lib/SendBillingNotification';
import { sendDirect } from "./lib/SendDirect";
import { sendMessage } from "./lib/SendMessage";
import { sendNotification } from "./lib/SendNotification";
import { DirectContext } from "./persistence/DirectContext";

export class OpenAiChatApp extends App implements IPostMessageSent, IPostRoomCreate {

    public botUsername: string;
    public botUser: IUser;

    public botName: string;

    public defaultChannelName: string;
    public defaultChannel: IRoom;

    public QMAI_AUDIO_SERVER_URL: string;
    public IS_BILLING: string;
    public AUDIO_SERVICE_API_URL: string;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);

    }



    // Test out IPostRoomCreate
    public async checkPostRoomCreate(room: IRoom): Promise<boolean> {
        return room.type === RoomType.DIRECT_MESSAGE && room.userIds != undefined && room.userIds.includes(this.botUser.id);
    }

    public async executePostRoomCreate(room: IRoom, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>{
        await sendHelpFix({ app: this, modify, user: this.botUser, room });
    }



    public async onEnable(environment: IEnvironmentRead, configurationModify: IConfigurationModify): Promise<boolean> {

        // Get bot user by bot username
        this.botUsername = await environment.getSettings().getValueById('bot_username');
        if (!this.botUsername) {
            return false;
        }
        this.botUser = await this.getAccessors().reader.getUserReader().getByUsername(this.botUsername) as IUser;

        this.botName = await environment.getSettings().getValueById('bot_name');



        this.defaultChannelName = await environment.getSettings().getValueById('default_channel');

        this.defaultChannel = await this.getAccessors().reader.getRoomReader().getByName(this.defaultChannelName) as IRoom;


        this.IS_BILLING =  await environment.getSettings().getValueById(AppSetting.IS_BILLING);


        this.QMAI_AUDIO_SERVER_URL =  await environment.getSettings().getValueById(AppSetting.QMAI_AUDIO_SERVER_URL);

        this.AUDIO_SERVICE_API_URL =  await environment.getSettings().getValueById(AppSetting.AUDIO_SERVICE_API_URL);


        return true;
    }


    /**
     * Update values when settings are updated
     *
     * @param setting
     * @param configModify
     * @param read
     * @param http
     */
    public async onSettingUpdated(setting: ISetting, configModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        switch (setting.id) {
            case 'bot_username':
                this.botUsername = setting.value;
                if (this.botUsername) {
                    this.botUser = await read.getUserReader().getByUsername(this.botUsername) as IUser;
                }
                break;
            case 'bot_name':
                this.botName = setting.value;
                break;
            case 'default_channel':
                this.defaultChannelName = setting.value;
                if (this.defaultChannelName) {
                    this.defaultChannel = await read.getRoomReader().getByName(this.defaultChannelName) as IRoom;
                }
                break;
            case 'is_billing':
                this.IS_BILLING = setting.value;
                break;
            case 'qmai_audio_server_url':
                this.QMAI_AUDIO_SERVER_URL = setting.value;
                break;
            case 'audio_service_api_url':
                this.AUDIO_SERVICE_API_URL = setting.value;
                break;
        }

        return;
    }

    // Method will be called during initialization. It allows for adding custom configuration options and defaults
    public async extendConfiguration(configuration: IConfigurationExtend) {
        await configuration.slashCommands.provideSlashCommand(
            new OpenAIChatCommand(this)
        );
        // Providing persistant app settings
        await Promise.all(
            settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            )
        );
        // Registering Action Buttons
        await Promise.all(
            buttons.map((button) => configuration.ui.registerButton(button))
        );
    }


    /**
     * Execute when an action triggered
     */
    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify) {
        try {
            const handler = new ExecuteBlockAction(this, modify, read, persis);
            return await handler.run(context);
        } catch (err) {
            this.getLogger().log(`${ err.message }`);
            return context.getInteractionResponder().errorResponse();
        }
    }

    // register ActionButton Handler
    public async executeActionButtonHandler(
        context: UIKitActionButtonInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        // lets just move this execution to another file to keep DemoApp.ts clean.
        return new ActionButtonHandler().executor(
            this,
            context,
            read,
            http,
            persistence,
            modify,
            this.getLogger()
        );
    }
    // register SubmitView Handler
    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        // same for View SubmitHandler, moving to another Class
        return new ViewSubmitHandler().executor(
            this,
            context,
            read,
            http,
            persistence,
            modify,
            this.getLogger()
        );
    }
    // register hook to answer directs
    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const { text, editedAt, room, sender } = message;
        // we only want direct with the app username
        var bot_user = await read.getUserReader().getAppUser();
        var context: any;
        if (
            bot_user &&
            message.room.type == RoomType.DIRECT_MESSAGE && // direct messages
            message.room.userIds?.includes(bot_user?.id)  // that has bot_user id
            //bot_user?.id !== sender.id // and was not sent by the bot itself
        ) {
            // 消息持久化开始
            // this the bot answer, get the actual context and store it
            if (bot_user?.id == sender.id && message.threadId) {
                context_data = await DirectContext.get(read, message.threadId);
                context = context_data[0]["context"];
                context.push({ role: "assistant", content: message.text });
                await DirectContext.update(
                    persistence,
                    message.threadId,
                    context
                );
                return;
            }
            // get thread id
            // discover is there any context for this thread
            if (message.threadId) {
                // message from inside a thread
                // get context, and push to it
                var context_data = await DirectContext.get(
                    read,
                    message.threadId
                );
                context = context_data[0]["context"];
                context.push({ role: "user", content: message.text });
                // update context on persistence
                await DirectContext.update(
                    persistence,
                    message.threadId,
                    context
                );
            } else {
                // no thread id, first message, initiating context
                var context = [{ role: "user", content: message.text }] as any;
                // update context
                if (message.id) {
                    await DirectContext.update(
                        persistence,
                        message.id,
                        context
                    );
                }
            }
            // 消息持久化结束


            const prompt = message.text as string;





            if (prompt.toLowerCase() == 'help') {
                await sendHelpFix({ app: this, modify, user: this.botUser, room });
                return
            }


            if (message?.attachments?.length) {

                for (let index = 0; index < message.attachments.length; index++) {
                    const attach = message.attachments[index] as IMessageAttachment;

                    if ( attach.audioUrl != undefined) {
                        //计费
                        if (this.IS_BILLING == 'true') {
                            const isBilling = await requestBillingByPhone(
                                this,
                                http,
                                read,
                                prompt,
                                sender,
                                "2"
                            );

                            if (!isBilling) {
                                sendBillingNotification(
                                    modify,
                                    room,
                                    sender,
                                    AppEnum.MIDJOURNEY_TEXT_BILLING_fAIL
                                );
                                return;
                            }
                        }

                        let msg_id = '';
                        msg_id = await sendDirect(
                            sender,
                            read,
                            modify,
                            AppEnum.SPEECH2TXT_TEXT_WATTING
                        );


                        let prompt_audio = this.QMAI_AUDIO_SERVER_URL + attach.audioUrl;

                        this.getLogger().debug('prompt_audio===', prompt_audio);


                        requestSpeech2Txt(
                            this,
                            http,
                            read,
                            prompt_audio,
                            sender,
                            "zh-CN",
                            room,
                            msg_id,
                        ).then(result => {
                            if (result == null) {
                                sendNotification(
                                    modify,
                                    room,
                                    sender,
                                    "任务出错，服务接口异常！"
                                );
                                return
                            } else {
                                if (result) {

                                } else {
                                    sendNotification(
                                        modify,
                                        room,
                                        sender,
                                        "任务已存在！"
                                    );
                                    return;
                                }
                            }
                        });

                    }


                }


            } else {

                if (this.IS_BILLING == 'true') {
                    //计费
                    const isBilling = await requestBillingByPhone(
                        this,
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
                }



                let wattingMessageId = '';

                if (room.type == 'd') {
                    wattingMessageId = await sendDirect(
                        sender,
                        read,
                        modify,
                        AppEnum.CHATGPT_TEXT_WATTING
                    );
                } else {
                    sendNotification(
                        modify,
                        room,
                        sender,
                        AppEnum.CHATGPT_TEXT_WATTING
                    );
                }

                const result = await OpenAiCompletionRequest(
                    this,
                    http,
                    read,
                    context,
                    sender,
                );

                if (wattingMessageId) {
                    const wattingMessage = await read.getMessageReader().getById(wattingMessageId) as IMessage;
                    await modify.getDeleter().deleteMessage(wattingMessage, sender);
                }


                if (result.success) {
                    var markdown_message =
                        result.content.choices[0].message.content.replace(
                            /^\s*/gm,
                            ""
                        );
                    sendDirect(
                        sender,
                        read,
                        modify,
                        markdown_message
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

        return;
    }
}
