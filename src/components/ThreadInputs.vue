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
                <DateText :modelValue="store.getDateCreated"
                          class="q-pl-md"
                          prefix="Created:" />
                <DateText :modelValue="store.getDateLastSaved"
                          class="q-pl-md"
                          prefix="Last Saved:" />
            </div>

            <q-space />
            <!--            <q-btn-group flat-->
            <!--                         rounded>-->
            <!--                <q-btn-->
            <!--                        color="orange"-->
            <!--                        icon-right="clear"-->
            <!--                        label="Reset Prefs"-->
            <!--                        no-caps-->
            <!--                        outline-->
            <!--                        size="sm"-->
            <!--                        title="Reset app preferences to default values"-->
            <!--                        @click="store.resetPrefs"-->
            <!--                />-->
            <!--                <q-btn-->
            <!--                        color="light-blue"-->
            <!--                        icon-right="clear"-->
            <!--                        label="Clear Thread Messages"-->
            <!--                        no-caps-->
            <!--                        outline-->
            <!--                        size="sm"-->
            <!--                        title="Clear all messages in the active thread"-->
            <!--                        @click="store.getActiveThread().clearMessages"-->
            <!--                />-->
            <!--                <q-btn-->
            <!--                        color="green"-->
            <!--                        icon-right="cached"-->
            <!--                        label="Clear Completion Cache"-->
            <!--                        no-caps-->
            <!--                        outline-->
            <!--                        size="sm"-->
            <!--                        title="Clear the global completion cache"-->
            <!--                        @click="store.clearCachedResponses"-->
            <!--                />-->
            <!--                <q-btn-->
            <!--                        color="red"-->
            <!--                        icon-right="delete_forever"-->
            <!--                        label="Hard Reset"-->
            <!--                        no-caps-->
            <!--                        outline-->
            <!--                        size="sm"-->
            <!--                        title="Reset all application data from local storage"-->
            <!--                        @click="store.clearAllData"-->
            <!--                />-->
            <!--            </q-btn-group>-->
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
                              @click="store.clearActiveThreadMessages" />
                <q-fab-action color="light-blue"
                              icon="forum"
                              label="Full Reset Active Thread"
                              size="sm"
                              title="Reset the active thread by clearing messages, joined users, and the thread preferences"
                              v-bind="fabActionProps"
                              @click="store.resetActiveThread" />

                <q-fab-action color="green"
                              icon="cached"
                              label="Clear Global Completion Cache Data"
                              size="sm"
                              title="Clear the global completion cache"
                              v-bind="fabActionProps"
                              @click="store.clearCachedResponses"
                />
                <q-fab-action color="orange"
                              icon="settings"
                              label="Reset Global Prefs Data"
                              title="Reset all app preferences to default values"
                              v-bind="fabActionProps"
                              @click="store.resetPrefs" />

                <q-fab-action color="orange"
                              icon="group"
                              label="Reset Global Users Data"
                              title="Reset all user data to default values"
                              v-bind="fabActionProps"
                              @click="store.resetAllUsers" />
                <q-fab-action color="red"
                              icon="delete_forever"
                              label="Full Reset App Data"
                              size="sm"
                              title="Reset all application data from local storage"
                              v-bind="fabActionProps"
                              @click="store.clearAllData"
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

const store = useChatStore();

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

const hideLabels = computed(() => {
	return !fab.value;
});

const fabActionProps = {
	hideLabel: hideLabels,
	labelPosition: "left",
	externalLabel: true,
}

const onClickFabAction = (e) => {
	smartNotify("onClickFabAction->e:", e);
};


const sendMessage = () => {
	if (!userMsgValid.value) return;
	console.warn("=".repeat(60));
	console.warn("=".repeat(60));
	console.warn("=> sendMessage:");
	if (userMsgObj.value === null) {
		userMsgObj.value = new Message(store.getMyUser());
	}
	userMsgObj.value.textSnippets.push(userMsgStr.value);
	userMsgStr.value = "";

	if (responseTimeout.value) clearInterval(responseTimeout.value);
	responseTimeout.value = setInterval(() => {
		if (!isTyping.value) {
			console.log("=> userMsgObj:", {...userMsgObj.value});
			if (userMsgObj.value !== null) {
				userMsgObj.value.loading = false;
				store.handleUserMessage(userMsgObj.value);
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
	if (isTypingTimeout.value) clearTimeout(isTypingTimeout.value);
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
		store.resetAllThreads();
		return;
	}
	// ctrl/cmd+shift+r clears cache
	if (e.key.toLowerCase() === "r" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
		e.preventDefault();
		store.clearAllData();
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
