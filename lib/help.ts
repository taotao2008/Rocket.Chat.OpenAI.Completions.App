import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { OpenAiChatApp as AppClass } from '../OpenAiChatApp';
import {notifyUser, sendMessage} from '../lib/helpers';

import { BlockBuilder, ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import {Lang} from "../lang";


// Open modal to request time off
export async function HelpCommand({ app, context, modify }: {
    app: AppClass;
    context: SlashCommandContext;
    modify: IModify;
}): Promise<void> {
    // Send message
    const room = context.getRoom();
    const user = context.getSender();

    await sendHelp({ app, modify, user, room });
    /*const { lang } = new Lang('en');

    await sendHelp(
        modify,
        room,
        user,
        lang.reminder.messageAction.caption,
    );*/
}


export async function sendHelp({ app, modify, user, room }: {
    app: AppClass;
    modify: IModify;
    user: IUser;
    room: IRoom;
}) {
    // Create message block
    const block = modify.getCreator().getBlockBuilder();
    await ReminderActionsMessage({ app, block });

    const { lang } = new Lang('en');

    await notifyUser({
        app,
        message: lang.reminder.messageAction.caption,
        user,
        room,
        modify,
        //blocks: block,
    });
}


export async function ReminderActionsMessage({ app, block }: {
    app: AppClass;
    block: BlockBuilder;
}) {
    const { lang } = new Lang('en');

    block.addSectionBlock({
        text: block.newMarkdownTextObject(lang.reminder.messageAction.caption),
    });

    block.addActionsBlock({
        elements: [
            block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_ask),
                actionId: 'gptplus-ask',
                style: ButtonStyle.PRIMARY,
            }),
            /*block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_blend),
                actionId: 'imagine-blend',
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_describe),
                actionId: 'imagine-describe',
                style: ButtonStyle.PRIMARY,
            }),*/
            /*block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_create),
                actionId: 'reminder-create',
                style: ButtonStyle.PRIMARY,
            }),*/

            block.newButtonElement({
                text: block.newPlainTextObject(lang.reminder.messageAction.button_doc),
                actionId: 'gptplus-doc',
                style: ButtonStyle.PRIMARY,
            }),
        ],
    });
}



export async function sendHelpFix({ app, modify, user, room }: {
    app: AppClass;
    modify: IModify;
    user: IUser;
    room: IRoom;
}) {
    // Create message block
    const block = modify.getCreator().getBlockBuilder();
    await ReminderActionsMessage({ app, block });

    const { lang } = new Lang('en');

    await sendMessage({
        app,
        modify,
        room,
        message: lang.reminder.messageAction.caption,
        attachments: [],
        //blocks: block,
    })
}
