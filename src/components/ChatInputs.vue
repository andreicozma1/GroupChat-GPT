<template>
    <q-card class="fixed-bottom">
        <q-card-section class="q-px-sm q-pt-sm q-pb-none">
            <q-input
                    ref="userMsgEl"
                    v-model="userMsgStr"
                    autofocus
                    autogrow
                    clearable
                    label="Message"
                    maxlength="2000"
                    outlined
                    type="textarea"
            />
        </q-card-section>
        <q-card-actions>
            <q-btn
                    :disable="!userMsgValid"
                    color="primary"
                    icon="send"
                    label="Send"
                    padding="5px 20px"
                    rounded
                    @click="sendMessage"
            />
            <div>
                <DateText :modelValue="chatStore.getDateCreated"
                          class="q-pl-md"
                          prefix="Created:" />
                <DateText :modelValue="chatStore.getDateLastSaved"
                          class="q-pl-md"
                          prefix="Last Saved:" />
            </div>

            <q-space />

            <q-fab v-model="fab"
                   class="q-mr-md"
                   color="primary"
                   direction="up"
                   icon="keyboard_arrow_up"
                   label="Reset Options"
                   padding="xs sm"
                   vertical-actions-align="right"
            >
                <q-fab-action color="light-blue"
                              icon="message"
                              label="Clear Active Thread Messages"
                              size="sm"
                              title="Clear all messages in the active thread"
                              v-bind="fabActionProps"
                              @click="chatStore.clearActiveThreadMessages" />
                <q-fab-action color="light-blue"
                              icon="forum"
                              label="Full Reset Active Thread"
                              size="sm"
                              title="Reset the active thread by clearing messages, joined users, and the thread preferences"
                              v-bind="fabActionProps"
                              @click="chatStore.resetActiveThread" />

                <q-fab-action color="green"
                              icon="cached"
                              label="Clear Global Completion Cache Data"
                              size="sm"
                              title="Clear the global completion cache"
                              v-bind="fabActionProps"
                              @click="chatStore.clearCachedResponses"
                />
                <q-fab-action color="orange"
                              icon="settings"
                              label="Reset Global Prefs Data"
                              title="Reset all app preferences to default values"
                              v-bind="fabActionProps"
                              @click="chatStore.resetPrefs" />

                <q-fab-action color="orange"
                              icon="group"
                              label="Reset Global Users Data"
                              title="Reset all user data to default values"
                              v-bind="fabActionProps"
                              @click="chatStore.resetAllUsers" />
                <q-fab-action color="red"
                              icon="delete_forever"
                              label="Full Reset App Data"
                              size="sm"
                              title="Reset all application data from local storage"
                              v-bind="fabActionProps"
                              @click="chatStore.clearAllData"
                />
            </q-fab>

        </q-card-actions>
    </q-card>
</template>
<script lang="ts"
        setup>
import {useChatStore} from "stores/chatStore";
import {computed, onBeforeUnmount, onMounted, ref, Ref, watch} from "vue";
import {QCard, QInput} from "quasar";
import {smartNotify} from "src/util/SmartNotify";
import {Message} from "src/util/chat/Message";
import DateText from "components/DateText.vue";

const chatStore = useChatStore();

const userMsgEl: Ref<QInput | null> = ref(null);
const userMsgStr = ref("");
const userMsgValid = computed(() => {
	return userMsgStr.value.trim().length > 0;
});

const userMsgObj: Ref<Message | null> = ref(null);

const isTyping = ref(false);
const isTypingTimeout: Ref = ref(null);
const responseTimeout: Ref = ref(null);

const fab = ref(false);

const fabActionProps = {
	labelPosition: "left",
	externalLabel: true,
}

const sendMessage = () => {
	if (!userMsgValid.value) {
		return;
	}
	console.warn("=".repeat(60));
	console.warn("=".repeat(60));
	console.warn("=> sendMessage:");
	if (userMsgObj.value === null) {
		userMsgObj.value = new Message(chatStore.getMyUser());
	}
	userMsgObj.value.textSnippets.push(userMsgStr.value);
	userMsgStr.value = "";

	if (responseTimeout.value) {
		clearInterval(responseTimeout.value);
	}
	responseTimeout.value = setInterval(() => {
		if (!isTyping.value) {
			console.log("=> userMsgObj:", {...userMsgObj.value});
			if (userMsgObj.value !== null) {
				userMsgObj.value.loading = false;
				chatStore.handleUserMessage(userMsgObj.value);
				userMsgObj.value = null;
			} else {
				console.error("User message not found");
				smartNotify("User message not found");
			}

			clearInterval(responseTimeout.value);
		}
	}, 500);
};

watch(userMsgStr, () => {
	// introduce a delay to detect if the promptUser is typing.
	// The coordinator will not be called until the promptUser stops typing for a while.
	isTyping.value = true;
	if (isTypingTimeout.value) {
		clearTimeout(isTypingTimeout.value);
	}
	isTypingTimeout.value = setTimeout(
		() => {
			isTyping.value = false;
		},
		userMsgValid.value ? 1000 : 250
	);
});

const kbShortcuts = (e: KeyboardEvent) => {
	// ctrl/cmd+shift+x clears thread
	if (e.key.toLowerCase() === "x" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
		e.preventDefault();
		chatStore.resetAllThreads();
		return;
	}
	// ctrl/cmd+shift+r clears cache
	if (e.key.toLowerCase() === "r" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
		e.preventDefault();
		chatStore.clearAllData();
		return;
	}
	// enter sends userMsgStr
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
		return;
	}
	// on escape first clear the input, then unfocus it
	if (e.key === "Escape") {
		if (userMsgEl.value) {
			if (userMsgStr.value) {
				userMsgStr.value = "";
			} else {
				userMsgEl.value.blur();
			}
			return;
		}
	}
	// if any number or letter is pressed, focus the input
	if (userMsgEl.value && e.key.match(/^[a-z0-9]$/i)) {
		// get the current input focus
		const activeEl = document.activeElement;
		if (activeEl?.id.toLowerCase() === "mainlayout") {
			console.log("Focusing input");
			userMsgEl.value.focus();
		}
		return;
	}
};

onMounted(() => {
	document.addEventListener("keydown", kbShortcuts);
});

onBeforeUnmount(() => {
	document.removeEventListener("keydown", kbShortcuts);
});
</script>
