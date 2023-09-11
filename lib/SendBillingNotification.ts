import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import {ButtonStyle} from "@rocket.chat/apps-engine/definition/uikit";
import {AppEnum} from '../enum/App';


export async function sendBillingNotification(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message_content: string,
    threadId?: string,
): Promise<void> {

    const builder = await modify.getCreator().startMessage().setRoom(room);
    if(threadId !== undefined){
        builder.setThreadId(threadId)
    }

    const block = modify.getCreator().getBlockBuilder();
    block.addSectionBlock({
        blockId: 'text_blockid',
        text: block.newMarkdownTextObject(message_content),
    });

    /*block.addActionsBlock({
        blockId: "buy-thing",
        elements: [
            block.newButtonElement({
                actionId: "buy-thing",
                text: block.newPlainTextObject("进入商品中心"),
                url: AppEnum.SHOP_URL,
                style: ButtonStyle.PRIMARY,
            }),

        ],

    });*/
    const shop_markdown = '[ 👉 进入商品中心 ](' + AppEnum.SHOP_URL + ')';

    block.addSectionBlock({
        blockId: 'shop_blockid',
        text: block.newMarkdownTextObject(shop_markdown),
    });

    const author = {
        link: 'https://www.microsoft.com',
    };

    const imageIupload = {
        url: 'https://picture.qmai.chat/file-upload/7mfby2hQeZrMW7kHX/Clipboard%20-%202023%E5%B9%B48%E6%9C%8823%E6%97%A5%E4%B8%8B%E5%8D%883%E7%82%B900%E5%88%86.png',
    };

    block.addImageBlock({
        blockId: 'image_blockid',
        imageUrl : imageIupload.url,
        altText: author.link
    });


    builder.setBlocks(block);

    //const messageId = await modify.getCreator().finish(builder);
    return await modify
        .getNotifier()
        .notifyUser(sender, builder.getMessage());
}
