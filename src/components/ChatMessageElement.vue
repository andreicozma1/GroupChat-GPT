<template>
    <q-chat-message
            :avatar="modelValue.userAvatarUrl"
            :bg-color="bgColor"
            :name="userName"
            :sent="isSentByMe"
            :style="style"
            size="6"
            v-bind="modelValue"
            @click="onClickMsg">
        <div v-for="textSnippet in parsedTextSnippets"
             :key="textSnippet"
             @click="copyClipboard(textSnippet)">
            <div v-for="text in textSnippet.split('\n')"
                 :key="text">
                <span v-if="text.includes('http')">
                    <span v-for="chunk in text.split(' ')"
                          :key="chunk"
                          style="padding-right: 3.5px"
                    >
                        <a v-if="chunk.includes('http')"
                           :href="chunk"
                           target="_blank">
                            {{ chunk }}
                            <q-tooltip>{{ chunk }}</q-tooltip>
                        </a>
                        <span v-else>
                            {{ chunk }}
                        </span>
                    </span>
                </span>
                <span v-else>
                    {{ text }}
                </span>
            </div>
            <q-tooltip :delay="750">
                {{ getSnippetHoverHint(textSnippet) }}
            </q-tooltip>
        </div>

        <div v-if="modelValue.imageUrls.length > 0">
            <q-card v-for="imageUrl in modelValue.imageUrls"
                    :key="imageUrl"
                    class="bg-grey-1"
                    flat>
                <q-card-section class="q-pa-none">
                    <q-img
                            :src="imageUrl"
                            draggable
                            fit="contain"
                            style="max-height: 400px"
                    />
                </q-card-section>
                <q-tooltip :delay="750">
                    {{ getImageHoverHint(imageUrl) }}
                </q-tooltip>
            </q-card>
        </div>

        <div v-if="loading">
            <q-spinner-dots class="q-ml-md"
                            color="primary"
                            size="2em" />
            <q-tooltip :delay="750">
                {{ getLoadingHoverHint }}
            </q-tooltip>
        </div>

        <template v-slot:stamp>
            <div class="row items-center">
                <q-btn
                        :disable="!canRegenerate"
                        :icon="typeIcon"
                        class="q-ma-none q-pa-none"
                        color="blue-grey-8"
                        dense
                        flat
                        round
                        size="xs"
                        @click.stop="onClickRegenerate"
                >
                    <q-tooltip v-if="canRegenerate">
                        Re-generate message ({{ modelValue.userId }})
                    </q-tooltip>
                    <q-tooltip v-else>
                        This message cannot be re-generated ({{ modelValue.userId }})
                    </q-tooltip>
                </q-btn>

                <div class="text-caption text-blue-grey-10">
                    <DateText :modelValue="modelValue.dateCreated"
                              :suffix="getStamp()" />
                    <q-tooltip>
                        {{ stampHoverHint }}
                    </q-tooltip>
                </div>
                <q-space></q-space>

                <div v-if="shouldDelete"
                     class="text-bold">Delete?
                </div>
                <q-btn
                        v-if="!shouldDelete"
                        color="blue-grey-8"
                        dense
                        flat
                        icon="edit"
                        round
                        size="xs"
                        @click.stop="onClickEdit"
                >
                    <q-tooltip> Edit message</q-tooltip>
                </q-btn>
                <q-btn
                        v-if="!shouldDelete"
                        :icon="modelValue.isIgnored ? 'visibility' : 'visibility_off'"
                        color="blue-grey-8"
                        dense
                        flat
                        round
                        size="xs"
                        @click.stop="modelValue.toggleIgnored()"
                >
                    <q-tooltip>
                        {{ modelValue.isIgnored ? "Use message" : "Ignore message" }}
                    </q-tooltip>
                </q-btn>
                <q-btn
                        :color="shouldDelete ? 'black' : 'blue-grey-8'"
                        :icon="shouldDelete ? 'delete_forever' : 'delete'"
                        dense
                        flat
                        round
                        size="xs"
                        @click.stop="toggleShouldDelete()"
                >
                    <q-tooltip>
                        {{ shouldDelete ? "Yes, delete" : "Delete" }}
                    </q-tooltip>
                </q-btn>
                <q-btn
                        v-if="shouldDelete"
                        :color="shouldDelete ? 'black' : 'blue-grey-8'"
                        dense
                        flat
                        icon="restore"
                        round
                        size="xs"
                        @click.stop="toggleShouldDelete(false)"
                >
                    <q-tooltip> Restore</q-tooltip>
                </q-btn>
            </div>
        </template>
    </q-chat-message>
</template>
<script lang="ts"
        setup>
import {dateToLocaleStr} from "src/util/DateUtils";
import {smartNotify} from "src/util/SmartNotify";
import {getSeededQColor} from "src/util/Colors";
import {useChatStore} from "stores/chatStore";
import {computed, PropType, ref} from "vue";
import {copyClipboard} from "src/util/Utils";
import {getSingularOrPlural} from "src/util/TextUtils";
import {User} from "src/util/chat/User";
import {Message} from "src/util/chat/Message";
import DateText from "components/DateText.vue";

const props = defineProps({
	// msgId: {
	// 	type: String as PropType<string>,
	// 	required: true
	// }
	modelValue: {
		type: Object as PropType<Message>,
		required: true,
	},
	loading: {
		type: Boolean as PropType<boolean>,
		required: false,
		default: false,
	},
	style: {
		type: Object as PropType<Record<string, any>>,
		required: false,
		default: () => ({}),
	},
});

const store = useChatStore();

const shouldDelete = ref(false);

// const msg: ComputedRef<Message> = computed(() => store.getActiveThread().getMessageIdMap()[props.msgId]);

const onClickMsg = () => {
	console.log("onClickMsg:", {...props.modelValue});
	console.log("onClickMsg", {...props.modelValue.apiResponse?.data?.data});
};

const parsedTextSnippets = computed((): string[] => {
	const texts = props.modelValue.textSnippets.flatMap((snippet: string) => {
		return snippet.split("\n\n").map((line: string) => {
			return line.trim();
		});
	});
	if ((!texts || texts.length === 0) && !props.loading) return [];
	return texts;
});

const onClickEdit = () => {
	smartNotify(`Message editing is not yet implemented`);
	console.warn("=> edit:", {...props.modelValue});
	// comp.onClickEdit(msg);
};

const canRegenerate = computed(() => {
	return !shouldDelete.value;
	// const msgIds = this.apiResponse?.prompt.messageContextIds;
	// if (msgIds) return msgIds.length > 0;
	// return false;
});

const onClickRegenerate = () => {
	console.warn("*".repeat(40));
	console.log("onClickRegenerate->message:", {...props.modelValue});
	store.handleUserMessage(props.modelValue, true);
};

const toggleShouldDelete = (value?: boolean) => {
	console.warn("=> toggleDelete:", {...props.modelValue});
	if (value !== undefined) {
		console.log("here");
		shouldDelete.value = value;
		return;
	}
	// 2nd click - confirmation and delete
	if (shouldDelete.value) {
		console.log("=> delete:", {...props.modelValue});
		store.getActiveThread().deleteMessage(props.modelValue.id);
		return;
	}
	// 1st click - will need 2nd click to confirm
	shouldDelete.value = true;
};

const getSnippetHoverHint = (textSnippet?: string) => {
	const numTexts = props.modelValue.textSnippets?.length ?? 0;
	const numImages = props.modelValue.imageUrls?.length ?? 0;
	// const who = (isSentByMe(this) ? "You" : this.userName) + ` (${this.userId})`
	const who = props.modelValue.userName + ` (${props.modelValue.userId})`;
	const what = `${numTexts} ${getSingularOrPlural(
		"text",
		numTexts
	)} and ${numImages} ${getSingularOrPlural("image", numImages)}`;
	const when = dateToLocaleStr(props.modelValue.dateCreated);
	return `${who} sent ${what} on ${when}`;
	// return message.response?.prompt.finalPromptText ?? fallback;
};

const getImageHoverHint = (imageUrl?: string) => {
	return getSnippetHoverHint();
};

const getLoadingHoverHint = computed(() => {
	return "Loading...";
});

const isSentByMe = computed(() => {
	const myUser = store.getMyUser();
	return (
		props.modelValue.userId === myUser.id &&
		props.modelValue.userName === myUser.name
	);
});

const userName = computed((): string => {
	const user: User = store.getUserById(props.modelValue.userId);
	// return `${user.name} (${user.id})`;
	return user.name;
});

const typeIcon = computed(() => {
	const user: User = store.getUserById(props.modelValue.userId);
	if (!user) {
		const ic = "send";
		console.error(
			`User "${props.modelValue.userId}" not found. Using default icon: '${ic}'`
		);
		return ic;
	}
	if (!user.icon) {
		const ic = "help";
		console.warn(
			`User "${user.id}" icon not found. Using default icon: '${ic}'`
		);
		return ic;
	}
	return user.icon;
});

const getStamp = () => {
	// const what = isSentByMe(msg) ? "Sent" : "Received";
	// const on = dateToTimeAgo(props.modelValue.dateCreated);
	// let res = `${what} ${on}`;
	// let res = `${on}`;
	// if (msg.isCompRegen) res = `* ${res}`;
	if (props.modelValue.apiResponse?.fromCache) return '(from cache)';
	if (props.modelValue.apiResponse?.cacheIgnored) return '(cache ignored)';
	return undefined
}

const stampHoverHint = computed(() => {
	const when = dateToLocaleStr(props.modelValue.dateCreated);
	const what = isSentByMe.value ? "Sent" : "Received";
	let res = `${what} on ${when}`;
	const dateGenerated =
		props.modelValue.apiResponse?.data?.data?.created * 1000;
	if (dateGenerated)
		res += "\n\n" + ` [Generated on ${dateToLocaleStr(dateGenerated)}]`;
	return res;
});

const bgColor = computed(() => {
	if (shouldDelete.value) return "red-2";
	return isSentByMe.value
		? null
		: getSeededQColor(props.modelValue.userName, 1, 2);
});

const style = computed(() => {
	return {
		...props.style,
		borderRadius: "1.0rem",
		opacity: props.modelValue.isIgnored
			? store.prefs.ignoredMessageOpacity.value
			: 1,
		outline: shouldDelete.value ? "2px solid red" : null,
	};
});
</script>
