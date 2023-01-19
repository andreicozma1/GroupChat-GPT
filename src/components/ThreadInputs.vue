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
            <q-space />
            <q-space />
            <q-btn-group flat
                         rounded>
                <q-btn
                        color="light-blue"
                        icon-right="clear"
                        label="Reset Thread"
                        no-caps
                        outline
                        size="sm"
                        title="Clear all messages in the thread"
                        @click="store.getActiveThread().resetAll()"
                />
                <q-btn
                        color="green"
                        icon-right="cached"
                        label="Comp. Cache"
                        no-caps
                        outline
                        size="sm"
                        title="Clear completion cache for assistant responses"
                        @click="store.resetCachedResponses"
                />
                <q-btn
                        color="red"
                        icon-right="delete_forever"
                        label="Hard Reset"
                        no-caps
                        outline
                        size="sm"
                        title="Remove all data from browser local storage"
                        @click="store.clearAllData"
                />
            </q-btn-group>
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
				smartNotify("User message not found")
			}

			clearInterval(responseTimeout.value);
		}
	}, 500);
};

watch(userMsgStr, () => {
	// introduce a delay to detect if the user is typing.
	// The coordinator will not be called until the user stops typing for a while.
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
		store.resetAllThreads()
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
		console.log("Focusing input");
		userMsgEl.value.focus();
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
