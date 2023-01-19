<template>
    <q-chat-message :avatar="msg.userAvatarUrl"
                    :bg-color="bgColor"
                    :name="userName"
                    :sent="isSentByMe"
                    :style="style"
                    size="6"
                    v-bind="msg"
                    @click="onClickMsg">
        <div v-for="textSnippet in parsedTextSnippets"
             :key="textSnippet"
             @click="copyClipboard(textSnippet)">
            <div v-for="text in textSnippet.split('\n')"
                 :key="text">
                        <span v-if="text.includes('http')">
                            <span v-for="chunk in text.split(' ')" :key="chunk"
                                  style="padding-right: 3.5px">
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
                {{ getTextHoverHint(textSnippet) }}
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
                    {{ getImageHoverHint(imageUrl) }}
                </q-tooltip>
            </q-card>
        </div>

        <div v-if="msg.loading">
            <q-spinner-dots class="q-ml-md" color="primary" size="2em"/>
            <q-tooltip :delay="750">
                {{ getLoadingHoverHint }}
            </q-tooltip>
        </div>

        <template v-slot:stamp>
            <div class="row items-center">
                <q-btn :disable="!canRegenerate()"
                       :icon="typeIcon"
                       class="q-ma-none q-pa-none"
                       color="blue-grey-8"
                       dense
                       flat
                       round
                       size="xs"
                       @click="regenMessage">
                    <q-tooltip v-if="canRegenerate()">
                        Re-generate message ({{ msg.userId }})
                    </q-tooltip>
                    <q-tooltip v-else>
                        This message cannot be re-generated ({{ msg.userId }})
                    </q-tooltip>
                </q-btn>

                <div class="text-caption text-blue-grey-10">
                    <q-item-label :lines="1">
                        {{ getStamp }}
                    </q-item-label>
                    <q-tooltip>
                        {{ hoverHint }}
                    </q-tooltip>
                </div>
                <q-space></q-space>

                <div v-if="shouldDelete" class="text-bold">Delete?</div>
                <q-btn v-if="!shouldDelete"
                       color="blue-grey-8"
                       dense
                       flat
                       icon="edit"
                       round
                       size="xs"
                       @click="editMessage">
                    <q-tooltip> Edit message</q-tooltip>
                </q-btn>
                <q-btn v-if="!shouldDelete"
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
                <q-btn :color="shouldDelete ? 'black' : 'blue-grey-8'"
                       :icon="shouldDelete ? 'delete_forever' : 'delete'"
                       dense
                       flat
                       round
                       size="xs"
                       @click="deleteMessage">
                    <q-tooltip>
                        {{ shouldDelete ? "Yes, delete" : "Delete" }}
                    </q-tooltip>
                </q-btn>
                <q-btn v-if="shouldDelete"
                       :color="shouldDelete ? 'black' : 'blue-grey-8'"
                       dense
                       flat
                       icon="restore"
                       round
                       size="xs"
                       @click="restoreMessage">
                    <q-tooltip> Restore</q-tooltip>
                </q-btn>
            </div>
        </template>
    </q-chat-message>
</template>
<script lang="ts" setup>
import {User} from "src/util/users/User";
import {dateToLocaleStr, dateToTimeAgo} from "src/util/DateUtils";
import {smartNotify} from "src/util/SmartNotify";
import {getSeededQColor} from "src/util/Colors";
import {useChatStore} from "stores/chatStore";
import {computed, ComputedRef, PropType, ref} from "vue";
import {copyClipboard} from "src/util/Utils";
import {getSingularOrPlural} from "src/util/TextUtils";
import {ChatMessage} from "src/util/chat/ChatMessage";

const props = defineProps({
	msgId: {
		type: String as PropType<string>,
		required: true
	}
});

const store = useChatStore();

const shouldDelete = ref(false);

const msg: ComputedRef<ChatMessage> = computed(() => store.getActiveThread().getMessageIdMap()[props.msgId]);

const onClickMsg = () => {
	console.log("onClickMsg:", {...msg.value});
	console.log("onClickMsg", {...msg.value.apiResponse?.data?.data});
};

const parsedTextSnippets = computed((): string[] => {
	const texts = msg.value.textSnippets.flatMap((snippet: string) => {
		return snippet.split("\n\n").map((line: string) => {
			return line.trim();
		});
	});
	if ((!texts || texts.length === 0) && !msg.value.loading) return [];
	return texts;
})

const editMessage = () => {
	smartNotify(`Message editing is not yet implemented`);
	console.warn("=> edit:", {...msg.value});
	// comp.editMessage(msg);
};

const canRegenerate = () => {
	if (shouldDelete.value) return false;
	return true
	// const msgIds = this.apiResponse?.prompt.messagesCtxIds;
	// if (msgIds) return msgIds.length > 0;
	// return false;
}

const regenMessage = () => {
	console.warn("*".repeat(40));
	console.log("regenMessage->message:", {...msg.value});
	store.handleUserMessage(msg.value, true);
};

const deleteMessage = () => {
	console.warn("=> delete:", {...msg.value});
	// 2nd click - confirmation and delete
	if (shouldDelete.value) {
		store.getActiveThread().deleteMessage(msg.value.id);
		return;
	}
	// 1st click - will need 2nd click to confirm
	shouldDelete.value = true;
};

const restoreMessage = () => {
	console.warn("=> restore:", {...msg.value});
	shouldDelete.value = false;
};

const isSentByMe = computed(() => {
	const myUser = store.getMyUser();
	return msg.value.userId === myUser.id && msg.value.userName === myUser.name;
})

const userName = computed((): string => {
	const user: User = store.getUserById(msg.value.userId);
	// return `${user.name} (${user.id})`;
	return user.name;
})

const typeIcon = computed(() => {
	const user: User = store.getUserById(msg.value.userId);
	if (!user) {
		const ic = 'send'
		console.error(`User "${msg.value.userId}" not found. Using default icon: '${ic}'`);
		return ic;
	}
	if (!user.icon) {
		const ic = 'help'
		console.warn(`User "${user.id}" icon not found. Using default icon: '${ic}'`);
		return ic;
	}
	return user.icon;
});

const getStamp = computed(() => {
	// const what = isSentByMe(msg) ? "Sent" : "Received";
	const on = dateToTimeAgo(msg.value.dateCreated);
	// let res = `${what} ${on}`;
	let res = `${on}`;
	// if (msg.isCompRegen) res = `* ${res}`;
	if (msg.value.apiResponse?.fromCache) res = `${res} (from cache)`;
	if (msg.value.apiResponse?.cacheIgnored) res = `${res} (cache ignored)`;
	return res;
})

const getTextHoverHint = (textSnippet?: string) => {
	const numTexts = msg.value.textSnippets?.length ?? 0;
	const numImages = msg.value.imageUrls?.length ?? 0;
	// const who = (isSentByMe(this) ? "You" : this.userName) + ` (${this.userId})`
	const who = msg.value.userName + ` (${msg.value.userId})`;
	const what = `${numTexts} ${getSingularOrPlural(
		"text",
		numTexts
	)} and ${numImages} ${getSingularOrPlural("image", numImages)}`;
	const when = dateToLocaleStr(msg.value.dateCreated);
	return `${who} sent ${what} on ${when}`;
	// return message.response?.prompt.text ?? fallback;
}

const getImageHoverHint = (imageUrl?: string) => {
	return getTextHoverHint();
}

const getLoadingHoverHint = computed(() => {
	return "Loading...";
})

const hoverHint = computed(() => {
	const when = dateToLocaleStr(msg.value.dateCreated);
	const what = isSentByMe.value ? "Sent" : "Received";
	let res = `${what} on ${when}`;
	const dateGenerated = msg.value.apiResponse?.data?.data?.created * 1000;
	if (dateGenerated) res += "\n\n" + ` [Generated on ${dateToLocaleStr(dateGenerated)}]`;
	return res;
});

const bgColor = computed(() => {
	if (shouldDelete.value) return "red-2";
	return isSentByMe.value ? null : getSeededQColor(msg.value.userName, 1, 2);
});

const style = computed(() => {
	if (msg.value.isIgnored)
		return {
			opacity: 0.5,
			// textDecoration: "line-through",
		};
	if (shouldDelete.value)
		return {
			outline: "2px dashed red",
			// borderRadius: "15px",
		};
	return {};
});

</script>