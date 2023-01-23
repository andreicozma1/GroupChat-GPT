<template>
    <q-chat-message
            :avatar="messageUser?.getUserAvatarUrl() ?? 'person_off'"
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
                            <CustomTooltip>
                                {{ chunk }}
                            </CustomTooltip>
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

            <CustomTooltip v-if="modelValue.apiResponse?.data?.usage">
                {{ modelUsageStr() }}
            </CustomTooltip>

            <q-badge v-if="modelValue.apiResponse && (modelValue.apiResponse.data === undefined || modelValue.apiResponse.error)"
                     color="red"
                     floating
                     label="Error"
                     rounded>
                <CustomTooltip v-if="modelValue.apiResponse.error">
                    {{ apiErrorToString(modelValue.apiResponse.error) }}
                </CustomTooltip>
                <CustomTooltip v-else-if="modelValue.apiResponse.data === undefined">
                    Response data is undefined
                </CustomTooltip>
                <CustomTooltip v-else>
                    Unknown error
                </CustomTooltip>
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

        <template v-slot:avatar>
            <UserAvatar :url="messageUser?.getUserAvatarUrl()"
                        class="q-ml-xs q-mr-sm"
                        size="xl" />
        </template>

        <template v-slot:name>
            <div class="row items-center">
                <span class="text-weight-bold q-mr-xs">
                    {{ messageUser?.name ?? "Deleted User" }}
                </span>
                <q-chip :label="messageUser?.type?.toUpperCase()"
                        class="q-my-none"
                        color="green"
                        dense
                        outline
                        size="0.55rem">
                </q-chip>
                <q-chip v-if="modelValue.isIgnored"
                        class="q-my-none"
                        color="orange"
                        dense
                        label="Ignored"
                        size="0.55rem"
                        square>
                    <CustomTooltip>
                        This message will be ignored in future prompts.
                    </CustomTooltip>
                </q-chip>
            </div>

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
                    <CustomTooltip v-if="canRegenerate">
                        Re-generate completion
                    </CustomTooltip>
                    <CustomTooltip v-else>
                        Cannot regenerate completion
                    </CustomTooltip>
                </q-btn>

                <div class="text-caption text-blue-grey-10">
                    <DateText :modelValue="modelValue.dateCreated"
                              :suffix="getStamp()" />
                    <CustomTooltip>
                        {{ stampHoverHint }}
                    </CustomTooltip>
                </div>
                <q-space />
                <UsageBadges v-if="modelValue?.apiResponse?.data?.usage"
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
                        <CustomTooltip> Edit message</CustomTooltip>
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
                        <CustomTooltip>
                            {{ modelValue.isIgnored ? "Use message" : "Ignore message" }} in future contexts
                        </CustomTooltip>
                    </q-btn>
                    <q-btn :color="shouldDelete ? 'black' : 'blue-grey-8'"
                           :icon="shouldDelete ? 'delete_forever' : 'delete'"
                           dense
                           flat
                           round
                           size="xs"
                           @click.stop="toggleShouldDelete()"
                    >
                        <CustomTooltip>
                            {{ shouldDelete ? "Yes, delete" : "Delete message" }}
                        </CustomTooltip>
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
                        <CustomTooltip> Restore</CustomTooltip>
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
import {computed, ComputedRef, PropType, ref} from "vue";
import {apiErrorToString, copyClipboard} from "src/util/Utils";
import {User} from "src/util/chat/User";
import {Message} from "src/util/chat/Message";
import DateText from "components/DateText.vue";
import UsageBadges from "components/UsageBadges.vue";
import CustomTooltip from "components/CustomTooltip.vue";
import UserAvatar from "components/UserAvatar.vue";

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

const messageUser: ComputedRef<User | undefined> = computed(() => chatStore.getUserById(props.modelValue.userId));

const shouldDelete = ref(false);

const onClickMsg = () => {
	console.log("onClickMsg:", {...props.modelValue});
	console.log("onClickMsg", {...props.modelValue?.apiResponse});
};

const parsedTextSnippets = computed((): string[] => {
	const texts = props.modelValue.textSnippets.flatMap((snippet: string) => {
		// return snippet.split("\n\n").map((line: string) => {
		// 	return line.trim();
		// });
		return snippet.trim();
	});
	if ((!texts || texts.length === 0) && !props.loading) {
		return [];
	}
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
	chatStore.handleUserMessage(props.modelValue);
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
		chatStore.saveState()
		return;
	}
	// 1st click - will need 2nd click to confirm
	shouldDelete.value = true;
};

const isSentByMe = computed(() => {
	const myUser = chatStore.getMyUser();
	return props.modelValue.userId === myUser.id;
});

const typeIcon = computed(() => {
	const user: User | undefined = messageUser.value
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
	if (props.modelValue.apiResponse?.fromCache) {
		return '(from cache)';
	}
	if (props.modelValue.apiResponse?.cacheIgnored) {
		return '(cache ignored)';
	}
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
	if (!usage) {
		return undefined
	}
	const keys = Object.keys(usage)
	if (keys.length === 0) {
		return undefined
	}
	return keys.map(key => `${key}: ${usage[key]} `).join('; ')
}

const bgColor = computed(() => {
	if (shouldDelete.value) {
		return "red-2";
	}
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
