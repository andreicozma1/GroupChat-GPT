<template>
    <q-chat-message
            :avatar="modelValue.userAvatarUrl"
            :bg-color="bgColor"
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

            <q-tooltip v-if="modelValue.apiResponse?.data?.usage"
                       :delay="750">
                {{ modelUsageStr() }}
            </q-tooltip>

            <q-badge v-if="modelValue.apiResponse && (modelValue.apiResponse.data === undefined || modelValue.apiResponse.error)"
                     color="red"
                     floating
                     label="Error"
                     rounded>
                <q-tooltip v-if="modelValue.apiResponse.error">
                    {{ apiErrorToString(modelValue.apiResponse.error) }}
                </q-tooltip>
                <q-tooltip v-else-if="modelValue.apiResponse.data === undefined">
                    Response data is undefined
                </q-tooltip>
                <q-tooltip v-else>
                    Unknown error
                </q-tooltip>
            </q-badge>
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
            </q-card>
        </div>


        <div v-if="loading">
            <q-spinner-dots class="q-ml-md"
                            color="primary"
                            size="2em" />
        </div>

        <template v-slot:name>
            <span class="row">
                <span class="text-weight-bold q-mr-xs">
                    {{ modelValue.userName }}
                </span>
                <q-badge v-if="modelValue.isIgnored"
                         color="orange"
                         label="Ignored"
                         v-bind="defaultBadgeProps">
                    <q-tooltip>
                        This message will be ignored in future prompts.
                    </q-tooltip>
                </q-badge>
                <q-badge :label="chatStore.getUserById(modelValue.userId)?.type.toUpperCase()"
                         color="green"
                         outline
                         rounded
                         v-bind="defaultBadgeProps">
                    <q-tooltip>
                        {{ modelUsageStr() }}
                    </q-tooltip>
                </q-badge>
            </span>

            <!--            <q-badge :label="parsedTextSnippets.length + ' text snippets'"-->
            <!--                     align="middle"-->
            <!--                     class="q-mx-xs"-->
            <!--                     color="primary"-->
            <!--                     outline-->
            <!--                     rounded-->
            <!--                     style="font-size: 0.7rem; padding: 0 3px">-->
            <!--            </q-badge>-->
            <!--            <q-badge :label="modelValue.imageUrls.length + ' images'"-->
            <!--                     align="middle"-->
            <!--                     class="q-mx-xs"-->
            <!--                     color="accent"-->
            <!--                     outline-->
            <!--                     rounded-->
            <!--                     style="font-size: 0.7rem; padding: 0 3px">-->
            <!--            </q-badge>-->
        </template>

        <template v-slot:stamp>
            <div class="row items-center justify-between">
                <q-btn :disable="!canRegenerate"
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
                        Re-handleApiRequest message ({{ modelValue.userId }})
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
                <q-space />
                <CompletionUsageBadges v-if="modelValue?.apiResponse?.data?.usage"
                                       :model-usage="modelValue?.apiResponse?.data?.usage" />
                <div>
                    <div v-if="shouldDelete"
                         class="text-bold">Delete?
                    </div>
                    <q-btn v-if="!shouldDelete"
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
                    <q-btn v-if="!shouldDelete"
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
                    <q-btn :color="shouldDelete ? 'black' : 'blue-grey-8'"
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
                    <q-btn v-if="shouldDelete"
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
            </div>
        </template>
    </q-chat-message>
</template>
<script lang="ts"
        setup>
import {dateToLocaleStr, dateToTimeAgo} from "src/util/DateUtils";
import {smartNotify} from "src/util/SmartNotify";
import {useChatStore} from "stores/chatStore";
import {computed, PropType, ref} from "vue";
import {apiErrorToString, copyClipboard} from "src/util/Utils";
import {User} from "src/util/chat/User";
import {Message} from "src/util/chat/Message";
import DateText from "components/DateText.vue";
import CompletionUsageBadges from "components/CompletionUsageBadges.vue";

const props = defineProps({
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

const chatStore = useChatStore();

const shouldDelete = ref(false);

const defaultBadgeProps = {
	style: "font-size: 0.6rem; padding: 0 5px; margin-bottom: 2px; margin-top: 2px; margin-left: 4px",
	align: "middle",
}

const onClickMsg = () => {
	console.log("onClickMsg:", {...props.modelValue});
	console.log("onClickMsg", {...props.modelValue?.apiResponse});
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
});

const onClickRegenerate = () => {
	console.warn("*".repeat(40));
	console.log("onClickRegenerate->message:", {...props.modelValue});
	chatStore.handleUserMessage(props.modelValue, true);
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
		chatStore.getActiveThread().deleteMessage(props.modelValue.id);
		return;
	}
	// 1st click - will need 2nd click to confirm
	shouldDelete.value = true;
};

const isSentByMe = computed(() => {
	const myUser = chatStore.getMyUser();
	return (
		props.modelValue.userId === myUser.id &&
		props.modelValue.userName === myUser.name
	);
});

const typeIcon = computed(() => {
	const user: User = chatStore.getUserById(props.modelValue.userId);
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
	if (props.modelValue.apiResponse?.fromCache) return '(from cache)';
	if (props.modelValue.apiResponse?.cacheIgnored) return '(cache ignored)';
	return undefined
}

const stampHoverHint = computed(() => {
	const dateGenerated = props.modelValue.apiResponse?.data?.created * 1000;
	if (dateGenerated) {
		return `Generated ${dateToTimeAgo(dateGenerated)} (${dateToLocaleStr(dateGenerated)})`;
	}
	let res = isSentByMe.value ? "Sent" : "Received";
	res += ` ${dateToTimeAgo(props.modelValue.dateCreated)} (${dateToLocaleStr(props.modelValue.dateCreated)})`;
	return res;
});

const modelUsageStr = () => {
	const usage = props.modelValue.apiResponse?.data?.usage;
	if (!usage) return undefined
	const keys = Object.keys(usage)
	if (keys.length === 0) return undefined
	return keys.map(key => `${key}: ${usage[key]} `).join('; ')
}

const bgColor = computed(() => {
	if (shouldDelete.value) return "red-2";
	return props.modelValue.getBackgroundColor()
});

const style = computed(() => {
	return {
		...props.style,
		borderRadius: "1.0rem",
		opacity: props.modelValue.isIgnored
			? chatStore.prefs.ignoredMessageOpacity.value
			: 1.0,
		outline: shouldDelete.value ? "2px solid red" : null,
	};
});
</script>
