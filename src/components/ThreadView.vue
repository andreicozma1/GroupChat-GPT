<template>

    <q-linear-progress v-if="isLoading"
                       color="primary"
                       indeterminate />

    <q-scroll-area ref="threadElem"
                   :style="scrollAreaStyle">
        <q-item-label v-bind="threadCaptionProps">
            {{ threadMessages.length.toString() + " messages" }}
        </q-item-label>

        <div v-for="msg in threadMessages"
             :key="msg.id">
            <CustomChatMessage
                    :class="msgClass(msg)"
                    :loading="msg.loading"
                    :model-value="msg"
                    :style="msgStyle(msg)"
                    @mouseenter="onMsgMouseOver(msg)"
                    @mouseleave="onMsgMouseOut(msg)"
            />
        </div>
    </q-scroll-area>

    <div v-if="msgContextIds.length"
         class="text-center">
    </div>
</template>

<script lang="ts"
        setup>
import {getAppVersion} from "src/util/Utils";
import {computed, Ref, ref, watch, watchEffect} from "vue";
import {smartNotify} from "src/util/SmartNotify";
import {useChatStore} from "stores/chatStore";
import CustomChatMessage from "components/ChatMessageElement.vue";
import {Message} from "src/util/chat/Message";
import {parseMessagesHistory} from "src/util/chat/MessageHistory";
import {colors, colorsRgba} from "quasar";
import {useInfoStore} from "stores/infoStore";
import {getSingularOrPlural} from "src/util/TextUtils";
import getPaletteColor = colors.getPaletteColor;
import textToRgb = colors.textToRgb;

const props = defineProps({
	scrollAreaStyle: {
		type: Object,
		required: false,
		default: null,
	},
});

const store = useChatStore();
const infoStore = useInfoStore();
const threadElem: any = ref(null);

const threadMessages: Ref<Message[]> = ref([]);

const isLoading = ref(false);
let loadingTimeout: NodeJS.Timeout | undefined | null = null;

const prevMessageCount = ref(0);

const threadCaptionProps = {
	class: "text-center q-py-md",
	overline: true,
	lines: 1,
};

const defaultBackgroundColor = textToRgb(getPaletteColor(Message.defaultBackgroundColor))
const msgContextParentColorRgba: Ref<colorsRgba> = ref(defaultBackgroundColor);
const msgContextIds: Ref<string[]> = ref([]);

const onMsgMouseOver = (msg: Message) => {
	if (msg.prompt?.messageContextIds) {
		const len = msg.prompt.messageContextIds.length;
		infoStore.setInfo(`${len} ${getSingularOrPlural("message", len)} in context`);
		msgContextIds.value = [...msg.prompt.messageContextIds, msg.id];
		msgContextParentColorRgba.value = textToRgb(getPaletteColor(msg.getBackgroundColor()))
	} else {
		console.warn("onMsgMouseOver: no context ids found for msg: ", msg);
	}
};

const onMsgMouseOut = (msg: Message) => {
	console.log("onMsgMouseOut->msg: ", {...msg});
	msgContextIds.value = [];
	msgContextParentColorRgba.value = defaultBackgroundColor;
	infoStore.resetInfo()
};

const msgStyle = (msg: Message) => {
	let style = {
		backgroundColor: 'transparent',
	};

	const contextIdx = msgContextIds.value.indexOf(msg.id);
	const r = msgContextParentColorRgba.value.r;
	const g = msgContextParentColorRgba.value.g;
	const b = msgContextParentColorRgba.value.b;
	if (contextIdx >= 0) {
		const ctxMsgAlphaMin = store.prefs.contextMessageOpacity.min;
		const ctxMsgAlphaMax = store.prefs.contextMessageOpacity.max;
		const ctxMsgAlphaDelta = (ctxMsgAlphaMax - ctxMsgAlphaMin) / (msgContextIds.value.length - 1);
		const ctxMsgAlpha = ctxMsgAlphaMin + (ctxMsgAlphaDelta * contextIdx);
		style = {
			...style,
			backgroundColor: `rgba(${r}, ${g}, ${b}, ${ctxMsgAlpha})`,
		};
	}
	return style;
};

const msgClass = (msg: Message) => {
	const contextIdx = msgContextIds.value.indexOf(msg.id);
	if (contextIdx >= 0) {
		return "transSlow"
	}
	return "transFast";
}

const scrollToBottom = (duration?: number) => {
	if (threadElem.value) {
		duration = duration ?? 750;
		// scroll to bottom. The element is q-scroll-area
		const size = threadElem.value.getScroll().verticalSize;
		threadElem.value.setScrollPosition("vertical", size, duration);
	}
};

const scrollAreaStyle = computed(() => {
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

watchEffect(() => {
	const thread = store.getActiveThread();
	let messages: Message[] = [];
	isLoading.value = true;
	try {
		messages = thread.getMessagesArray();
		messages = parseMessagesHistory(messages, {
			forceShowKeywords: ["[ERROR]", "[WARNING]", "[INFO]"],
			excludeUserIds: thread.prefs.hiddenUserIds,
			maxMessages: undefined,
			maxDate: undefined,
		});
		messages = messages.filter((message: Message) => {
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

watch(
	() => props.scrollAreaStyle,
	() => {
		scrollToBottom(1000);
	}
);
</script>
