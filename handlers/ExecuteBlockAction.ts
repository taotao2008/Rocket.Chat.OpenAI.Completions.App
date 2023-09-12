import { IModify, IRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitModalResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { OpenAiChatApp as AppClass } from '../OpenAiChatApp';
import {GetUserSystemInstruction} from '../lib/GetUserSystemInstruction';
import {createAskChatGPTModal} from '../ui/AskChatGPTModal';

export class ExecuteBlockAction {
    constructor(
        private readonly app: AppClass,
        private readonly modify: IModify,
        private readonly read: IRead,
        private readonly persis: IPersistence,
    ) {}

    public async run(context: UIKitBlockInteractionContext): Promise<IUIKitModalResponse | Record<string, any>> {
        const data = context.getInteractionData();
        const { user, actionId, value, container, blockId } = data;

        this.app.getLogger().debug('data==',data);




        let roomId = 'GENERAL';
        if (container.id.startsWith('modal-separation-create')) {
            roomId = container.id.split('--')[1];
        }


        const room = await this.read.getRoomReader().getById(roomId);
        this.app.getLogger().debug('room==',room);


        const instruction = await GetUserSystemInstruction(this.read, user);

        this.app.getLogger().debug('instruction==',instruction);

        switch (actionId) {
            case 'gptplus-ask': {
                this.app.getLogger().debug('instruction==',instruction);

                const modal = await createAskChatGPTModal(
                    this.modify,
                    room as IRoom,
                    '',
                    instruction,
                    ''
                );

                return context.getInteractionResponder().openModalViewResponse(modal);
            }


            /*case 'reminder-list':
                await openListModal({ app: this.app, user, modify: this.modify, triggerId: data.triggerId });
                break;*/
        }



        return {
            success: true,
            user: data.user.username,
            action: data.actionId,
            value: data.value,
            triggerId: data.triggerId,
        };
    }

}
