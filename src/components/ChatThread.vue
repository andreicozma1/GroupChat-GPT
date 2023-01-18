<template>

    <q-linear-progress
            v-if="isLoading"
            color="primary"
            indeterminate
    />

    <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
        <q-item-label v-bind="threadCaptionProps">
            {{ threadMessages.length.toString() + ' messages' }}
        </q-item-label>
        <div v-for="msg in threadMessages"
             :key="msg.dateCreated"
             :style="msg.getStyle()">
            <q-chat-message :avatar="msg.userAvatarUrl"
                            :bg-color="getMsgBgColor(msg)"
                            :name="getUserName(msg)"
                            :sent="isSentByMe(msg)"
                            size="6"
                            v-bind="msg"
                            @click="onClickMsg(msg)">
                <div v-for="textSnippet in parseTextSnippets(msg)"
                     :key="textSnippet"
                     @click="copyClipboard(textSnippet)">
                    {{ textSnippet }}
                    <q-tooltip :delay="750">
                        {{ msg.getTextHoverHint(textSnippet) }}
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
                                   style="max-height: 400px"
                            />
                        </q-card-section>
                        <q-tooltip :delay="750">
                            {{ msg.getImageHoverHint(imageUrl) }}
                        </q-tooltip>
                    </q-card>
                </div>

                <div v-if="msg.loading">
                    <q-spinner-dots class="q-ml-md" color="primary" size="2em"/>
                    <q-tooltip :delay="750">
                        {{ msg.getLoadingHoverHint() }}
                    </q-tooltip>
                </div>

                <template v-slot:stamp>
                    <div class="row items-center">
                        <q-btn :disable="!msg.canRegenerate()"
                               :icon="getUserIcon(msg)"
                               class="q-ma-none q-pa-none"
                               color="blue-grey-8"
                               dense
                               flat
                               round
                               size="xs"
                               @click="regenMessage(msg)">
                            <q-tooltip v-if="msg.canRegenerate()">
                                Re-generate message ({{ msg.userId }})
                            </q-tooltip>
                            <q-tooltip v-else>
                                This message cannot be re-generated ({{ msg.userId }})
                            </q-tooltip>
                        </q-btn>

                        <div class="text-caption text-blue-grey-10">
                            <q-item-label :lines="1">
                                {{ msg.getStamp() }}
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
                            <q-tooltip> Edit message</q-tooltip>
                        </q-btn>
                        <q-btn v-if="!msg.shouldDelete"
                               :icon="msg.isIgnored ? 'visibility' : 'visibility_off'"
                               color="blue-grey-8"
                               dense
                               flat
                               round
                               size="xs"
                               @click="msg.toggleIgnored()">
                            <q-tooltip>
                                {{ msg.isIgnored ? "Use message" : "Ignore message" }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn :color="msg.shouldDelete ? 'black' : 'blue-grey-8'"
                               :icon="msg.shouldDelete ? 'delete_forever' : 'delete'"
                               dense
                               flat
                               round
                               size="xs"
                               @click="deleteMessage(msg)">
                            <q-tooltip>
                                {{ msg.shouldDelete ? "Yes, delete" : "Delete" }}
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
                            <q-tooltip> Restore</q-tooltip>
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
import {computed, Ref, ref, watch, watchEffect} from "vue";
import {smartNotify} from "src/util/SmartNotify";
import {dateToLocaleStr} from "src/util/DateUtils";
import {parseMessagesHistory} from "src/util/chat/MessageHistory";
import {User} from "src/util/users/User";
import {ChatMessage} from "src/util/chat/ChatMessage";
import {useChatStore} from "stores/chatStore";

const props = defineProps({
	scrollAreaStyle: {
		type: Object,
		required: false,
		default: null,
	},
});

const store = useChatStore();
const threadElem: any = ref(null);
const myUser = computed(() => store.getMyUser());

const threadMessages: Ref<ChatMessage[]> = ref([]);

const isLoading = ref(false);
let loadingTimeout: NodeJS.Timeout | undefined | null = null;

const prevMessageCount = ref(0)

const threadCaptionProps = {
	'class': "text-center q-py-md",
	overline: true,
	lines: 1,
}
const onClickMsg = (message: ChatMessage) => {
	console.log("onClickMsg:", {...message});
	console.log("onClickMsg", {...message.apiResponse?.data?.data});
};

const parseTextSnippets = (message: ChatMessage): string[] => {
	const texts = message.textSnippets.flatMap((snippet: string) => {
		return snippet.split("\n\n").map((line: string) => {
			return line.trim();
		});
	});
	if ((!texts || texts.length === 0) && !message.loading) return [];
	return texts;
}

const getUserName = (message: ChatMessage): string => {
	const user: User = store.getUserById(message.userId);
	// return `${user.name} (${user.id})`;
	return user.name;
};

const getUserIcon = (message: ChatMessage) => {
	const user: User = store.getUserById(message.userId);
	if (!user) {
		const ic = 'send'
		console.error(`User "${message.userId}" not found. Using default icon: '${ic}'`);
		return ic;
	}
	if (!user.icon) {
		const ic = 'help'
		console.warn(`User "${user.id}" icon not found. Using default icon: '${ic}'`);
		return ic;
	}
	return user.icon;
};

const getStampHoverHint = (message: ChatMessage) => {
	const when = dateToLocaleStr(message.dateCreated);
	const what = isSentByMe(message) ? "Sent" : "Received";
	let res = `${what} on ${when}`;
	const dateGenerated = message.apiResponse?.data?.data?.created * 1000;
	if (dateGenerated) res += "\n\n" + ` [Generated on ${dateToLocaleStr(dateGenerated)}]`;
	return res;
};

const editMessage = (message: ChatMessage) => {
	smartNotify(`Message editing is not yet implemented`);
	console.warn("=> edit:", {...message});
	// comp.editMessage(msg);
};

const regenMessage = (message: ChatMessage) => {
	console.warn("*".repeat(40));
	console.log("regenMessage->message:", {...message});
	store.handleUserMessage(message, true);
};

const deleteMessage = (message: ChatMessage) => {
	console.warn("=> delete:", {...message});
	// 2nd click - confirmation and delete
	if (message.shouldDelete) {
		store.getActiveThread().deleteMessage(message.id);
		return;
	}
	// 1st click - will need 2nd click to confirm
	message.shouldDelete = true;
};

const restoreMessage = (message: ChatMessage) => {
	console.warn("=> restore:", {...message});
	message.shouldDelete = false;
};

const isSentByMe = (message: ChatMessage) => {
	return message.userId === myUser.value.id && message.userName === myUser.value.name;
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

watchEffect(() => {
	const thread = store.getActiveThread();
	let messages: ChatMessage[] = []
	isLoading.value = true;
	try {
		messages = thread.getMessagesArray();
		messages = parseMessagesHistory(messages, {
			forceShowKeywords: ["[ERROR]", "[WARNING]", "[INFO]"],
			excludeUserIds: thread.prefs.hiddenUserIds,
			maxMessages: undefined,
			maxDate: undefined,
		});
		messages = messages.filter((message: ChatMessage) => {
			return !(thread.prefs.hideIgnoredMessages && message.isIgnored);
		});
		// console.log("getThreadMessages->messages:", messages);
		if (messages.length > prevMessageCount.value) scrollToBottom(1000);
		prevMessageCount.value = messages.length;
	} catch (err: any) {
		console.error("Error loading chat thread", err);
		const threadVer = thread.appVersion?.trim();
		const appVer = getAppVersion();
		console.log("getThreadMessages->threadVer:", threadVer);
		console.log("getThreadMessages->appVer:", appVer);
		console.log(threadVer === appVer);
		let caption: string;
		if (threadVer && threadVer !== appVer) {
			caption = `Chat thread version (${threadVer}) does not match app version (${appVer}). `;
		} else {
			caption = "";
		}
		caption +=
			"If you recently updated the app, you may need to clear local storage, or create a new thread.";
		smartNotify(`Error loading a previously saved chat thread.`, caption);
	}

	threadMessages.value = messages;
	if (loadingTimeout) clearTimeout(loadingTimeout);
	loadingTimeout = setTimeout(() => {
		isLoading.value = false;
	}, 1500);
});

</script>
