<template>
    <q-linear-progress
            v-if="isLoading"
            color="primary"
            indeterminate/>

    <q-scroll-area ref="threadElem" :style="getScrollAreaStyle">
        <q-item-label v-bind="threadCaptionProps">
            {{ threadMessages.length.toString() + ' messages' }}
        </q-item-label>
        <div v-for="msg in threadMessages"
             :key="msg.dateCreated">
            <CustomChatMessage :msg="msg"/>
        </div>
    </q-scroll-area>
</template>

<script lang="ts" setup>
import {getAppVersion} from "src/util/Utils";
import {computed, Ref, ref, watch, watchEffect} from "vue";
import {smartNotify} from "src/util/SmartNotify";
import {parseMessagesHistory} from "src/util/chat/MessageHistory";
import {ChatMessage} from "src/util/chat/ChatMessage";
import {useChatStore} from "stores/chatStore";
import CustomChatMessage from "components/CustomChatMessage.vue";

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

const isLoading = ref(false);
let loadingTimeout: NodeJS.Timeout | undefined | null = null;

const prevMessageCount = ref(0)

const threadCaptionProps = {
	'class': "text-center q-py-md",
	overline: true,
	lines: 1,
}

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
