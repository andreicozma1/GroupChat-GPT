<template>
    <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
        <q-chat-message :label="threadMessages.length.toString() + ' messages'"
                        class="q-pt-md"/>
        <div v-for="msg in threadMessages"
             :key="msg.dateCreated"
             :style="getMsgStyle(msg)">
            <q-chat-message
                    :avatar="msg.userAvatarUrl"
                    :bg-color="getMsgBgColor(msg)"
                    :name="getUserName(msg)"
                    :sent="isSentByMe(msg)"
                    size="6"
                    @click="onClickMsg(msg)"
                    v-bind="msg">
                <div v-for="textSnippet in parseTextSnippets(msg)"
                     :key="textSnippet"
                     @click="copyClipboard(textSnippet)">
                    <div v-for="snip in sanitizeTextSnippet(textSnippet).split('\n')"
                         :key="snip"
                         v-html="snip"/>
                    <q-tooltip :delay="750">
                        {{ getContentHoverHint(msg) }}
                    </q-tooltip>
                </div>

                <div v-if="msg.imageUrls.length > 0">
                    <q-card v-for="imageUrl in msg.imageUrls"
                            :key="imageUrl"
                            class="bg-grey-1"
                            flat>
                        <q-card-section class="q-pa-none">
                            <q-img :src="imageUrl"
                                   draggable
                                   fit="contain"
                                   style="max-height: 400px"/>
                        </q-card-section>
                    </q-card>
                </div>

                <div v-if="msg.loading">
                    <q-spinner-dots class="q-ml-md" color="primary" size="2em"/>
                </div>

                <template v-slot:stamp>
                    <div class="row items-center">
                        <q-btn :disable="!canRegenMessage(msg)"
                               :icon="getUserIcon(msg)"
                               class="q-ma-none q-pa-none"
                               color="blue-grey-8"
                               dense
                               flat
                               round
                               size="xs"
                               @click="regenMessage(msg)">
                            <q-tooltip v-if="canRegenMessage(msg)">
                                Re-generate message ({{ msg.userId }})
                            </q-tooltip>
                            <q-tooltip v-else>
                                This message cannot be re-generated ({{ msg.userId }})
                            </q-tooltip>
                        </q-btn>


                        <div class="text-caption text-blue-grey-10">
                            <q-item-label :lines="1">
                                {{ getStamp(msg) }}
                            </q-item-label>
                            <q-tooltip>
                                {{ getStampHoverHint(msg) }}
                            </q-tooltip>
                        </div>
                        <q-space></q-space>

                        <div v-if="msg.shouldDelete" class="text-bold">Delete?</div>
                        <q-btn v-if="!msg.shouldDelete"
                               color="blue-grey-8"
                               dense
                               flat
                               icon="edit"
                               round
                               size="xs"
                               @click="editMessage(msg)">
                            <q-tooltip>
                                Edit message
                            </q-tooltip>
                        </q-btn>
                        <q-btn v-if="!msg.shouldDelete"
                               :icon="msg.hideInPrompt ? 'visibility' : 'visibility_off'"
                               color="blue-grey-8"
                               dense
                               flat
                               round
                               size="xs"
                               @click="ignoreMessage(msg)">
                            <q-tooltip>
                                {{ msg.hideInPrompt ? 'Use message' : 'Ignore message' }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn :icon="msg.shouldDelete ? 'delete_forever' : 'delete'"
                               :color="msg.shouldDelete ? 'black' : 'blue-grey-8'"
                               dense
                               flat
                               round
                               size="xs"
                               @click="deleteMessage(msg)">
                            <q-tooltip>
                                {{ msg.shouldDelete ? "Yes, delete" : 'Delete' }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn v-if="msg.shouldDelete"
                               :color="msg.shouldDelete ? 'black' : 'blue-grey-8'"
                               dense
                               flat
                               icon="restore"
                               round
                               size="xs"
                               @click="restoreMessage(msg)">
                            <q-tooltip>
                                Restore
                            </q-tooltip>
                        </q-btn>
                    </div>
                </template>

            </q-chat-message>
        </div>
    </q-scroll-area>
</template>

<script lang="ts" setup>
import {getSeededQColor} from "src/util/Colors";
import {copyClipboard, getAppVersion} from "src/util/Utils";
import {useChatStore} from "stores/chatStore";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {smartNotify} from "src/util/SmartNotify";
import {dateToLocaleStr, dateToTimeAgo} from "src/util/DateUtils";
import {getMessageHistory} from "src/util/chat/ChatUtils";
import {ChatMessage, ChatThread} from "src/util/chat/ChatModels";
import {User} from "src/util/users/User";
import {getSingularOrPlural} from "src/util/TextUtils";

const props = defineProps({
	scrollAreaStyle: {
		type: Object,
		required: false,
		default: null,
	},
});

const store = useChatStore();

const threadElem: any = ref(null);
const threadMessages: Ref<ChatMessage[]> = ref([]);


const onClickMsg = (message: ChatMessage) => {
	console.log({...message});
	console.log({...message.response?.data})
};

const getUserName = (message: ChatMessage): string => {
	const user: User = store.getUserConfig(message.userId);
	// return `${user.name} (${user.id})`;
	return user.name;
};

const getUserIcon = (message: ChatMessage) => {
	const user: User = store.getUserConfig(message.userId);
	if (!user) {
		console.error(`User "${message.userId}" not found.`);
		smartNotify(`Error: User "${message.userId}" not found.`);
		return "send";
	}
	if (!user.icon) {
		console.warn(`User "${user.id}" does not define an icon.`);
		return "help";
	}
	return user.icon;
};

const getContentHoverHint = (message: ChatMessage) => {
	const numTexts = message.textSnippets?.length ?? 0;
	const numImages = message.imageUrls?.length ?? 0;
	const who = (isSentByMe(message) ? "You" : message.userName) + ` (${message.userId})`
	const what = `${numTexts} ${getSingularOrPlural('text', numTexts)} and ${numImages} ${getSingularOrPlural('image', numImages)}`;
	const when = dateToLocaleStr(message.dateCreated);
	return `${who} sent ${what} on ${when}`;
};

const getStamp = (message: ChatMessage) => {
	// const what = isSentByMe(msg) ? "Sent" : "Received";
	const on = dateToTimeAgo(message.dateCreated);
	// let res = `${what} ${on}`;
	let res = `${on}`;
	// if (msg.isCompRegen) res = `* ${res}`;
	if (message.cached) res = `${res} (cached)`;
	return res;
};

const getStampHoverHint = (message: ChatMessage) => {
	const when = dateToLocaleStr(message.dateCreated);
	const what = isSentByMe(message) ? "Sent" : "Received";
	let res = `${what} on ${when}`;
	const dateGenerated = message.response?.data?.created * 1000;
	if (dateGenerated) res += "\n\n" + ` [Generated on ${dateToLocaleStr(dateGenerated)}]`;

	return res;
};


const parseTextSnippets = (message: ChatMessage) => {
	const texts = message.textSnippets;
	if ((!texts || texts.length === 0) && !message.loading) return [];
	return texts;
};

const sanitizeTextSnippet = (textSnippet: string) => {
	const tagsReplMap: { [key: string]: string } = {
		prompt: "b",
		image: "b",
		code: "b",
		result: "b",
	};
	// replace special tags with valid html tags to distinguish them
	const regex = /<\/?([a-z]+)[^>]*>/gi;
	return textSnippet.replace(regex, (match, oldTag: string) => {
		// replace tag with replacement if it exists
		if (oldTag in tagsReplMap) return `<${tagsReplMap[oldTag]}>`;
		// remove all other tags
		return "";
	});
};

const ignoreMessage = (message: ChatMessage) => {
	console.warn("=> ignore:", {...message});
	message.hideInPrompt = message.hideInPrompt === undefined ? true : !message.hideInPrompt;
};

const editMessage = (message: ChatMessage) => {
	smartNotify(`Message editing is not yet implemented`);
	console.warn("=> edit:", {...message});
	// comp.editMessage(msg);
};

const canRegenMessage = (message: ChatMessage) => {
	if (message.shouldDelete) return false;
	const msgIds = message.response?.contextIds;
	if (msgIds) return msgIds.length > 0;
	return false;
};

const regenMessage = (message: ChatMessage) => {
	console.warn("*".repeat(40));
	console.log("regenMessage->message:", {...message});
	console.log("regenMessage->message.response?.contextIds:", message.response?.contextIds);
	store.handleUserMessage(message, store);
};

const deleteMessage = (message: ChatMessage) => {
	console.warn("=> delete:", {...message});
	// 2nd click - confirmation and delete
	if (message.shouldDelete) {
		store.deleteMessage(message.id);
		return;
	}
	// 1st click - will need 2nd click to confirm
	message.shouldDelete = true;
};


const restoreMessage = (message: ChatMessage) => {
	console.warn("=> restore:", {...message});
	message.shouldDelete = false;
};

const getMsgStyle = (message: ChatMessage) => {
	if (message.hideInPrompt)
		return {
			opacity: 0.5,
			// textDecoration: "line-through",
		};
	if (message.shouldDelete)
		return {
			outline: "2px dashed red",
			// borderRadius: "15px",
		};
	return {};
};


const isSentByMe = (message: ChatMessage) => {
	return message.userId === store.humanUserId && message.userName === store.humanUserName;
};

const getMsgBgColor = (message: ChatMessage) => {
	if (message.shouldDelete) return "red-2";
	return isSentByMe(message) ? null : getSeededQColor(message.userName, 1, 2);
};

const scrollToBottom = (duration?: number) => {
	if (threadElem.value) {
		duration = duration ?? 750;
		// scroll to bottom. The element is q-scroll-area
		const size = threadElem.value.getScroll().verticalSize;
		threadElem.value.setScrollPosition("vertical", size, duration);
	}
};

const getScrollAreaStyle = computed(() => {
	const propStyle = props.scrollAreaStyle ? props.scrollAreaStyle : {};
	const defaults = {
		position: "absolute",
		left: "0px",
		right: "0px",
		top: "50px",
		bottom: "0px",
		paddingLeft: "5vw",
		paddingRight: "5vw",
		paddingBottom: "2vh",
	};
	return {
		...defaults,
		...propStyle,
	};
});

watch(
	() => props.scrollAreaStyle,
	() => {
		scrollToBottom(1000);
	}
);

const parseThreadMessages = (): ChatMessage[] => {
	const thread: ChatThread = store.getActiveThread;
	let messages: ChatMessage[] = getMessageHistory(store, {
		forceShowKeywords: ["[ERROR]", "[WARNING]", "[INFO]"],
		hiddenUserIds: thread.prefs.hiddenUserIds,
		maxMessages: undefined,
		maxDate: undefined,
	});
	console.log("parseThreadMessages->messages:", messages);

	messages = messages.filter((message: ChatMessage) => {
		return !(store.getActiveThread.prefs.dontShowMessagesHiddenInPrompts && message.hideInPrompt);
	});
	console.log("parseThreadMessages->filtered:", messages);
	return messages;
};


const loadThread = (shouldScroll = false) => {
	try {
		// count the number of messages prior
		const prevMsgCount = threadMessages.value.length;
		threadMessages.value = parseThreadMessages();
		// count the number of messages after
		const newMsgCount = threadMessages.value.length;
		if (shouldScroll || newMsgCount > prevMsgCount) scrollToBottom(1000);
	} catch (err: any) {
		console.error("Error loading chat thread", err);
		const threadVer = store.getActiveThread.appVersion?.trim()
		const appVer = getAppVersion();
		console.log("Thread version:", threadVer);
		console.log("App version:", appVer);
		console.log(threadVer === appVer);
		let caption: string
		if (threadVer && threadVer !== appVer) {
			caption = `Chat thread version (${threadVer}) does not match app version (${appVer}). `;
		} else {
			caption = "";
		}
		caption += "If you recently updated the app, you may need to clear local storage, or create a new thread."
		smartNotify(`Error loading a previously saved chat thread.`, caption);
	}
};

watch(store.getActiveThread, () => loadThread(false));

onMounted(() => {
	loadThread(true);
});
</script>
