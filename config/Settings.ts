import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    NAMESPACE = "OpenAIChat4",
    //NAMESPACE = "OpenAIChat",
    OpenAI_ORG = "openai_organization",
    OpenAI_API_KEY = "openai_api_key",
    OpenAI_CHAT_DEFAULT_SYSTEM_INSTRUCTION = "openai_chat_default_system_instruction",
    OpenAI_CHAT_MAX_TOKENS = "openai_chat_max_tokens",
    OpenAI_CHAT_TEMPERATURE = "openai_chat_temperature",
    MAMNAGER_API_URL = 'mamnager_api_url',
    ASK_API_URL = 'ask_api_url'
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.OpenAI_API_KEY,
        public: true,
        type: SettingType.STRING,
        packageValue: "",
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "_API_KEY_LABEL",
        required: true,
    },
    {
        id: AppSetting.OpenAI_CHAT_DEFAULT_SYSTEM_INSTRUCTION,
        public: true,
        type: SettingType.STRING,
        packageValue: "Your are a helpful assistant.",
        value: "Your are a helpful assistant.",
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "_DEFAULT_SYSTEM_INSTRUCTION_LABEL",
        required: false,
    },
    {
        id: AppSetting.OpenAI_ORG,
        public: true,
        type: SettingType.STRING,
        packageValue: null,
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "_ORG_LABEL",
        required: false,
    },
    {
        id: AppSetting.OpenAI_CHAT_MAX_TOKENS,
        public: true,
        type: SettingType.NUMBER,
        packageValue: null,
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "_MAX_TOKENS_LABEL",
        required: false,
    },
    {
        id: AppSetting.OpenAI_CHAT_TEMPERATURE,
        public: true,
        type: SettingType.STRING,
        packageValue: null,
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "_TEMPERATURE_LABEL",
        required: false,
    },
    {
        id: AppSetting.MAMNAGER_API_URL,
        public: true,
        type: SettingType.STRING,
        packageValue: null,
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "_MAMNAGER_API_URL：后端计费系统地址API URL",
        required: false,
    },
    {
        id: AppSetting.ASK_API_URL,
        public: true,
        type: SettingType.STRING,
        packageValue: null,
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "ASK_API_URL：多负载API接口服务器地址API URL",
        required: false,
    },
];
